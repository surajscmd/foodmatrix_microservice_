import { createHash } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
  async listRegisterOrders(
    restaurantId: string,
    page: number,
    view: 'open' | 'history' = 'open',
  ) {
    const limit = 20;
    const currentPage = Number.isSafeInteger(page) && page > 0 ? page : 1;

    const where: Prisma.OrderWhereInput = {
      restaurantId,
      status: {
        in:
          view === 'history'
            ? [OrderStatus.COMPLETED, OrderStatus.CANCELLED]
            : [
                OrderStatus.PENDING,
                OrderStatus.CONFIRMED,
                OrderStatus.PREPARING,
                OrderStatus.READY,
              ],
      },
    };

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (currentPage - 1) * limit,
        take: limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: this.orderInclude(),
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: currentPage,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async getRestaurantDashboard(restaurantId: string) {
    const now = new Date();
    const start = new Date(now);
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - 6);

    const dailyTotals = new Map<string, Prisma.Decimal>();

    for (let offset = 0; offset < 7; offset++) {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + offset);
      dailyTotals.set(date.toISOString().slice(0, 10), new Prisma.Decimal(0));
    }

    const [queue, payments] = await Promise.all([
      this.getUpcomingOrders(restaurantId, 1, 8),
      this.prisma.payment.findMany({
        where: {
          order: { restaurantId },
          status: { in: [PaymentStatus.COMPLETED, PaymentStatus.REFUNDED] },
          OR: [
            { createdAt: { gte: start, lte: now } },
            { refundedAt: { gte: start, lte: now } },
          ],
        },
        select: { amount: true, createdAt: true, refundedAt: true },
      }),
    ]);

    function record(date: Date, amount: Prisma.Decimal) {
      if (date < start || date > now) return;

      const day = date.toISOString().slice(0, 10);
      const total = dailyTotals.get(day);

      if (total !== undefined) {
        dailyTotals.set(day, total.plus(amount));
      }
    }

    for (const payment of payments) {
      record(payment.createdAt, payment.amount);

      if (payment.refundedAt) {
        record(payment.refundedAt, payment.amount.negated());
      }
    }

    return {
      queueTotal: queue.pagination.total,
      queue: queue.data.map(({ id, orderNumber, status, createdAt }) => ({
        id,
        orderNumber,
        status,
        createdAt,
      })),
      revenue: Array.from(dailyTotals, ([day, amount]) => ({
        day,
        amount: amount.toNumber(),
      })),
    };
  }
  // ============================================================
  // CREATE ORDER
  // ============================================================

  async create(dto: CreateOrderDto, idempotencyKey: string) {
    const key = this.validateIdempotencyKey(idempotencyKey);

    this.validateOrderType(dto);

    const fingerprint = this.createFingerprint(dto);
    const replay = await this.findCreateReplay(
      this.prisma,
      key,
      dto,
      fingerprint,
    );
    if (replay) return replay;

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
          const replay = await this.findCreateReplay(tx, key, dto, fingerprint);
          if (replay) return replay;

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

                tableId: { equals: dto.tableId?.trim(), mode: 'insensitive' },

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

              if (paidAmount.gt(0)) {
                throw new ConflictException(
                  'The existing table order has a payment and cannot be edited.',
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

              await tx.orderCreateRequest.create({
                data: { key, fingerprint, orderId: activeOrder.id },
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

              tableId:
                dto.type === OrderType.DINE_IN ? dto.tableId?.trim() : null,

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

          await tx.orderCreateRequest.create({
            data: { key, fingerprint, orderId: order.id },
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
      return this.handleCreateError(error, key, dto, fingerprint);
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
    const order = await this.kitchenTransaction(async (tx) => {
      await tx.orderItem.updateMany({
        where: {
          orderId,
          status: OrderItemStatus.PENDING,
          OR: [
            { unavailableRequestedAt: null },
            { unavailableResolvedAt: { not: null } },
          ],
        },
        data: { status: OrderItemStatus.PREPARING },
      });

      return this.transition(
        orderId,
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        tx,
      );
    });

    return {
      message: 'Order moved to preparing successfully.',
      data: order,
    };
  }

  async ready(orderId: string) {
    const order = await this.kitchenTransaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id: orderId },
        include: this.orderInclude(),
      });
      if (!current) throw new NotFoundException('Order not found.');
      if (current.status === OrderStatus.READY) return current;

      const items = await tx.orderItem.findMany({
        where: { orderId },
        select: {
          status: true,
          unavailableRequestedAt: true,
          unavailableResolvedAt: true,
        },
      });
      if (!items.some((item) => item.status === OrderItemStatus.READY)) {
        throw new BadRequestException('At least one order item must be ready.');
      }

      if (
        items.some(
          (item) =>
            (item.status !== OrderItemStatus.READY &&
              item.status !== OrderItemStatus.CANCELLED) ||
            (item.unavailableRequestedAt && !item.unavailableResolvedAt),
        )
      ) {
        throw new BadRequestException(
          'Finish preparing or reviewing all order items before marking the order ready.',
        );
      }

      return this.transition(
        orderId,
        OrderStatus.PREPARING,
        OrderStatus.READY,
        tx,
      );
    });

    return {
      message: 'Order marked as ready successfully.',
      data: order,
    };
  }

  private async kitchenTransaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ) {
    try {
      return await this.prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        throw new ConflictException(
          'The order changed while updating the kitchen. Refresh and retry.',
        );
      }
      throw error;
    }
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

  async cancel(orderId: string, reason: string, manager: boolean) {
    const cleanReason = reason?.trim();

    if (!cleanReason) {
      throw new BadRequestException('Cancellation reason is required.');
    }

    if (cleanReason.length > 500) {
      throw new BadRequestException(
        'Cancellation reason must not exceed 500 characters.',
      );
    }

    const order = await this.prisma
      .$transaction(
        async (tx) => {
          const current = await tx.order.findUnique({
            where: {
              id: orderId,
            },
          });

          if (!current) {
            throw new NotFoundException('Order not found.');
          }

          const started =
            current.status === OrderStatus.CONFIRMED ||
            current.status === OrderStatus.PREPARING;

          if (current.status !== OrderStatus.PENDING && !started) {
            throw new ConflictException(
              'This order can no longer be cancelled.',
            );
          }
          if (started && !manager) {
            throw new ForbiddenException(
              'Only a restaurant manager can cancel an order after confirmation.',
            );
          }

          const readyItem = await tx.orderItem.findFirst({
            where: { orderId, status: OrderItemStatus.READY },
            select: { id: true },
          });
          if (readyItem) {
            throw new ConflictException(
              'A ready item has used stock. This order can no longer be cancelled.',
            );
          }

          const paidAmount = await this.getCompletedPaymentAmount(tx, orderId);

          if (paidAmount.gt(new Prisma.Decimal(0))) {
            throw new ConflictException(
              'Paid orders cannot be cancelled until the payment is refunded.',
            );
          }

          const cancelledAt = new Date();
          await tx.orderItem.updateMany({
            where: { orderId, status: { not: OrderItemStatus.CANCELLED } },
            data: { status: OrderItemStatus.CANCELLED },
          });
          await tx.orderItem.updateMany({
            where: {
              orderId,
              unavailableRequestedAt: { not: null },
              unavailableResolvedAt: null,
            },
            data: { unavailableResolvedAt: cancelledAt },
          });

          return tx.order.update({
            where: {
              id: orderId,
            },

            data: {
              status: OrderStatus.CANCELLED,

              cancelledAt,

              cancelReason: cleanReason,
            },

            include: this.orderInclude(),
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )
      .catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034'
        ) {
          throw new ConflictException(
            'The order changed while cancelling. Refresh the order before retrying.',
          );
        }
        throw error;
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
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const result = await db.order.updateMany({
      where: {
        id: orderId,
        status: from,
      },

      data: {
        status: to,
      },
    });

    if (result.count === 1) {
      const order = await db.order.findUnique({
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

    const order = await db.order.findUnique({
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
    if (dto.type === OrderType.DINE_IN && !dto.tableId?.trim()) {
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

  private createFingerprint(dto: CreateOrderDto): string {
    const request = {
      restaurantId: dto.restaurantId.toLowerCase(),
      phone: dto.phone,
      name: dto.name ?? null,
      type: dto.type,
      tableId: dto.tableId?.trim().toLowerCase() ?? null,
      items: dto.items.map((item) => ({
        menuItemId: item.menuItemId.toLowerCase(),
        quantity: item.quantity,
        modifiers: (item.modifiers ?? [])
          .map(({ modifierId, quantity }) => ({
            modifierId: modifierId.toLowerCase(),
            quantity,
          }))
          .sort(
            (a, b) =>
              a.modifierId.localeCompare(b.modifierId) ||
              a.quantity - b.quantity,
          ),
      })),
    };
    return createHash('sha256').update(JSON.stringify(request)).digest('hex');
  }

  private async findCreateReplay(
    db: Prisma.TransactionClient,
    key: string,
    dto: CreateOrderDto,
    fingerprint: string,
  ) {
    const request = await db.orderCreateRequest.findUnique({
      where: { key },
      include: { order: { include: this.orderInclude() } },
    });
    // Orders written before request tracking still have their original key.
    const order =
      request?.order ??
      (await db.order.findUnique({
        where: { idempotencyKey: key },
        include: this.orderInclude(),
      }));

    if (!order) return null;

    if (
      order.restaurantId !== dto.restaurantId.toLowerCase() ||
      (request && request.fingerprint !== fingerprint)
    ) {
      throw new ConflictException(
        'Idempotency-Key has already been used for a different order request.',
      );
    }

    return {
      message: 'Order already exists. Returning the existing order.',
      data: order,
    };
  }

  private async handleCreateError(
    error: unknown,
    key: string,
    dto: CreateOrderDto,
    fingerprint: string,
  ) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2002' || error.code === 'P2034')
    ) {
      const replay = await this.findCreateReplay(
        this.prisma,
        key,
        dto,
        fingerprint,
      );
      if (replay) return replay;

      throw new ConflictException(
        'Order creation conflicted with another transaction. Please retry using the same Idempotency-Key.',
      );
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
