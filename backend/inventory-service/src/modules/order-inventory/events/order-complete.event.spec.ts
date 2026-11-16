import { expect, it } from '@jest/globals';
import { isOrderCompleteEvent } from './order-complete.event.js';

const event = {
  orderItemId: 'order-item',
  menuItemId: 'dish',
  restaurantId: 'restaurant',
  quantity: 2,
};

it('accepts an order event with no modifiers and rejects invalid quantities', () => {
  expect(isOrderCompleteEvent(event)).toBe(true);
  expect(isOrderCompleteEvent({ ...event, quantity: 1.5 })).toBe(false);
  expect(
    isOrderCompleteEvent({
      ...event,
      modifiers: [{ modifierId: 'extra', quantity: 0 }],
    }),
  ).toBe(false);
});
