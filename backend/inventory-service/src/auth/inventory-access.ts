import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export type InventoryPolicy =
  | 'health'
  | 'admin'
  | 'restaurant-read'
  | 'restaurant-write'
  | 'warehouse'
  | 'request-read'
  | 'request-restaurant'
  | 'request-warehouse'
  | 'transfer-read'
  | 'transfer-restaurant'
  | 'transfer-warehouse'
  | 'waste-read';

export const InventoryAccess = Reflector.createDecorator<InventoryPolicy>();

export const inventoryRoles = [
  'SUPER_ADMIN',
  'FRANCHISE_ADMIN',
  'OPERATIONS',
  'RESTAURANT_ADMIN',
  'STAFF',
] as const;

export type InventoryActor = {
  userId: string;
  role: (typeof inventoryRoles)[number];
  franchiseId: string | null;
  managedRestaurantId: string | null;
  restaurantIds: string[];
  warehouseIds: string[];
};

export type InventoryContext = {
  userId: string;
  warehouseId?: string;
};

export const InventoryUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): InventoryContext =>
    context.switchToHttp().getRequest<{ inventoryContext: InventoryContext }>()
      .inventoryContext,
);
