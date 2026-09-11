import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

import type { StockRequestApprovedEvent } from '../types/inventory-events.js';

import { NotificationGateway } from '../../socket/notification.gateway.js';

@Injectable()
export class StockRequestApprovedHandler {
  private readonly logger = new Logger(StockRequestApprovedHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async handle(event: StockRequestApprovedEvent): Promise<void> {
    if (!event.stockRequestId) {
      this.logger.warn('Stock-request-approved event missing stockRequestId');
      return;
    }

    const itemCount = event.items?.length ?? 0;

    const message =
      itemCount === 1
        ? 'Your stock request has been approved.'
        : `Your stock request has been approved for ${itemCount} ingredients.`;

    // ============================================================
    // 1. RESTAURANT NOTIFICATION
    // ============================================================

    const restaurantNotification = await this.prisma.notification.create({
      data: {
        scope: 'RESTAURANT',

        restaurantId: event.restaurantId,

        warehouseId: event.warehouseId,

        type: 'STOCK_REQUEST_APPROVED',

        priority: 'HIGH',

        title: 'Stock Request Approved',

        message,

        referenceId: event.stockRequestId,

        referenceType: 'StockRequest',
      },
    });

    // Emit to restaurant room
    this.notificationGateway.emitToRestaurant(
      event.restaurantId,
      restaurantNotification,
    );

    // ============================================================
    // 2. WAREHOUSE NOTIFICATION
    // ============================================================

    const warehouseNotification = await this.prisma.notification.create({
      data: {
        scope: 'WAREHOUSE',

        restaurantId: event.restaurantId,

        warehouseId: event.warehouseId,

        type: 'STOCK_REQUEST_APPROVED',

        priority: 'NORMAL',

        title: 'Stock Request Approved',

        message: `Stock request for restaurant ${event.restaurantId} has been approved.`,

        referenceId: event.stockRequestId,

        referenceType: 'StockRequest',
      },
    });

    // Emit to warehouse room
    this.notificationGateway.emitToWarehouse(
      event.warehouseId,
      warehouseNotification,
    );

    this.logger.log(
      `Stock-request-approved notifications created and emitted for request ${event.stockRequestId}`,
    );
  }
}
