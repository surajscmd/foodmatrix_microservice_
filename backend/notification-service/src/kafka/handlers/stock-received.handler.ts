import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

import type { StockReceivedEvent } from '../types/inventory-events.js';

import { NotificationGateway } from '../../socket/notification.gateway.js';

@Injectable()
export class StockReceivedHandler {
  private readonly logger = new Logger(StockReceivedHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async handle(event: StockReceivedEvent): Promise<void> {
    if (!event.stockTransferId) {
      this.logger.warn('Stock-received event missing stockTransferId');
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

        type: 'STOCK_RECEIVED',

        priority: 'HIGH',

        title: 'Stock Received',

        message: 'The stock transfer has been received by the restaurant.',

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

        type: 'STOCK_RECEIVED',

        priority: 'NORMAL',

        title: 'Stock Received',

        message: 'The restaurant has received the stock transfer.',

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
      `Stock-received notifications created and emitted for transfer ${event.stockTransferId}`,
    );
  }
}
