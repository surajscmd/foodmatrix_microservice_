import { Injectable, Logger } from '@nestjs/common';
import { NotificationDeliveryService } from './notification-delivery.service.js';

import type { StockRequestCreatedEvent } from '../types/inventory-events.js';

@Injectable()
export class StockRequestCreatedHandler {
  private readonly logger = new Logger(StockRequestCreatedHandler.name);

  constructor(private readonly delivery: NotificationDeliveryService) {}

  async handle(event: StockRequestCreatedEvent): Promise<void> {
    if (!event.stockRequestId) {
      this.logger.warn('Stock-request-created event missing stockRequestId');
      return;
    }

    await this.delivery.sendOnce(event.stockRequestId, [
      {
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
    ]);
  }
}
