import { OrderAccess } from '../../auth/order-access';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentService } from './payment.service';

@Controller('payments')
@OrderAccess('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // ============================================================
  // CREATE PAYMENT
  // POST /payments
  // ============================================================

  @Post()
  @OrderAccess('create-payment')
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
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentService.findOne(id);
  }

  // ============================================================
  // GET ORDER PAYMENTS(all payments for a specific order)
  // GET /payments/order/:orderId
  // ============================================================

  @Get('order/:orderId')
  @OrderAccess('order-payments')
  async findByOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.paymentService.findByOrder(orderId);
  }
  // ============================================================
  // GET ORDER PAYMENT SUMMARY (summary of payments for a specific order)
  // GET /payments/order/:orderId/summary
  // ============================================================

  @Get('order/:orderId/summary')
  @OrderAccess('order-payments')
  async getPaymentSummary(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.paymentService.getPaymentSummary(orderId);
  }

  // ============================================================
  // Single REFUND PAYMENT
  // POST /payments/:paymentId/refund
  // ============================================================

  @Post(':paymentId/refund')
  @OrderAccess('refund-payment')
  async refund(@Param('paymentId', ParseUUIDPipe) paymentId: string) {
    return this.paymentService.refund(paymentId);
  }
  // ============================================================
  // REFUND ORDER
  // POST /payments/order/:orderId/refund
  // ============================================================
  @Post('order/:orderId/refund')
  @OrderAccess('refund-order')
  async refundOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.paymentService.refundOrder(orderId);
  }
}
