import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';

import { NotificationService } from './notification.service.js';

import { GetNotificationsDto } from './dto/get-notifications.dto.js';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // ============================================================
  // RESTAURANT
  // ============================================================

  /**
   * Get notifications for a restaurant.
   *
   * Supports:
   * - pagination
   * - unread/read filtering
   */
  @Get('restaurant/:restaurantId')
  async findByRestaurant(
    @Param('restaurantId', ParseUUIDPipe)
    restaurantId: string,

    @Query()
    query: GetNotificationsDto,
  ) {
    return this.notificationService.findByRestaurant(
      restaurantId,
      query.page,
      query.limit,
      query.isRead,
      query.priority,
      query.search,
    );
  }

  // ============================================================
  // WAREHOUSE
  // ============================================================

  /**
   * Get notifications for a warehouse.
   */
  @Get('warehouse/:warehouseId')
  async findByWarehouse(
    @Param('warehouseId', ParseUUIDPipe)
    warehouseId: string,

    @Query()
    query: GetNotificationsDto,
  ) {
    return this.notificationService.findByWarehouse(
      warehouseId,
      query.page,
      query.limit,
      query.isRead,
    );
  }

  // ============================================================
  // FIND ONE
  // ============================================================

  /**
   * Get a single notification.
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.notificationService.findOne(id);
  }

  // ============================================================
  // MARK ONE AS READ
  // ============================================================

  /**
   * Mark a single notification as read.
   */
  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.notificationService.markAsRead(id);
  }

  // ============================================================
  // MARK RESTAURANT AS READ
  // ============================================================

  /**
   * Mark all unread restaurant notifications as read.
   */
  @Patch('restaurant/:restaurantId/read-all')
  async markRestaurantAsRead(
    @Param('restaurantId', ParseUUIDPipe)
    restaurantId: string,
  ) {
    return this.notificationService.markRestaurantAsRead(restaurantId);
  }

  // ============================================================
  // MARK WAREHOUSE AS READ
  // ============================================================

  /**
   * Mark all unread warehouse notifications as read.
   */
  @Patch('warehouse/:warehouseId/read-all')
  async markWarehouseAsRead(
    @Param('warehouseId', ParseUUIDPipe)
    warehouseId: string,
  ) {
    return this.notificationService.markWarehouseAsRead(warehouseId);
  }
}

// | Method  | URL                                                    | Purpose                            |
// | ------- | ------------------------------------------------------ | ---------------------------------- |
// | `GET`   | `/notifications/restaurant/:restaurantId`              | Restaurant notifications           |
// | `GET`   | `/notifications/restaurant/:restaurantId?isRead=false` | Restaurant unread notifications    |
// | `GET`   | `/notifications/warehouse/:warehouseId`                | Warehouse notifications            |
// | `GET`   | `/notifications/warehouse/:warehouseId?isRead=false`   | Warehouse unread notifications     |
// | `GET`   | `/notifications/:id`                                   | One notification                   |
// | `PATCH` | `/notifications/:id/read`                              | Mark one read                      |
// | `PATCH` | `/notifications/restaurant/:restaurantId/read-all`     | Mark restaurant notifications read |
// | `PATCH` | `/notifications/warehouse/:warehouseId/read-all`       | Mark warehouse notifications read  |
