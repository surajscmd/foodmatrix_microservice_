import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser, HrRestaurant } from './auth.types.js';

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

function isRestaurant(value: unknown): value is HrRestaurant {
  if (!value || typeof value !== 'object') return false;
  const restaurant = value as Partial<HrRestaurant>;
  return (
    typeof restaurant.id === 'string' &&
    typeof restaurant.name === 'string' &&
    typeof restaurant.timezone === 'string' &&
    typeof restaurant.currency === 'string'
  );
}

function isAuthenticatedUser(value: unknown): value is AuthenticatedUser {
  if (!value || typeof value !== 'object') return false;
  const user = value as Partial<AuthenticatedUser>;
  return (
    typeof user.id === 'string' &&
    user.id.length > 0 &&
    typeof user.role === 'string' &&
    (user.franchiseId === null || typeof user.franchiseId === 'string') &&
    (user.managedRestaurantId === null ||
      typeof user.managedRestaurantId === 'string') &&
    (user.systemUserId === undefined ||
      typeof user.systemUserId === 'string') &&
    Array.isArray(user.restaurants) &&
    user.restaurants.every(isRestaurant)
  );
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly contextUrl = new URL(
    'hr-access',
    (process.env.ORGANIZATION_SERVICE_URL ?? 'http://localhost:3001')
      .replace(/\/+$/, '')
      .concat('/'),
  );

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const token = authorization.match(/^Bearer (\S+)$/i)?.[1];
    if (!token) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    let response: Response;
    try {
      response = await fetch(this.contextUrl, {
        headers: { Authorization: 'Bearer ' + token },
        redirect: 'error',
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      throw new ServiceUnavailableException(
        'Organization access is unavailable',
      );
    }
    if (response.status === 401)
      throw new UnauthorizedException('Invalid or expired token');
    if (response.status === 403)
      throw new ForbiddenException('No assigned HR scope');
    if (!response.ok)
      throw new ServiceUnavailableException(
        'Organization access is unavailable',
      );

    const user: unknown = await response.json().catch(() => null);
    if (!isAuthenticatedUser(user)) {
      throw new ServiceUnavailableException(
        'Organization access response is invalid',
      );
    }
    request.user = user;
    return true;
  }
}
