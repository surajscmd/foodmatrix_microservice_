import { Body, Controller, Post } from '@nestjs/common';

import { InventoryService } from './inventory.service.js';

import type { OrderItemReadyEvent } from './inventory.service.js';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('test/order-item-ready')
  async testOrderItemReady(
    @Body() event: OrderItemReadyEvent,
  ): Promise<{ message: string }> {
    await this.inventoryService.handleOrderItemReady(event);

    return {
      message: 'Inventory event processed successfully.',
    };
  }
}
