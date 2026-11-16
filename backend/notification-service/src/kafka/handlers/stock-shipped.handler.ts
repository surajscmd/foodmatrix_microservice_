import { Injectable, Logger } from '@nestjs/common';
import { NotificationDeliveryService } from './notification-delivery.service.js';

import type { StockShippedEvent } from '../types/inventory-events.js';

@Injectable()
export class StockShippedHandler {
  private readonly logger = new Logger(StockShippedHandler.name);

  constructor(private readonly delivery: NotificationDeliveryService) {}

  async handle(event: StockShippedEvent): Promise<void> {
    if (!event.stockTransferId) {
      this.logger.warn('Stock-shipped event missing stockTransferId');
      return;
    }

    await this.delivery.sendOnce(event.stockTransferId, [
      {
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
      {
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
    ]);
  }
}
