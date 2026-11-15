import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedUser } from './auth.types.js';

export const HrUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    if (!user) throw new UnauthorizedException();
    return user;
  },
);

export type RestaurantFilter = string | { in: string[] };

export function restaurantScope(
  user: AuthenticatedUser,
  requested?: string,
  allowStaff = false,
): RestaurantFilter | undefined {
  if (user.role === 'SUPER_ADMIN') return requested;
  if (user.role === 'FRANCHISE_ADMIN') {
    const allowed = user.restaurants.map(({ id }) => id);
    if (!requested) return { in: allowed };
    if (allowed.includes(requested)) return requested;
    throw new ForbiddenException('You do not have access to these HR records');
  }
  if (
    (user.role === 'RESTAURANT_ADMIN' ||
      user.role === 'OPERATIONS' ||
      (allowStaff && user.role === 'STAFF')) &&
    user.managedRestaurantId &&
    user.restaurants.some(({ id }) => id === user.managedRestaurantId) &&
    (!requested || requested === user.managedRestaurantId)
  ) {
    return user.managedRestaurantId;
  }
  throw new ForbiddenException('You do not have access to these HR records');
}

export function restaurantDetails(user: AuthenticatedUser, id: string) {
  const restaurant = user.restaurants.find((item) => item.id === id);
  if (!restaurant)
    throw new NotFoundException('Restaurant details are unavailable');
  return restaurant;
}
