import {
  createParamDecorator,
  type ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

export const catalogRoles = [
  'SUPER_ADMIN',
  'FRANCHISE_ADMIN',
  'RESTAURANT_ADMIN',
  'OPERATIONS',
  'STAFF',
] as const;

export type CatalogActor = {
  id: string;
  role: (typeof catalogRoles)[number];
  managedRestaurantId: string | null;
  restaurants: { id: string }[];
};

export type CatalogRequest = Request & { catalogActor?: CatalogActor };

export const CatalogAccess = Reflector.createDecorator<
  'health' | 'internal' | 'restaurant'
>();

export const CatalogUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CatalogActor => {
    const actor = context
      .switchToHttp()
      .getRequest<CatalogRequest>().catalogActor;
    if (!actor) throw new UnauthorizedException();
    return actor;
  },
);

export function catalogRestaurantIds(
  actor: CatalogActor,
): string[] | undefined {
  if (actor.role === 'SUPER_ADMIN') return undefined;
  return actor.restaurants
    .map(({ id }) => id)
    .filter(
      (id) =>
        actor.role === 'FRANCHISE_ADMIN' || id === actor.managedRestaurantId,
    );
}

export function requireCatalogRestaurant(
  actor: CatalogActor,
  restaurantId: string,
) {
  const allowed =
    catalogRestaurantIds(actor) ?? actor.restaurants.map(({ id }) => id);
  if (!allowed.includes(restaurantId)) {
    throw new ForbiddenException('Restaurant is outside your Catalog scope');
  }
}
