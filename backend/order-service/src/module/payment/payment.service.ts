import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // CREATE PAYMENT
  // ============================================================

  async create(dto: CreatePaymentDto) {
    const transactionId = dto.transactionId?.trim();
    const paymentAmount = new Prisma.Decimal(dto.amount);
    if (paymentAmount.lte(0)) {
      throw new BadRequestException(
        'Payment amount must be greater than zero.',
      );
    }

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const replay = transactionId
            ? await this.findPaymentReplay(
                tx,
                transactionId,
                dto,
                paymentAmount,
              )
            : null;
          if (replay) return replay;

          const order = await tx.order.findUnique({
            where: { id: dto.orderId },
          });
          if (!order) throw new NotFoundException('Order not found.');

          if (order.status === OrderStatus.CANCELLED) {
            throw new BadRequestException(
              'Cannot make payment for a cancelled order.',
            );
          }
          if (order.status === OrderStatus.COMPLETED) {
            throw new ConflictException(
              'Cannot make payment for a completed order.',
            );
          }

          const openRequest = await tx.orderItem.findFirst({
            where: {
              orderId: order.id,
              unavailableRequestedAt: { not: null },
              unavailableResolvedAt: null,
            },
            select: { id: true },
          });
          if (openRequest) {
            throw new ConflictException(
              'Review the unavailable dish before taking payment.',
            );
          }

          const paidAmount = await this.sumCompletedPayments(tx, order.id);
          const remainingAmount = order.total.minus(paidAmount);
          if (remainingAmount.lte(0)) {
            throw new ConflictException('Order is already fully paid.');
          }
          if (paymentAmount.gt(remainingAmount)) {
            throw new BadRequestException(
              'Payment exceeds remaining amount. Remaining amount: ' +
                remainingAmount.toFixed(2) +
                '.',
            );
          }

          const payment = await tx.payment.create({
            data: {
              orderId: order.id,
              amount: paymentAmount,
              method: dto.method,
              status: PaymentStatus.COMPLETED,
              transactionId: transactionId || null,
            },
          });

          return this.paymentResult(
            payment,
            order.total,
            paidAmount.plus(paymentAmount),
          );
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        (error.code !== 'P2034' && !(error.code === 'P2002' && transactionId))
      ) {
        throw error;
      }

      if (transactionId) {
        const replay = await this.prisma.$transaction(
          (tx) => this.findPaymentReplay(tx, transactionId, dto, paymentAmount),
          { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
        );
        if (replay) return replay;
      }
      throw new ConflictException(
        'The payment conflicted with another update. Refresh the order before retrying.',
      );
    }
  }

  private async findPaymentReplay(
    tx: Prisma.TransactionClient,
    transactionId: string,
    dto: CreatePaymentDto,
    amount: Prisma.Decimal,
  ) {
    const saved = await tx.payment.findUnique({
      where: { transactionId },
      include: { order: { select: { total: true } } },
    });
    if (!saved) return null;

    const { order, ...payment } = saved;
    if (
      payment.orderId !== dto.orderId.toLowerCase() ||
      payment.method !== dto.method ||
      !payment.amount.equals(amount) ||
      payment.status !== PaymentStatus.COMPLETED
    ) {
      throw new ConflictException(
        'This transaction ID already belongs to another payment or has been refunded.',
      );
    }

    const paidAmount = await this.sumCompletedPayments(tx, payment.orderId);
    return this.paymentResult(payment, order.total, paidAmount);
  }

  private async sumCompletedPayments(
    tx: Prisma.TransactionClient,
    orderId: string,
  ) {
    const result = await tx.payment.aggregate({
      where: { orderId, status: PaymentStatus.COMPLETED },
      _sum: { amount: true },
    });
    return result._sum.amount ?? new Prisma.Decimal(0);
  }

  private paymentResult(
    payment: Prisma.PaymentGetPayload<object>,
    orderTotal: Prisma.Decimal,
    paidAmount: Prisma.Decimal,
  ) {
    return {
      payment,
      orderTotal,
      previousPaidAmount: paidAmount.minus(payment.amount),
      paidAmount,
      remainingAmount: orderTotal.minus(paidAmount),
      fullyPaid: paidAmount.gte(orderTotal),
    };
  }

  // ============================================================
  // GET PAYMENT
  // ============================================================

  async findOne(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: {
        id: paymentId,
      },

      include: {
        order: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found.');
    }

    return {
      message: 'Payment fetched successfully.',
      data: payment,
    };
  }

  // ============================================================
  // GET ORDER PAYMENTS
  // ============================================================

  async findByOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    const payments = await this.prisma.payment.findMany({
      where: {
        orderId,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    const paidAmount = payments
      .filter((payment) => payment.status === PaymentStatus.COMPLETED)
      .reduce(
        (total, payment) => total.plus(payment.amount),
        new Prisma.Decimal(0),
      );

    const total = new Prisma.Decimal(order.total);

    const remainingAmount = Prisma.Decimal.max(
      total.minus(paidAmount),
      new Prisma.Decimal(0),
    );

    return {
      message: 'Order payments fetched successfully.',

      data: {
        orderId,

        orderTotal: total,

        paidAmount,

        remainingAmount,

        isFullyPaid: remainingAmount.eq(0),

        payments,
      },
    };
  }
  // get sumary of payments for a specific order
  async getPaymentSummary(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        payments: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    const orderTotal = new Prisma.Decimal(order.total);

    const paidAmount = order.payments
      .filter((payment) => payment.status === PaymentStatus.COMPLETED)
      .reduce(
        (sum, payment) => sum.plus(payment.amount),
        new Prisma.Decimal(0),
      );

    const refundedAmount = order.payments
      .filter((payment) => payment.status === PaymentStatus.REFUNDED)
      .reduce(
        (sum, payment) => sum.plus(payment.amount),
        new Prisma.Decimal(0),
      );

    const remainingAmount = Prisma.Decimal.max(
      orderTotal.minus(paidAmount),
      new Prisma.Decimal(0),
    );

    const totalCollected = paidAmount.plus(refundedAmount);

    const fullyRefunded =
      refundedAmount.gt(0) && totalCollected.gte(orderTotal);

    return {
      message: 'Payment summary fetched successfully.',
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,

        orderTotal: orderTotal.toFixed(2),

        paidAmount: paidAmount.toFixed(2),

        refundedAmount: refundedAmount.toFixed(2),

        remainingAmount: remainingAmount.toFixed(2),

        fullyPaid: paidAmount.gte(orderTotal),

        fullyRefunded,
      },
    };
  }

  // ============================================================
  // REFUND PAYMENT
  // POST /payments/:paymentId/refund
  // ============================================================

  async refund(paymentId: string) {
    return this.prisma.$transaction(async (tx) => {
      // ----------------------------------------------------------
      // FIND PAYMENT
      // ----------------------------------------------------------

      const payment = await tx.payment.findUnique({
        where: {
          id: paymentId,
        },
        include: {
          order: true,
        },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found.');
      }

      // ----------------------------------------------------------
      // PAYMENT MUST BE COMPLETED
      // ----------------------------------------------------------

      if (payment.status !== PaymentStatus.COMPLETED) {
        throw new BadRequestException(
          `Only COMPLETED payments can be refunded. Current status: ${payment.status}.`,
        );
      }

      // ----------------------------------------------------------
      // ORDER CHECK
      // ----------------------------------------------------------

      if (payment.order.status === OrderStatus.CANCELLED) {
        // Allowed: cancelled order can have its completed
        // payment refunded.
      }

      // ----------------------------------------------------------
      // REFUND PAYMENT
      // ----------------------------------------------------------

      const refundedPayment = await tx.payment.update({
        where: {
          id: paymentId,
        },

        data: {
          status: PaymentStatus.REFUNDED,

          refundedAt: new Date(),
        },

        include: {
          order: true,
        },
      });

      // ----------------------------------------------------------
      // RESPONSE
      // ----------------------------------------------------------

      return {
        message: 'Payment refunded successfully.',

        data: {
          payment: refundedPayment,

          refundedAmount: payment.amount,

          orderId: payment.orderId,

          orderTotal: payment.order.total,
        },
      };
    });
  }
  async refundOrder(orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      // ----------------------------------------------------------
      // FIND ORDER
      // ----------------------------------------------------------

      const order = await tx.order.findUnique({
        where: {
          id: orderId,
        },
        include: {
          payments: {
            where: {
              status: PaymentStatus.COMPLETED,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found.');
      }

      // ----------------------------------------------------------
      // FIND COMPLETED PAYMENTS
      // ----------------------------------------------------------

      const completedPayments = order.payments;

      if (completedPayments.length === 0) {
        throw new BadRequestException(
          'No completed payments are available for refund.',
        );
      }

      // ----------------------------------------------------------
      // REFUND ALL COMPLETED PAYMENTS
      // ----------------------------------------------------------

      const refundedAt = new Date();

      const refundedPayments = [];

      for (const payment of completedPayments) {
        const refundedPayment = await tx.payment.update({
          where: {
            id: payment.id,
          },

          data: {
            status: PaymentStatus.REFUNDED,
            refundedAt,
          },
        });

        refundedPayments.push(refundedPayment);
      }

      // ----------------------------------------------------------
      // TOTAL REFUNDED
      // ----------------------------------------------------------

      const refundedAmount = refundedPayments.reduce(
        (sum, payment) => sum.plus(payment.amount),
        new Prisma.Decimal(0),
      );

      // ----------------------------------------------------------
      // RESPONSE
      // ----------------------------------------------------------

      return {
        message: 'Order refunded successfully.',

        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,

          orderTotal: new Prisma.Decimal(order.total).toFixed(2),

          refundedAmount: refundedAmount.toFixed(2),

          payments: refundedPayments,
        },
      };
    });
  }
}
