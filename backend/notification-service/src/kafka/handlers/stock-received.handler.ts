import { Injectable, Logger } from '@nestjs/common';
import { NotificationDeliveryService } from './notification-delivery.service.js';

import type { StockReceivedEvent } from '../types/inventory-events.js';

@Injectable()
export class StockReceivedHandler {
  private readonly logger = new Logger(StockReceivedHandler.name);

  constructor(private readonly delivery: NotificationDeliveryService) {}

  async handle(event: StockReceivedEvent): Promise<void> {
    if (!event.stockTransferId) {
      this.logger.warn('Stock-received event missing stockTransferId');
      return;
    }

    await this.delivery.sendOnce(event.stockTransferId, [
      {
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
      {
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
    ]);
  }
}
