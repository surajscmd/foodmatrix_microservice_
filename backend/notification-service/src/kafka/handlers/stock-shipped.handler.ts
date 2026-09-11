import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

import type { StockShippedEvent } from '../types/inventory-events.js';

import { NotificationGateway } from '../../socket/notification.gateway.js';

@Injectable()
export class StockShippedHandler {
  private readonly logger = new Logger(StockShippedHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async handle(event: StockShippedEvent): Promise<void> {
    if (!event.stockTransferId) {
      this.logger.warn('Stock-shipped event missing stockTransferId');
      return;
    }

    // ============================================================
    // 1. RESTAURANT NOTIFICATION
    // ============================================================

    const restaurantNotification = await this.prisma.notification.create({
      data: {
        scope: 'RESTAURANT',

        restaurantId: event.restaurantId,

        warehouseId: event.warehouseId,

        type: 'STOCK_SHIPPED',

        priority: 'HIGH',

        title: 'Stock Shipped',

        message: 'Your stock transfer has been shipped by the warehouse.',

        referenceId: event.stockTransferId,

        referenceType: 'StockTransfer',
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

        type: 'STOCK_SHIPPED',

        priority: 'NORMAL',

        title: 'Stock Shipped',

        message: 'The stock transfer has been successfully shipped.',

        referenceId: event.stockTransferId,

        referenceType: 'StockTransfer',
      },
    });

    // Emit to warehouse room
    this.notificationGateway.emitToWarehouse(
      event.warehouseId,
      warehouseNotification,
    );

    this.logger.log(
      `Stock-shipped notifications created and emitted for transfer ${event.stockTransferId}`,
    );
  }
}
