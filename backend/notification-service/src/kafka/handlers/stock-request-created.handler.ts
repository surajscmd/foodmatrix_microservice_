import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

import type { StockRequestCreatedEvent } from '../types/inventory-events.js';

import { NotificationGateway } from '../../socket/notification.gateway.js';

@Injectable()
export class StockRequestCreatedHandler {
  private readonly logger = new Logger(StockRequestCreatedHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async handle(event: StockRequestCreatedEvent): Promise<void> {
    if (!event.stockRequestId) {
      this.logger.warn('Stock-request-created event missing stockRequestId');
      return;
    }

    // ============================================================
    // 1. CREATE NOTIFICATION IN DATABASE
    // ============================================================

    const notification = await this.prisma.notification.create({
      data: {
        scope: 'WAREHOUSE',

        restaurantId: event.restaurantId,

        warehouseId: event.warehouseId,

        type: 'STOCK_REQUEST_CREATED',

        priority: 'NORMAL',

        title: 'New Stock Request',

        message:
          event.itemCount === 1
            ? 'A restaurant has submitted a stock request.'
            : `A restaurant has submitted a stock request for ${event.itemCount} ingredients.`,

        referenceId: event.stockRequestId,

        referenceType: 'StockRequest',
      },
    });

    // ============================================================
    // 2. EMIT REAL-TIME NOTIFICATION
    // ============================================================

    this.notificationGateway.emitToWarehouse(event.warehouseId, notification);

    this.logger.log(
      `Stock-request-created notification created and emitted for warehouse ${event.warehouseId}`,
    );
  }
}
