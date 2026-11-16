import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const orderRoles = [
  'SUPER_ADMIN',
  'FRANCHISE_ADMIN',
  'RESTAURANT_ADMIN',
  'OPERATIONS',
  'STAFF',
] as const;

export type OrderActor = {
  role: (typeof orderRoles)[number];
  managedRestaurantId: string | null;
  restaurants: { id: string }[];
};

export const OrderAccess = Reflector.createDecorator<
  | 'health'
  | 'customers'
  | 'dashboard'
  | 'restaurant'
  | 'create-order'
  | 'order'
  | 'create-payment'
  | 'order-payments'
  | 'payment'
  | 'refund-order'
  | 'refund-payment'
>();

export const OrderActorRole = createParamDecorator(
  (_data: unknown, context: ExecutionContext): OrderActor['role'] =>
    context.switchToHttp().getRequest<{ orderActorRole: OrderActor['role'] }>()
      .orderActorRole,
);

export const OrderRestaurant = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string =>
    context.switchToHttp().getRequest<{ orderRestaurantId: string }>()
      .orderRestaurantId,
);
