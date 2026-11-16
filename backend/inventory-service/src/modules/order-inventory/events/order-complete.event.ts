export interface OrderCompleteModifierEvent {
  modifierId: string;
  /** Number of this modifier for each unit of the menu item. */
  quantity: number;
}

export interface OrderCompleteEvent {
  orderItemId: string;
  menuItemId: string;
  quantity: number;
  modifiers?: OrderCompleteModifierEvent[];
  restaurantId: string;
}

export function isOrderCompleteEvent(
  value: unknown,
): value is OrderCompleteEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Partial<OrderCompleteEvent>;
  return (
    typeof event.orderItemId === 'string' &&
    event.orderItemId.length > 0 &&
    typeof event.menuItemId === 'string' &&
    event.menuItemId.length > 0 &&
    typeof event.restaurantId === 'string' &&
    event.restaurantId.length > 0 &&
    isQuantity(event.quantity) &&
    (event.modifiers === undefined ||
      (Array.isArray(event.modifiers) &&
        event.modifiers.every((modifier: unknown) => {
          if (!modifier || typeof modifier !== 'object') return false;
          const selected = modifier as Partial<OrderCompleteModifierEvent>;
          return (
            typeof selected.modifierId === 'string' &&
            selected.modifierId.length > 0 &&
            isQuantity(selected.quantity)
          );
        })))
  );
}

function isQuantity(value: unknown) {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}
