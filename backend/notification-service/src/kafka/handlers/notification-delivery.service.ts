import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { NotificationGateway } from '../../socket/notification.gateway.js';

@Injectable()
export class NotificationDeliveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationGateway,
  ) {}

  async sendOnce(
    eventId: string,
    notifications: Prisma.NotificationCreateManyInput[],
  ) {
    const created = await this.prisma.notification.createManyAndReturn({
      skipDuplicates: true,
      data: notifications.map((notification) => ({
        ...notification,
        id: this.notificationId(eventId, notification),
      })),
    });

    for (const notification of created) {
      if (notification.scope === 'RESTAURANT' && notification.restaurantId) {
        this.gateway.emitToRestaurant(notification.restaurantId, notification);
      }
      if (notification.scope === 'WAREHOUSE' && notification.warehouseId) {
        this.gateway.emitToWarehouse(notification.warehouseId, notification);
      }
    }
  }

  private notificationId(
    eventId: string,
    notification: Prisma.NotificationCreateManyInput,
  ) {
    const hash = createHash('sha256')
      .update(
        JSON.stringify([
          'inventory-notification',
          eventId,
          notification.type,
          notification.scope,
          notification.restaurantId,
          notification.warehouseId,
        ]),
      )
      .digest('hex');

    // UUIDv8 keeps the notification compatible with the existing read APIs.
    return [
      hash.slice(0, 8),
      hash.slice(8, 12),
      '8' + hash.slice(13, 16),
      '8' + hash.slice(17, 20),
      hash.slice(20, 32),
    ].join('-');
  }
}
