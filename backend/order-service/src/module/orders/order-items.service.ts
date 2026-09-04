import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  OrderItemStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service';

import { CreateOrderItemDto } from './dto/create-order.dto';

import { AddOrderItemsDto } from './dto/add-order-items.dto';

import { UpdateOrderItemStatusDto } from './dto/update-order-item-status.dto';

import { CatalogGatewayService } from '../../utils/catalog-gateway.service';

import { areModifiersEqual } from '../../utils/order-item.util';
import { KafkaService } from '../../kafka/kafka.service';

// ============================================================
// EDITABLE ORDER STATUSES
// ============================================================

const EDITABLE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
];

// ============================================================
// RESOLVED TYPES
// ============================================================

export interface ResolvedModifier {
  modifierId: string;
  name: string;
  price: Prisma.Decimal;
  quantity: number;
}

export interface ResolvedOrderLine {
  menuItemId: string;
  name: string;
  price: Prisma.Decimal;
  quantity: number;
  modifiers: ResolvedModifier[];
  total: Prisma.Decimal;
}

@Injectable()
export class OrderItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogGatewayService,
    private readonly kafkaService: KafkaService,
  ) {}

  // ============================================================
  // ADD ITEMS
  // POST /orders/:id/items
  // ============================================================

  async addItems(orderId: string, dto: AddOrderItemsDto) {
    const order = await this.prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    this.ensureOrderCanBeModified(order.status);

    await this.ensureNoCompletedPayment(this.prisma, orderId);

    const lines = await this.resolveOrderItems(order.restaurantId, dto.items);

    const totals = this.calculateTotals(lines);

    const updatedOrder = await this.prisma.$transaction(
      async (tx) => {
        const current = await tx.order.findUnique({
          where: {
            id: orderId,
          },
        });

        if (!current) {
          throw new NotFoundException('Order not found.');
        }

        this.ensureOrderCanBeModified(current.status);

        await this.ensureNoCompletedPayment(tx, orderId);

        await this.mergeOrCreateOrderItems(tx, orderId, lines);

        const subtotal = new Prisma.Decimal(current.subtotal).plus(
          totals.subtotal,
        );

        const total = this.calculateOrderTotal(
          subtotal,
          current.discount,
          current.tax,
        );

        return tx.order.update({
          where: {
            id: orderId,
          },

          data: {
            subtotal,
            total,
          },

          include: this.orderInclude(),
        });
      },

      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,

        maxWait: 5000,
        timeout: 10000,
      },
    );

    return {
      message: 'Items added to the order successfully.',
      data: updatedOrder,
    };
  }

  // ============================================================
  // REMOVE ORDER ITEM
  // DELETE /orders/:id/items/:itemId
  // ============================================================

  async removeItem(orderId: string, orderItemId: string) {
    const updatedOrder = await this.prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: {
            id: orderId,
          },
        });

        if (!order) {
          throw new NotFoundException('Order not found.');
        }

        this.ensureOrderCanBeModified(order.status);

        await this.ensureNoCompletedPayment(tx, orderId);

        const orderItem = await tx.orderItem.findFirst({
          where: {
            id: orderItemId,
            orderId,
          },
        });

        if (!orderItem) {
          throw new NotFoundException('Order item not found in this order.');
        }

        await tx.orderItem.delete({
          where: {
            id: orderItem.id,
          },
        });

        const remainingItems = await tx.orderItem.findMany({
          where: {
            orderId,
          },
        });

        if (remainingItems.length === 0) {
          throw new BadRequestException(
            'An order must contain at least one item.',
          );
        }

        return this.recalculateOrder(tx, order);
      },

      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,

        maxWait: 5000,
        timeout: 10000,
      },
    );

    return {
      message: 'Order item removed successfully.',
      data: updatedOrder,
    };
  }

  // ============================================================
  // REMOVE MODIFIER
  // DELETE /orders/:id/items/:itemId/modifiers/:modifierId
  // ============================================================

  async removeModifier(
    orderId: string,
    orderItemId: string,
    orderItemModifierId: string,
  ) {
    const updatedOrder = await this.prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: {
            id: orderId,
          },
        });

        if (!order) {
          throw new NotFoundException('Order not found.');
        }

        this.ensureOrderCanBeModified(order.status);

        await this.ensureNoCompletedPayment(tx, orderId);

        const orderItem = await tx.orderItem.findFirst({
          where: {
            id: orderItemId,
            orderId,
          },

          include: {
            modifiers: true,
          },
        });

        if (!orderItem) {
          throw new NotFoundException('Order item not found in this order.');
        }

        const modifier = orderItem.modifiers.find(
          (item) => item.id === orderItemModifierId,
        );

        if (!modifier) {
          throw new NotFoundException('Modifier not found in this order item.');
        }

        await tx.orderItemModifier.delete({
          where: {
            id: orderItemModifierId,
          },
        });

        const remainingModifiers = orderItem.modifiers.filter(
          (item) => item.id !== orderItemModifierId,
        );

        const itemTotal = this.calculateOrderItemTotal(
          orderItem.price,
          orderItem.quantity,
          remainingModifiers,
        );

        await tx.orderItem.update({
          where: {
            id: orderItemId,
          },

          data: {
            total: itemTotal,
          },
        });

        return this.recalculateOrder(tx, order);
      },

      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,

        maxWait: 5000,
        timeout: 10000,
      },
    );

    return {
      message: 'Modifier removed successfully.',
      data: updatedOrder,
    };
  }

  // ============================================================
  // KITCHEN - UPDATE ORDER ITEM STATUS
  // PATCH /orders/:id/kitchen/items/:itemId/status
  // ============================================================

  async updateItemStatus(
    orderId: string,
    orderItemId: string,
    status: UpdateOrderItemStatusDto['status'],
  ) {
    const result = await this.prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: {
            id: orderId,
          },
        });

        if (!order) {
          throw new NotFoundException('Order not found.');
        }

        // Kitchen item status changes happen
        // while the overall order is PREPARING.

        if (order.status !== OrderStatus.PREPARING) {
          throw new BadRequestException(
            `Kitchen cannot update items when order status is ${order.status}.`,
          );
        }

        const orderItem = await tx.orderItem.findFirst({
          where: {
            id: orderItemId,
            orderId,
          },
        });

        if (!orderItem) {
          throw new NotFoundException('Order item not found in this order.');
        }

        this.validateItemStatusTransition(orderItem.status, status);

        const updatedItem = await tx.orderItem.update({
          where: {
            id: orderItemId,
          },

          data: {
            status,
          },

          include: {
            modifiers: true,
          },
        });

        // ----------------------------------------------------
        // IF ALL ITEMS ARE READY/CANCELLED,
        // ORDER BECOMES READY.
        // ----------------------------------------------------

        const items = await tx.orderItem.findMany({
          where: {
            orderId,
          },

          select: {
            status: true,
          },
        });

        const allFinished =
          items.length > 0 &&
          items.every(
            (item) =>
              item.status === OrderItemStatus.READY ||
              item.status === OrderItemStatus.CANCELLED,
          );

        if (allFinished) {
          await tx.order.updateMany({
            where: {
              id: orderId,
              status: OrderStatus.PREPARING,
            },

            data: {
              status: OrderStatus.READY,
            },
          });
        }

        // ----------------------------------------------------
        // KAFKA EVENT
        // ONLY WHEN ITEM ACTUALLY BECOMES READY
        // ----------------------------------------------------

        const kafkaEvent =
          orderItem.status !== OrderItemStatus.READY &&
          status === OrderItemStatus.READY
            ? {
                orderItemId: updatedItem.id,
                menuItemId: updatedItem.menuItemId,
                quantity: updatedItem.quantity,

                modifiers: updatedItem.modifiers.map((modifier) => ({
                  modifierId: modifier.modifierId,
                  quantity: modifier.quantity,
                })),

                restaurantId: order.restaurantId,
              }
            : null;
        return { item: updatedItem, kafkaEvent };
      },

      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,

        maxWait: 5000,
        timeout: 10000,
      },
    );

    // --------------------------------------------------------
    // PUBLISH AFTER DATABASE TRANSACTION COMMITS
    // --------------------------------------------------------

    if (result.kafkaEvent) {
      await this.kafkaService.publish('order-complete', result.kafkaEvent);
    }

    // --------------------------------------------------------
    // FETCH COMPLETE ORDER
    // --------------------------------------------------------

    const order = await this.prisma.order.findUnique({
      where: {
        id: orderId,
      },

      include: this.orderInclude(),
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    return {
      message: 'Order item status updated successfully.',

      data: {
        item: result.item,
        order,
      },
    };
  }

  // ============================================================
  // RESOLVE CATALOG DATA
  // ============================================================

  async resolveOrderItems(
    restaurantId: string,
    items: CreateOrderItemDto[],
  ): Promise<ResolvedOrderLine[]> {
    const menuItemIds = [...new Set(items.map((item) => item.menuItemId))];

    const modifierIds = [
      ...new Set(
        items.flatMap((item) =>
          (item.modifiers ?? []).map((modifier) => modifier.modifierId),
        ),
      ),
    ];

    const catalog = await this.catalog.getBulkPricing(
      restaurantId,
      menuItemIds,
      modifierIds,
    );

    const menuItemMap = new Map(
      catalog.menuItems.map((item) => [item.menuItemId, item]),
    );

    const modifierMap = new Map(
      catalog.modifiers.map((modifier) => [modifier.id, modifier]),
    );

    return items.map((item): ResolvedOrderLine => {
      const menuItem = menuItemMap.get(item.menuItemId);

      if (!menuItem) {
        throw new NotFoundException(
          `Menu item ${item.menuItemId} was not found.`,
        );
      }

      const modifiers: ResolvedModifier[] = (item.modifiers ?? []).map(
        (requestedModifier): ResolvedModifier => {
          const modifier = modifierMap.get(requestedModifier.modifierId);

          if (!modifier) {
            throw new NotFoundException(
              `Modifier ${requestedModifier.modifierId} was not found.`,
            );
          }

          return {
            modifierId: modifier.id,

            name: modifier.name,

            price: new Prisma.Decimal(modifier.extraPrice),

            quantity: requestedModifier.quantity,
          };
        },
      );

      const menuPrice = new Prisma.Decimal(menuItem.price);

      const menuTotal = menuPrice.mul(item.quantity);

      const modifierTotal = modifiers.reduce(
        (total, modifier) =>
          total.plus(modifier.price.mul(modifier.quantity).mul(item.quantity)),
        new Prisma.Decimal(0),
      );

      return {
        menuItemId: menuItem.menuItemId,

        name: menuItem.name,

        price: menuPrice,

        quantity: item.quantity,

        modifiers,

        total: menuTotal.plus(modifierTotal),
      };
    });
  }

  // ============================================================
  // MERGE OR CREATE
  // ============================================================

  async mergeOrCreateOrderItems(
    tx: Prisma.TransactionClient,
    orderId: string,
    lines: ResolvedOrderLine[],
  ): Promise<void> {
    const existingItems = await tx.orderItem.findMany({
      where: {
        orderId,
      },

      include: {
        modifiers: true,
      },
    });

    for (const line of lines) {
      // --------------------------------------------------------
      // IMPORTANT:
      // Only PENDING identical items are merged.
      //
      // If an existing item is already PREPARING/READY,
      // a newly-added identical item gets its own PENDING row.
      //
      // This lets kitchen see the new quantity as a
      // separate kitchen task.
      // --------------------------------------------------------

      const existingItem = existingItems.find(
        (item) =>
          item.status === OrderItemStatus.PENDING &&
          item.menuItemId === line.menuItemId &&
          areModifiersEqual(item.modifiers, line.modifiers),
      );

      // --------------------------------------------------------
      // MERGE
      // --------------------------------------------------------

      if (existingItem) {
        const newQuantity = existingItem.quantity + line.quantity;

        const newTotal = this.calculateOrderItemTotal(
          existingItem.price,
          newQuantity,
          existingItem.modifiers,
        );

        await tx.orderItem.update({
          where: {
            id: existingItem.id,
          },

          data: {
            quantity: newQuantity,

            total: newTotal,
          },
        });

        existingItem.quantity = newQuantity;

        existingItem.total = newTotal;

        continue;
      }

      // --------------------------------------------------------
      // CREATE NEW PENDING KITCHEN ITEM
      // --------------------------------------------------------

      const createdItem = await tx.orderItem.create({
        data: {
          orderId,

          menuItemId: line.menuItemId,

          name: line.name,

          price: line.price,

          quantity: line.quantity,

          total: line.total,

          status: OrderItemStatus.PENDING,

          modifiers: {
            create: line.modifiers.map((modifier: ResolvedModifier) => ({
              modifierId: modifier.modifierId,

              name: modifier.name,

              price: modifier.price,

              quantity: modifier.quantity,
            })),
          },
        },

        include: {
          modifiers: true,
        },
      });

      existingItems.push(createdItem);
    }
  }

  // ============================================================
  // RECALCULATE ORDER
  // ============================================================

  private async recalculateOrder(
    tx: Prisma.TransactionClient,
    order: {
      id: string;
      discount: Prisma.Decimal;
      tax: Prisma.Decimal;
    },
  ) {
    const items = await tx.orderItem.findMany({
      where: {
        orderId: order.id,
      },
    });

    if (items.length === 0) {
      throw new BadRequestException('An order must contain at least one item.');
    }

    const subtotal = items.reduce(
      (sum, item) => sum.plus(item.total),

      new Prisma.Decimal(0),
    );

    const total = this.calculateOrderTotal(subtotal, order.discount, order.tax);

    return tx.order.update({
      where: {
        id: order.id,
      },

      data: {
        subtotal,
        total,
      },

      include: this.orderInclude(),
    });
  }

  // ============================================================
  // ORDER ITEM TOTAL
  // ============================================================

  private calculateOrderItemTotal(
    price: Prisma.Decimal,
    quantity: number,
    modifiers: readonly {
      price: Prisma.Decimal;
      quantity: number;
    }[],
  ): Prisma.Decimal {
    const menuTotal = new Prisma.Decimal(price).mul(quantity);

    const modifierTotal = modifiers.reduce(
      (total, modifier) =>
        total.plus(
          new Prisma.Decimal(modifier.price)
            .mul(modifier.quantity)
            .mul(quantity),
        ),

      new Prisma.Decimal(0),
    );

    return menuTotal.plus(modifierTotal);
  }

  // ============================================================
  // CALCULATE TOTALS
  // ============================================================

  private calculateTotals(lines: ResolvedOrderLine[]) {
    const subtotal = lines.reduce(
      (sum, line) => sum.plus(line.total),

      new Prisma.Decimal(0),
    );

    const discount = new Prisma.Decimal(0);

    const tax = new Prisma.Decimal(0);

    return {
      subtotal,

      discount,

      tax,

      total: subtotal.minus(discount).plus(tax),
    };
  }

  // ============================================================
  // CALCULATE ORDER TOTAL
  // ============================================================

  private calculateOrderTotal(
    subtotal: Prisma.Decimal,
    discount: Prisma.Decimal,
    tax: Prisma.Decimal,
  ): Prisma.Decimal {
    return subtotal
      .minus(new Prisma.Decimal(discount))
      .plus(new Prisma.Decimal(tax));
  }

  // ============================================================
  // ORDER MODIFICATION RULE
  // ============================================================

  private ensureOrderCanBeModified(status: OrderStatus): void {
    if (!EDITABLE_ORDER_STATUSES.includes(status)) {
      throw new BadRequestException(
        `Order items cannot be modified when order status is ${status}.`,
      );
    }
  }

  // ============================================================
  // PAYMENT CHECK
  // ============================================================

  private async ensureNoCompletedPayment(
    client: PrismaService | Prisma.TransactionClient,
    orderId: string,
  ): Promise<void> {
    const result = await client.payment.aggregate({
      where: {
        orderId,

        status: PaymentStatus.COMPLETED,
      },

      _sum: {
        amount: true,
      },
    });

    const paidAmount = new Prisma.Decimal(result._sum.amount ?? 0);

    if (paidAmount.gt(new Prisma.Decimal(0))) {
      throw new ConflictException(
        'Order items cannot be modified after payment has been made.',
      );
    }
  }

  // ============================================================
  // ITEM STATUS TRANSITION
  // ============================================================

  private validateItemStatusTransition(
    current: OrderItemStatus,
    next: OrderItemStatus,
  ): void {
    if (current === next) {
      return;
    }

    const allowedTransitions: Record<OrderItemStatus, OrderItemStatus[]> = {
      [OrderItemStatus.PENDING]: [
        OrderItemStatus.PREPARING,
        OrderItemStatus.CANCELLED,
      ],

      [OrderItemStatus.PREPARING]: [
        OrderItemStatus.READY,
        OrderItemStatus.CANCELLED,
      ],

      [OrderItemStatus.READY]: [],

      [OrderItemStatus.CANCELLED]: [],
    };

    if (!allowedTransitions[current].includes(next)) {
      throw new BadRequestException(
        `Order item cannot move from ${current} to ${next}.`,
      );
    }
  }

  // ============================================================
  // COMMON INCLUDE
  // ============================================================

  private orderInclude(): Prisma.OrderInclude {
    return {
      customer: true,

      items: {
        orderBy: {
          id: 'asc',
        },

        include: {
          modifiers: true,
        },
      },

      payments: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    };
  }
}
