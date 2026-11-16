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
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import {
  OrderAccess,
  OrderActorRole,
  OrderRestaurant,
  type OrderActor,
} from '../../auth/order-access';
import { CreateOrderDto } from './dto/create-order.dto';
import { AddOrderItemsDto } from './dto/add-order-items.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { UpdateOrderItemStatusDto } from './dto/update-order-item-status.dto';
import { ReviewUnavailableItemDto } from './dto/review-unavailable-item.dto';

import { OrderService } from './orders.service';
import { OrderItemsService } from './order-items.service';

@Controller('orders')
@OrderAccess('order')
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
  @OrderAccess('create-order')
  async create(
    @Body() dto: CreateOrderDto,
    @Headers('idempotency-key')
    idempotencyKey?: string,
  ) {
    const key = idempotencyKey?.trim();
    if (!key || key.length > 255) {
      throw new BadRequestException(
        'Idempotency-Key must contain 1 to 255 characters.',
      );
    }

    const scopedKey = createHash('sha256')
      .update(dto.restaurantId + ':' + key)
      .digest('hex');
    return this.orderService.create(dto, scopedKey);
  }

  // ============================================================
  // KITCHEN - GET UPCOMING ORDERS
  // GET /orders/kitchen/upcoming
  // ============================================================

  @Get('kitchen/upcoming')
  @OrderAccess('restaurant')
  async getUpcomingOrders(
    @OrderRestaurant()
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
  @Get()
  @OrderAccess('restaurant')
  async listRegisterOrders(
    @OrderRestaurant() restaurantId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('view', new DefaultValuePipe('open')) view: string,
  ) {
    const id = restaurantId?.trim();

    if (!id) {
      throw new BadRequestException('restaurantId is required.');
    }

    if (view !== 'open' && view !== 'history') {
      throw new BadRequestException('view must be open or history.');
    }

    return this.orderService.listRegisterOrders(id, page, view);
  }

  @Get('dashboard')
  @OrderAccess('dashboard')
  async getDashboard(@OrderRestaurant() restaurantId: string) {
    return this.orderService.getRestaurantDashboard(restaurantId);
  }

  // ============================================================
  // GET ORDER
  // GET /orders/:id
  // ============================================================

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.findOne(id);
  }

  // ============================================================
  // ADD ITEMS TO ORDER
  // POST /orders/:id/items
  // ============================================================

  @Post(':id/items')
  async addItems(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddOrderItemsDto,
  ) {
    return this.orderItemsService.addItems(id, dto);
  }

  // ============================================================
  // KITCHEN - UPDATE ORDER ITEM STATUS
  // PATCH /orders/:id/kitchen/items/:itemId/status
  // ============================================================

  @Patch(':id/kitchen/items/:itemId/status')
  async updateItemStatus(
    @Param('id', ParseUUIDPipe) orderId: string,
    @Param('itemId', ParseUUIDPipe) orderItemId: string,
    @Body() dto: UpdateOrderItemStatusDto,
  ) {
    return this.orderItemsService.updateItemStatus(
      orderId,
      orderItemId,
      dto.status,
    );
  }

  @Post(':id/items/:itemId/unavailability')
  reportUnavailable(
    @Param('id', ParseUUIDPipe) orderId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.orderItemsService.reportUnavailable(
      orderId,
      itemId,
      dto.reason,
    );
  }

  @Patch(':id/items/:itemId/unavailability')
  reviewUnavailable(
    @Param('id', ParseUUIDPipe) orderId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: ReviewUnavailableItemDto,
  ) {
    return this.orderItemsService.reviewUnavailable(
      orderId,
      itemId,
      dto.decision,
    );
  }

  // ============================================================
  // REMOVE ORDER ITEM
  // DELETE /orders/:id/items/:itemId
  // ============================================================

  @Delete(':id/items/:itemId')
  async removeItem(
    @Param('id', ParseUUIDPipe) orderId: string,
    @Param('itemId', ParseUUIDPipe) orderItemId: string,
  ) {
    return this.orderItemsService.removeItem(orderId, orderItemId);
  }

  // ============================================================
  // REMOVE MODIFIER FROM ORDER ITEM
  // DELETE /orders/:id/items/:itemId/modifiers/:modifierId
  // ============================================================

  @Delete(':id/items/:itemId/modifiers/:modifierId')
  async removeModifier(
    @Param('id', ParseUUIDPipe) orderId: string,
    @Param('itemId', ParseUUIDPipe) orderItemId: string,
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
  async confirm(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.confirm(id);
  }

  // ============================================================
  // PREPARE ORDER
  // POST /orders/:id/prepare
  // ============================================================

  @Post(':id/prepare')
  async prepare(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.prepare(id);
  }

  // ============================================================
  // MARK ORDER READY
  // POST /orders/:id/ready
  // ============================================================

  @Post(':id/ready')
  async ready(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.ready(id);
  }

  // ============================================================
  // COMPLETE ORDER
  // POST /orders/:id/complete
  // ============================================================

  @Post(':id/complete')
  async complete(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.complete(id);
  }

  // ============================================================
  // CANCEL ORDER
  // POST /orders/:id/cancel
  // ============================================================

  @Post(':id/cancel')
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelOrderDto,
    @OrderActorRole() role: OrderActor['role'],
  ) {
    return this.orderService.cancel(
      id,
      dto.reason,
      role === 'RESTAURANT_ADMIN',
    );
  }
}
