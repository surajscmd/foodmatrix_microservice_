import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  CatalogAccess,
  type CatalogActor,
  type CatalogRequest,
  catalogRoles,
} from './catalog-access.js';

function isRestaurant(
  value: unknown,
): value is CatalogActor['restaurants'][number] {
  return (
    value !== null &&
    typeof value === 'object' &&
    'id' in value &&
    typeof value.id === 'string' &&
    value.id.length > 0
  );
}

function isCatalogActor(value: unknown): value is CatalogActor {
  if (value === null || typeof value !== 'object') return false;
  const actor = value as Partial<CatalogActor>;
  return (
    typeof actor.id === 'string' &&
    actor.id.length > 0 &&
    catalogRoles.some((role) => role === actor.role) &&
    (actor.managedRestaurantId === null ||
      typeof actor.managedRestaurantId === 'string') &&
    Array.isArray(actor.restaurants) &&
    actor.restaurants.every(isRestaurant)
  );
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly accessUrl = new URL(
    'catalog-access',
    (process.env.ORGANIZATION_SERVICE_URL ?? 'http://localhost:3001')
      .replace(/\/+$/, '')
      .concat('/'),
  );

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext) {
    const access = this.reflector.getAllAndOverride(CatalogAccess, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (access === 'health' || access === 'internal') return true;

    const request = context.switchToHttp().getRequest<CatalogRequest>();
    const token = request.headers.authorization?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token) throw new UnauthorizedException('Bearer token required');

    let response: Response;
    try {
      response = await fetch(this.accessUrl, {
        headers: { Authorization: 'Bearer ' + token },
        redirect: 'error',
        signal: AbortSignal.timeout(5_000),
      });
    } catch {
      throw new ServiceUnavailableException(
        'Organization access is unavailable',
      );
    }
    if (response.status === 401)
      throw new UnauthorizedException('Invalid or expired session');
    if (response.status === 403)
      throw new ForbiddenException('No assigned Catalog scope');
    if (!response.ok)
      throw new ServiceUnavailableException(
        'Organization access is unavailable',
      );
    const actor: unknown = await response.json().catch(() => null);
    if (!isCatalogActor(actor))
      throw new ServiceUnavailableException(
        'Organization access response is invalid',
      );

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      if (access === 'restaurant') {
        if (actor.role === 'STAFF')
          throw new ForbiddenException(
            'Restaurant management access is required',
          );
      } else if (actor.role !== 'SUPER_ADMIN') {
        throw new ForbiddenException(
          'Only super admins can edit the shared catalog',
        );
      }
    }
    request.catalogActor = actor;
    return true;
  }
}
