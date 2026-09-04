export interface OrderCompleteModifierEvent {
  modifierId: string;
  quantity: number;
}

export interface OrderCompleteEvent {
  orderItemId: string;
  menuItemId: string;
  quantity: number;
  modifiers: OrderCompleteModifierEvent[];
  restaurantId: string;
}
