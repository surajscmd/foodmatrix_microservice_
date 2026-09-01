import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  OrderItemStatus,
  OrderStatus,
  OrderType,
  PaymentStatus,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderItemsService } from './order-items.service';

// ============================================================
// UPCOMING ORDER STATUSES
// Used by kitchen upcoming-order queue.
// READY and COMPLETED orders disappear from this list.
// ============================================================

const UPCOMING_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
];

// ============================================================
// ACTIVE ORDER STATUSES
// Used only to find an existing active DINE_IN order.
// READY is intentionally excluded because a READY order
// should not receive another order through the create flow.
// ============================================================

const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
];

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderItemsService: OrderItemsService,
  ) {}

  // ============================================================
  // GET UPCOMING ORDERS
  // GET /orders/kitchen/upcoming
  // ============================================================

  async getUpcomingOrders(restaurantId: string, page = 1, limit = 10) {
    const normalizedPage = Number.isInteger(page) && page > 0 ? page : 1;

    const normalizedLimit =
      Number.isInteger(limit) && limit > 0 && limit <= 100 ? limit : 10;

    const skip = (normalizedPage - 1) * normalizedLimit;

    const where: Prisma.OrderWhereInput = {
      restaurantId,
      status: {
        in: UPCOMING_ORDER_STATUSES,
      },
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,

        orderBy: {
          createdAt: 'asc',
        },

        skip,
        take: normalizedLimit,

        include: this.orderInclude(),
      }),

      this.prisma.order.count({
        where,
      }),
    ]);

    const totalPages = Math.ceil(total / normalizedLimit);

    return {
      message: 'Upcoming orders fetched successfully.',

      data: orders,

      pagination: {
        page: normalizedPage,

        limit: normalizedLimit,

        total,

        totalPages,

        hasNextPage: normalizedPage < totalPages,

        hasPreviousPage: normalizedPage > 1,
      },
    };
  }

  // ============================================================
  // CREATE ORDER
  // ============================================================

  async create(dto: CreateOrderDto, idempotencyKey: string) {
    const key = this.validateIdempotencyKey(idempotencyKey);

    this.validateOrderType(dto);

    // ----------------------------------------------------------
    // IDEMPOTENCY CHECK
    // ----------------------------------------------------------

    const existingOrder = await this.prisma.order.findUnique({
      where: {
        idempotencyKey: key,
      },

      include: this.orderInclude(),
    });

    if (existingOrder) {
      return {
        message: 'Order already exists. Returning the existing order.',
        data: existingOrder,
      };
    }

    // ----------------------------------------------------------
    // RESOLVE CATALOG DATA
    // ----------------------------------------------------------

    const lines = await this.orderItemsService.resolveOrderItems(
      dto.restaurantId,
      dto.items,
    );

    const totals = this.calculateTotals(lines);

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          // ----------------------------------------------------
          // IDEMPOTENCY CHECK AGAIN
          // ----------------------------------------------------

          const existing = await tx.order.findUnique({
            where: {
              idempotencyKey: key,
            },

            include: this.orderInclude(),
          });

          if (existing) {
            return {
              message: 'Order already exists. Returning the existing order.',
              data: existing,
            };
          }

          // ----------------------------------------------------
          // CUSTOMER
          // ----------------------------------------------------

          const customer = await tx.customer.upsert({
            where: {
              phone: dto.phone,
            },

            create: {
              phone: dto.phone,
              name: dto.name,
            },

            update: dto.name
              ? {
                  name: dto.name,
                }
              : {},
          });

          // ----------------------------------------------------
          // DINE-IN ACTIVE ORDER
          // ----------------------------------------------------

          if (dto.type === OrderType.DINE_IN) {
            const activeOrder = await tx.order.findFirst({
              where: {
                restaurantId: dto.restaurantId,

                tableId: dto.tableId,

                status: {
                  in: ACTIVE_ORDER_STATUSES,
                },
              },

              orderBy: {
                createdAt: 'desc',
              },
            });

            if (activeOrder) {
              // ----------------------------------------------
              // CHECK CUSTOMER
              // ----------------------------------------------

              if (activeOrder.customerId !== customer.id) {
                throw new ConflictException(
                  `Table ${dto.tableId} already has an active order.`,
                );
              }

              // ----------------------------------------------
              // CHECK PAYMENT
              // ----------------------------------------------

              const paidAmount = await this.getCompletedPaymentAmount(
                tx,
                activeOrder.id,
              );

              const currentTotal = new Prisma.Decimal(activeOrder.total);

              if (paidAmount.gte(currentTotal)) {
                throw new ConflictException(
                  'The existing table order is already fully paid. A new order must be created.',
                );
              }

              // ----------------------------------------------
              // MERGE / CREATE ITEMS
              // ----------------------------------------------

              await this.orderItemsService.mergeOrCreateOrderItems(
                tx,
                activeOrder.id,
                lines,
              );

              // ----------------------------------------------
              // RECALCULATE
              // ----------------------------------------------

              const newSubtotal = new Prisma.Decimal(activeOrder.subtotal).plus(
                totals.subtotal,
              );

              const newTotal = this.calculateOrderTotal(
                newSubtotal,
                activeOrder.discount,
                activeOrder.tax,
              );

              const updatedOrder = await tx.order.update({
                where: {
                  id: activeOrder.id,
                },

                data: {
                  subtotal: newSubtotal,

                  total: newTotal,
                },

                include: this.orderInclude(),
              });

              return {
                message:
                  'Items added to the existing active table order successfully.',
                data: updatedOrder,
              };
            }
          }

          // ----------------------------------------------------
          // CREATE NEW ORDER
          // ----------------------------------------------------

          const order = await tx.order.create({
            data: {
              restaurantId: dto.restaurantId,

              customerId: customer.id,

              type: dto.type,

              tableId: dto.type === OrderType.DINE_IN ? dto.tableId! : null,

              idempotencyKey: key,

              status: OrderStatus.PENDING,

              subtotal: totals.subtotal,

              discount: totals.discount,

              tax: totals.tax,

              total: totals.total,

              items: {
                create: lines.map((line) => ({
                  menuItemId: line.menuItemId,

                  name: line.name,

                  price: line.price,

                  quantity: line.quantity,

                  total: line.total,

                  status: OrderItemStatus.PENDING,

                  modifiers: {
                    create: line.modifiers.map((modifier) => ({
                      modifierId: modifier.modifierId,

                      name: modifier.name,

                      price: modifier.price,

                      quantity: modifier.quantity,
                    })),
                  },
                })),
              },
            },

            include: this.orderInclude(),
          });

          return {
            message: 'Order created successfully.',
            data: order,
          };
        },

        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,

          maxWait: 5000,

          timeout: 10000,
        },
      );
    } catch (error) {
      return this.handleCreateError(error, key);
    }
  }

  // ============================================================
  // GET ORDER
  // ============================================================

  async findOne(orderId: string) {
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
      message: 'Order fetched successfully.',

      data: order,
    };
  }

  // ============================================================
  // CONFIRM
  // PENDING -> CONFIRMED
  // ============================================================

  async confirm(orderId: string) {
    const order = await this.transition(
      orderId,
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
    );

    return {
      message: 'Order confirmed successfully.',
      data: order,
    };
  }

  // ============================================================
  // PREPARE
  // CONFIRMED -> PREPARING
  // ============================================================

  async prepare(orderId: string) {
    await this.transition(
      orderId,
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
    );

    // All currently pending items
    // start preparing.

    await this.prisma.orderItem.updateMany({
      where: {
        orderId,

        status: OrderItemStatus.PENDING,
      },

      data: {
        status: OrderItemStatus.PREPARING,
      },
    });

    // Fetch again so response contains
    // the updated item statuses.

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
      message: 'Order moved to preparing successfully.',
      data: order,
    };
  }

  // ============================================================
  // READY
  // PREPARING -> READY
  // ============================================================

  async ready(orderId: string) {
    const items = await this.prisma.orderItem.findMany({
      where: {
        orderId,
      },

      select: {
        status: true,
      },
    });

    if (items.length === 0) {
      throw new BadRequestException('Order must contain at least one item.');
    }

    const hasIncompleteItems = items.some(
      (item) =>
        item.status !== OrderItemStatus.READY &&
        item.status !== OrderItemStatus.CANCELLED,
    );

    if (hasIncompleteItems) {
      throw new BadRequestException(
        'All order items must be READY or CANCELLED before the order can be marked READY.',
      );
    }

    const order = await this.transition(
      orderId,
      OrderStatus.PREPARING,
      OrderStatus.READY,
    );

    return {
      message: 'Order marked as ready successfully.',
      data: order,
    };
  }

  // ============================================================
  // COMPLETE
  // READY -> COMPLETED
  // ============================================================

  async complete(orderId: string) {
    const order = await this.prisma.$transaction(
      async (tx) => {
        const current = await tx.order.findUnique({
          where: {
            id: orderId,
          },
        });

        if (!current) {
          throw new NotFoundException('Order not found.');
        }

        if (current.status !== OrderStatus.READY) {
          throw new BadRequestException(
            `Order must be READY before completion. Current status: ${current.status}.`,
          );
        }

        const paidAmount = await this.getCompletedPaymentAmount(tx, orderId);

        const total = new Prisma.Decimal(current.total);

        if (paidAmount.lt(total)) {
          const remaining = total.minus(paidAmount);

          throw new BadRequestException(
            `Order cannot be completed. Remaining payment: ${remaining.toFixed(2)}.`,
          );
        }

        await tx.order.update({
          where: {
            id: orderId,
          },

          data: {
            status: OrderStatus.COMPLETED,
          },
        });

        return tx.order.findUnique({
          where: {
            id: orderId,
          },

          include: this.orderInclude(),
        });
      },

      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    return {
      message: 'Order completed successfully.',
      data: order,
    };
  }

  // ============================================================
  // CANCEL
  // ============================================================

  async cancel(orderId: string, reason: string) {
    const cleanReason = reason?.trim();

    if (!cleanReason) {
      throw new BadRequestException('Cancellation reason is required.');
    }

    if (cleanReason.length > 500) {
      throw new BadRequestException(
        'Cancellation reason must not exceed 500 characters.',
      );
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: {
          id: orderId,
        },
      });

      if (!current) {
        throw new NotFoundException('Order not found.');
      }

      if (current.status !== OrderStatus.PENDING) {
        throw new BadRequestException('Only PENDING orders can be cancelled.');
      }

      const paidAmount = await this.getCompletedPaymentAmount(tx, orderId);

      if (paidAmount.gt(new Prisma.Decimal(0))) {
        throw new ConflictException(
          'Paid orders cannot be cancelled until the payment is refunded.',
        );
      }

      return tx.order.update({
        where: {
          id: orderId,
        },

        data: {
          status: OrderStatus.CANCELLED,

          cancelledAt: new Date(),

          cancelReason: cleanReason,
        },

        include: this.orderInclude(),
      });
    });

    return {
      message: 'Order cancelled successfully.',
      data: order,
    };
  }

  // ============================================================
  // STATUS TRANSITION
  // ============================================================

  private async transition(
    orderId: string,
    from: OrderStatus,
    to: OrderStatus,
  ) {
    const result = await this.prisma.order.updateMany({
      where: {
        id: orderId,
        status: from,
      },

      data: {
        status: to,
      },
    });

    if (result.count === 1) {
      const order = await this.prisma.order.findUnique({
        where: {
          id: orderId,
        },

        include: this.orderInclude(),
      });

      if (!order) {
        throw new NotFoundException('Order not found.');
      }

      return order;
    }

    const order = await this.prisma.order.findUnique({
      where: {
        id: orderId,
      },

      select: {
        id: true,
        status: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    throw new BadRequestException(
      `Order cannot move from ${order.status} to ${to}.`,
    );
  }

  // ============================================================
  // VALIDATE ORDER TYPE
  // ============================================================

  private validateOrderType(dto: CreateOrderDto): void {
    if (dto.type === OrderType.DINE_IN && !dto.tableId) {
      throw new BadRequestException(
        'Table number is required for dine-in orders.',
      );
    }

    if (dto.type !== OrderType.DINE_IN && dto.tableId) {
      throw new BadRequestException(
        'Table number is only allowed for dine-in orders.',
      );
    }
  }

  // ============================================================
  // PAYMENT TOTAL
  // ============================================================

  private async getCompletedPaymentAmount(
    client: PrismaService | Prisma.TransactionClient,
    orderId: string,
  ): Promise<Prisma.Decimal> {
    const result = await client.payment.aggregate({
      where: {
        orderId,

        status: PaymentStatus.COMPLETED,
      },

      _sum: {
        amount: true,
      },
    });

    return new Prisma.Decimal(result._sum.amount ?? 0);
  }

  // ============================================================
  // IDEMPOTENCY KEY
  // ============================================================

  private validateIdempotencyKey(key: string): string {
    const normalized = key?.trim();

    if (!normalized) {
      throw new BadRequestException('Idempotency-Key header is required.');
    }

    if (normalized.length > 255) {
      throw new BadRequestException(
        'Idempotency-Key must not exceed 255 characters.',
      );
    }

    return normalized;
  }

  // ============================================================
  // CALCULATE TOTALS
  // ============================================================

  private calculateTotals(
    lines: {
      total: Prisma.Decimal;
    }[],
  ) {
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
  // CREATE ERROR HANDLER
  // ============================================================

  private async handleCreateError(error: unknown, key: string) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const existing = await this.prisma.order.findUnique({
          where: {
            idempotencyKey: key,
          },

          include: this.orderInclude(),
        });

        if (existing) {
          return {
            message: 'Order already exists. Returning the existing order.',
            data: existing,
          };
        }
      }

      if (error.code === 'P2034') {
        throw new ConflictException(
          'Order creation conflicted with another transaction. Please retry using the same Idempotency-Key.',
        );
      }
    }

    throw error;
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
