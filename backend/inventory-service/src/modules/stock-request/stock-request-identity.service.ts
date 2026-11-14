import {
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

interface SystemUser {
  id: string;
  role: string;
  isActive: boolean;
  franchiseId: string | null;
  managedRestaurantId: string | null;
}

@Injectable()
export class StockRequestIdentityService {
  private readonly baseUrl = (
    process.env.ORGANIZATION_SERVICE_URL ?? 'http://localhost:3001'
  ).replace(/\/+$/, '');

  async warehouseActor(cookie: string | undefined) {
    const actor = await this.currentUser(cookie);
    if (
      !['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'OPERATIONS'].includes(actor.role)
    ) {
      throw new ForbiddenException(
        'A warehouse operations account is required.',
      );
    }

    if (actor.franchiseId)
      return { userId: actor.id, warehouseId: actor.franchiseId };

    // Operations uses the single franchise returned by Organization for global admins.
    if (actor.role === 'SUPER_ADMIN') {
      const franchise = await this.get<{ id: string }>('franchise', cookie);
      if (franchise.id) return { userId: actor.id, warehouseId: franchise.id };
    }
    throw new ForbiddenException('Your account has no warehouse assignment.');
  }

  async restaurantActor(cookie: string | undefined, restaurantId: string) {
    const actor = await this.currentUser(cookie);
    if (
      actor.role !== 'RESTAURANT_ADMIN' ||
      actor.managedRestaurantId !== restaurantId
    ) {
      throw new ForbiddenException(
        'A manager assigned to this restaurant is required.',
      );
    }
    const restaurant = await this.get<{ franchiseId: string | null }>(
      `restaurants/${encodeURIComponent(restaurantId)}`,
      cookie,
    );
    if (!restaurant.franchiseId)
      throw new ForbiddenException(
        'This restaurant has no franchise warehouse.',
      );
    return { userId: actor.id, warehouseId: restaurant.franchiseId };
  }

  private async currentUser(cookie: string | undefined) {
    const { systemUser } = await this.get<{ systemUser: SystemUser }>(
      'auth/me',
      cookie,
    );
    if (!systemUser?.isActive || !systemUser.id)
      throw new UnauthorizedException('An active account is required.');
    return systemUser;
  }

  private async get<T>(path: string, cookie: string | undefined): Promise<T> {
    if (!cookie)
      throw new UnauthorizedException('Sign in to manage stock requests.');
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/${path}`, {
        headers: { Cookie: cookie, Accept: 'application/json' },
        redirect: 'error',
        signal: AbortSignal.timeout(5_000),
      });
    } catch {
      throw new ServiceUnavailableException(
        'Unable to reach Organization Service.',
      );
    }
    if (response.status === 401)
      throw new UnauthorizedException(
        'Your session has expired. Sign in again.',
      );
    if (response.status === 403)
      throw new ForbiddenException(
        'You do not have access to this warehouse or restaurant.',
      );
    if (!response.ok)
      throw new ServiceUnavailableException(
        'Unable to look up the warehouse assignment.',
      );
    const result = (await response.json().catch(() => null)) as {
      data?: T;
    } | null;
    if (!result?.data)
      throw new ServiceUnavailableException(
        'Organization Service returned an invalid response.',
      );
    return result.data;
  }
}
