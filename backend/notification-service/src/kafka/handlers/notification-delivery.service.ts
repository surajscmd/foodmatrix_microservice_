import {
  Injectable,
  Logger,
  type OnModuleInit,
  type OnModuleDestroy,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { NotificationGateway } from '../../socket/notification.gateway.js';

@Injectable()
export class NotificationDeliveryService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(NotificationDeliveryService.name);
  private timer?: ReturnType<typeof setInterval>;
  private work?: Promise<void>;
  private closing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationGateway,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.flushPending(), 1000);
    this.timer.unref();
  }

  async onModuleDestroy() {
    this.closing = true;
    clearInterval(this.timer);
    await this.work;
  }

  async sendOnce(
    eventId: string,
    notifications: Prisma.NotificationCreateManyInput[],
  ) {
    await this.prisma.$transaction(async (tx) => {
      const created = await tx.notification.createManyAndReturn({
        skipDuplicates: true,
        data: notifications.map((notification) => ({
          ...notification,
          id: this.notificationId(eventId, notification),
        })),
        select: { id: true },
      });
      if (created.length) {
        await tx.notificationSocketOutbox.createMany({
          data: created.map(({ id }) => ({ notificationId: id })),
        });
      }
    });

    await this.flushPending();
  }

  // Socket emission is at least once. The stable notification ID lets clients
  // refresh the saved record without creating duplicate notifications.
  flushPending(): Promise<void> {
    if (this.closing) return Promise.resolve();
    return (this.work ??= this.deliverPending()
      .catch((error: unknown) => {
        this.logger.warn(
          'Live notification delivery remains queued for retry.',
          error,
        );
      })
      .finally(() => {
        this.work = undefined;
      }));
  }

  private async deliverPending() {
    for (let count = 0; count < 50; count++) {
      // Claim outside a long-running transaction. An expired lease recovers work
      // after a crash, and SKIP LOCKED prevents replicas claiming the same row.
      const [event] = await this.prisma.$queryRaw<{ notificationId: string }[]>`
        UPDATE "NotificationSocketOutbox"
        SET "availableAt" = CURRENT_TIMESTAMP + INTERVAL '30 seconds'
        WHERE "notificationId" = (
          SELECT "notificationId" FROM "NotificationSocketOutbox"
          WHERE "availableAt" <= CURRENT_TIMESTAMP
          ORDER BY "availableAt", "createdAt", "notificationId"
          LIMIT 1 FOR UPDATE SKIP LOCKED
        )
        RETURNING "notificationId"
      `;
      if (!event) return;
      const notification = await this.prisma.notification.findUnique({
        where: { id: event.notificationId },
        select: {
          id: true,
          scope: true,
          restaurantId: true,
          warehouseId: true,
        },
      });

      if (notification?.scope === 'RESTAURANT' && notification.restaurantId) {
        this.gateway.emitToRestaurant(notification.restaurantId, notification);
      }
      if (notification?.scope === 'WAREHOUSE' && notification.warehouseId) {
        this.gateway.emitToWarehouse(notification.warehouseId, notification);
      }
      await this.prisma.notificationSocketOutbox.deleteMany({
        where: { notificationId: event.notificationId },
      });
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
