import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';

export type NotificationLocation = 'restaurant' | 'warehouse';

type NotificationActor = {
  role: string;
  managedRestaurantId: string | null;
  restaurantIds: string[];
  warehouseIds: string[];
};

function isActor(value: unknown): value is NotificationActor {
  if (!value || typeof value !== 'object') return false;
  const actor = value as Partial<NotificationActor>;
  return (
    typeof actor.role === 'string' &&
    (actor.managedRestaurantId === null ||
      typeof actor.managedRestaurantId === 'string') &&
    Array.isArray(actor.restaurantIds) &&
    actor.restaurantIds.every((id) => typeof id === 'string') &&
    Array.isArray(actor.warehouseIds) &&
    actor.warehouseIds.every((id) => typeof id === 'string')
  );
}

@Injectable()
export class NotificationAccessService {
  private readonly organizationUrl = (
    process.env.ORGANIZATION_SERVICE_URL ?? 'http://localhost:3001'
  ).replace(/\/+$/, '');

  async fromBearer(authorization?: string) {
    const token = authorization?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token) throw new UnauthorizedException('Bearer token required');
    const actor = await this.request('/notification-access', {
      Authorization: 'Bearer ' + token,
    });
    if (!isActor(actor))
      throw new ServiceUnavailableException(
        'Organization access response is invalid',
      );
    return actor;
  }

  async fromCookie(cookie?: string) {
    if (!cookie)
      throw new UnauthorizedException('Sign in to receive notifications');
    const session = await this.request('/api/auth/token', { Cookie: cookie });
    if (
      !session ||
      typeof session !== 'object' ||
      !('token' in session) ||
      typeof session.token !== 'string' ||
      !session.token
    )
      throw new UnauthorizedException('No notification session');
    return this.fromBearer('Bearer ' + session.token);
  }

  allows(actor: NotificationActor, location: NotificationLocation, id: string) {
    if (location === 'restaurant') {
      return (
        ['RESTAURANT_ADMIN', 'STAFF'].includes(actor.role) &&
        actor.managedRestaurantId === id &&
        actor.restaurantIds.includes(id)
      );
    }
    return (
      ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'OPERATIONS'].includes(actor.role) &&
      actor.warehouseIds.includes(id)
    );
  }

  private async request(
    path: string,
    headers: Record<string, string>,
  ): Promise<unknown> {
    let response: Response;
    try {
      response = await fetch(this.organizationUrl + path, {
        headers: { ...headers, Accept: 'application/json' },
        redirect: 'error',
        signal: AbortSignal.timeout(3000),
      });
    } catch {
      throw new ServiceUnavailableException(
        'Organization access is unavailable',
      );
    }
    if (response.status === 401)
      throw new UnauthorizedException('Invalid or expired session');
    if (response.status === 403)
      throw new ForbiddenException('No notification access');
    if (!response.ok)
      throw new ServiceUnavailableException(
        'Organization access is unavailable',
      );
    return response.json().catch(() => null);
  }
}
