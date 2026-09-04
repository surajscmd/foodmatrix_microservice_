import { Injectable } from '@nestjs/common';

export interface OrderItemReadyEvent {
  orderItemId: string;
  menuItemId: string;
  quantity: number;
  modifiers: {
    modifierId: string;
    quantity: number;
  }[];
  restaurantId: string;
}

@Injectable()
export class InventoryService {
  async handleOrderItemReady(event: OrderItemReadyEvent): Promise<void> {
    console.log('\n========== INVENTORY PROCESSING STARTED ==========');

    console.log('Waiting 3 seconds...');

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 3000);
    });

    console.log('3 seconds completed');

    console.log('Order Item ID:', event.orderItemId);

    console.log('Menu Item ID:', event.menuItemId);

    console.log('Quantity:', event.quantity);

    console.log('Modifiers:', event.modifiers);

    console.log('Restaurant ID:', event.restaurantId);

    console.log('========== INVENTORY PROCESSING COMPLETED ==========\n');
  }
}
