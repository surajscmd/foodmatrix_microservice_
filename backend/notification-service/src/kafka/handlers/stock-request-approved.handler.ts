import { Injectable, Logger } from '@nestjs/common';
import { NotificationDeliveryService } from './notification-delivery.service.js';

import type { StockRequestApprovedEvent } from '../types/inventory-events.js';

@Injectable()
export class StockRequestApprovedHandler {
  private readonly logger = new Logger(StockRequestApprovedHandler.name);

  constructor(private readonly delivery: NotificationDeliveryService) {}

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

    await this.delivery.sendOnce(event.stockRequestId, [
      {
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
      {
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
    ]);
  }
}
