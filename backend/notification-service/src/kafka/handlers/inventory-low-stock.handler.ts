import { Injectable, Logger } from '@nestjs/common';
import { NotificationDeliveryService } from './notification-delivery.service.js';

import type { LowStockEvent } from '../types/inventory-events.js';

@Injectable()
export class InventoryLowStockHandler {
  private readonly logger = new Logger(InventoryLowStockHandler.name);

  constructor(private readonly delivery: NotificationDeliveryService) {}

  async handle(event: LowStockEvent, deliveryId: string): Promise<void> {
    if (!event.restaurantId) {
      this.logger.warn('Low-stock event missing restaurantId');
      return;
    }

    if (!event.items || event.items.length === 0) {
      this.logger.warn(
        `Low-stock event has no items for restaurant ${event.restaurantId}`,
      );
      return;
    }

    const ingredientNames = event.items
      .map((item) => item.ingredient?.name)
      .filter((name): name is string => Boolean(name));

    const message =
      ingredientNames.length === 1
        ? `${ingredientNames[0]} is below the reorder level.`
        : `${ingredientNames.length} ingredients are below the reorder level: ${ingredientNames.join(', ')}.`;

    await this.delivery.sendOnce(deliveryId, [
      {
        scope: 'RESTAURANT',

        restaurantId: event.restaurantId,

        warehouseId: event.warehouseId ?? null,

        type: 'LOW_STOCK',

        priority: 'HIGH',

        title: 'Low Stock Alert',

        message,

        referenceId: event.restaurantId,

        referenceType: 'RestaurantStock',
      },
    ]);
  }
}
