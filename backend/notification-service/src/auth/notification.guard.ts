import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../lib/prisma/prisma.service.js';
import { NotificationAccessService } from './notification-access.service.js';

@Injectable()
export class NotificationGuard implements CanActivate {
  constructor(
    private readonly access: NotificationAccessService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<Request<Record<string, string>>>();
    const actor = await this.access.fromBearer(request.headers.authorization);
    const { restaurantId, warehouseId, id } = request.params;

    if (restaurantId || warehouseId) {
      const allowed = restaurantId
        ? this.access.allows(actor, 'restaurant', restaurantId.toLowerCase())
        : this.access.allows(actor, 'warehouse', warehouseId.toLowerCase());
      if (!allowed)
        throw new ForbiddenException(
          'Notification location is not available to this account',
        );
      return true;
    }

    if (!id) throw new ForbiddenException('Notification scope required');
    const notification = await this.prisma.notification.findUnique({
      where: { id: id.toLowerCase() },
      select: { scope: true, restaurantId: true, warehouseId: true },
    });
    const location =
      notification?.scope === 'RESTAURANT' ? 'restaurant' : 'warehouse';
    const locationId =
      location === 'restaurant'
        ? notification?.restaurantId
        : notification?.warehouseId;
    if (!locationId || !this.access.allows(actor, location, locationId))
      throw new NotFoundException('Notification not found');
    return true;
  }
}
