import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { CreateOrderDto } from './dto/create-order.dto';
import { AddOrderItemsDto } from './dto/add-order-items.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { UpdateOrderItemStatusDto } from './dto/update-order-item-status.dto';

import { OrderService } from './orders.service';
import { OrderItemsService } from './order-items.service';

@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly orderItemsService: OrderItemsService,
  ) {}

  // ============================================================
  // CREATE ORDER
  // POST /orders
  // ============================================================

  @Post()
  async create(
    @Body() dto: CreateOrderDto,
    @Headers('idempotency-key')
    idempotencyKey?: string,
  ) {
    if (!idempotencyKey?.trim()) {
      throw new BadRequestException('Idempotency-Key header is required.');
    }

    return this.orderService.create(dto, idempotencyKey);
  }

  // ============================================================
  // KITCHEN - GET UPCOMING ORDERS
  // GET /orders/kitchen/upcoming
  // ============================================================

  @Get('kitchen/upcoming')
  async getUpcomingOrders(
    @Query('restaurantId')
    restaurantId: string,

    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,

    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number,
  ) {
    if (!restaurantId?.trim()) {
      throw new BadRequestException('restaurantId is required.');
    }

    return this.orderService.getUpcomingOrders(restaurantId, page, limit);
  }

  // ============================================================
  // GET ORDER
  // GET /orders/:id
  // ============================================================

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  // ============================================================
  // ADD ITEMS TO ORDER
  // POST /orders/:id/items
  // ============================================================

  @Post(':id/items')
  async addItems(@Param('id') id: string, @Body() dto: AddOrderItemsDto) {
    return this.orderItemsService.addItems(id, dto);
  }

  // ============================================================
  // KITCHEN - UPDATE ORDER ITEM STATUS
  // PATCH /orders/:id/kitchen/items/:itemId/status
  // ============================================================

  @Patch(':id/kitchen/items/:itemId/status')
  async updateItemStatus(
    @Param('id') orderId: string,
    @Param('itemId') orderItemId: string,
    @Body() dto: UpdateOrderItemStatusDto,
  ) {
    return this.orderItemsService.updateItemStatus(
      orderId,
      orderItemId,
      dto.status,
    );
  }

  // ============================================================
  // REMOVE ORDER ITEM
  // DELETE /orders/:id/items/:itemId
  // ============================================================

  @Delete(':id/items/:itemId')
  async removeItem(
    @Param('id') orderId: string,
    @Param('itemId') orderItemId: string,
  ) {
    return this.orderItemsService.removeItem(orderId, orderItemId);
  }

  // ============================================================
  // REMOVE MODIFIER FROM ORDER ITEM
  // DELETE /orders/:id/items/:itemId/modifiers/:modifierId
  // ============================================================

  @Delete(':id/items/:itemId/modifiers/:modifierId')
  async removeModifier(
    @Param('id') orderId: string,
    @Param('itemId') orderItemId: string,
    @Param('modifierId')
    orderItemModifierId: string,
  ) {
    return this.orderItemsService.removeModifier(
      orderId,
      orderItemId,
      orderItemModifierId,
    );
  }

  // ============================================================
  // CONFIRM ORDER
  // POST /orders/:id/confirm
  // ============================================================

  @Post(':id/confirm')
  async confirm(@Param('id') id: string) {
    return this.orderService.confirm(id);
  }

  // ============================================================
  // PREPARE ORDER
  // POST /orders/:id/prepare
  // ============================================================

  @Post(':id/prepare')
  async prepare(@Param('id') id: string) {
    return this.orderService.prepare(id);
  }

  // ============================================================
  // MARK ORDER READY
  // POST /orders/:id/ready
  // ============================================================

  @Post(':id/ready')
  async ready(@Param('id') id: string) {
    return this.orderService.ready(id);
  }

  // ============================================================
  // COMPLETE ORDER
  // POST /orders/:id/complete
  // ============================================================

  @Post(':id/complete')
  async complete(@Param('id') id: string) {
    return this.orderService.complete(id);
  }

  // ============================================================
  // CANCEL ORDER
  // POST /orders/:id/cancel
  // ============================================================

  @Post(':id/cancel')
  async cancel(@Param('id') id: string, @Body() dto: CancelOrderDto) {
    return this.orderService.cancel(id, dto.reason);
  }
}
