import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // ============================================================
  // CREATE PAYMENT
  // POST /payments
  // ============================================================

  @Post()
  async create(@Body() dto: CreatePaymentDto) {
    const result = await this.paymentService.create(dto);

    return {
      message: 'Payment created successfully.',
      data: result,
    };
  }

  // ============================================================
  // GET PAYMENT
  // GET /payments/:id
  // ============================================================

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.paymentService.findOne(id);
  }

  // ============================================================
  // GET ORDER PAYMENTS(all payments for a specific order)
  // GET /payments/order/:orderId
  // ============================================================

  @Get('order/:orderId')
  async findByOrder(@Param('orderId') orderId: string) {
    return this.paymentService.findByOrder(orderId);
  }
  // ============================================================
  // GET ORDER PAYMENT SUMMARY (summary of payments for a specific order)
  // GET /payments/order/:orderId/summary
  // ============================================================

  @Get('order/:orderId/summary')
  async getPaymentSummary(@Param('orderId') orderId: string) {
    return this.paymentService.getPaymentSummary(orderId);
  }

  // ============================================================
  // Single REFUND PAYMENT
  // POST /payments/:paymentId/refund
  // ============================================================

  @Post(':paymentId/refund')
  async refund(@Param('paymentId') paymentId: string) {
    return this.paymentService.refund(paymentId);
  }
  // ============================================================
  // REFUND ORDER
  // POST /payments/order/:orderId/refund
  // ============================================================
  @Post('order/:orderId/refund')
  async refundOrder(@Param('orderId') orderId: string) {
    return this.paymentService.refundOrder(orderId);
  }
}
