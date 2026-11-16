import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PrismaService } from '../lib/prisma/prisma.service.js';
import { KafkaProducerService } from './kafka-producer.service.js';

@Injectable()
export class InventoryOutboxService {
  private readonly logger = new Logger(InventoryOutboxService.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly producer: KafkaProducerService,
  ) {}

  @Interval(60_000)
  async reportBacklog() {
    try {
      const [
        queued,
        oldest,
        pendingDeductions,
        retryingDeductions,
        mostRetried,
      ] = await Promise.all([
        this.prisma.inventoryOutbox.count(),
        this.prisma.inventoryOutbox.findFirst({
          orderBy: { createdAt: 'asc' },
          select: { createdAt: true },
        }),
        this.prisma.inventoryPendingDeduction.count(),
        this.prisma.inventoryPendingDeduction.count({
          where: { attempts: { gt: 0 } },
        }),
        this.prisma.inventoryPendingDeduction.findFirst({
          where: { attempts: { gt: 0 } },
          orderBy: [{ attempts: 'desc' }, { retryAt: 'asc' }],
          select: {
            orderItemId: true,
            attempts: true,
            lastError: true,
            retryAt: true,
          },
        }),
      ]);

      const oldestAgeSeconds = oldest
        ? Math.max(
            0,
            Math.floor((Date.now() - oldest.createdAt.getTime()) / 1000),
          )
        : 0;
      const backlog = {
        event: 'inventory_event_backlog',
        queued,
        oldestAgeSeconds,
        pendingDeductions,
        retryingDeductions,
        mostRetried,
      };
      if (oldestAgeSeconds >= 60 || retryingDeductions > 0) {
        this.logger.warn(backlog);
      } else if (queued > 0 || pendingDeductions > 0) {
        this.logger.log(backlog);
      }
    } catch (error) {
      this.logger.warn('Unable to check the Inventory event backlog.', error);
    }
  }

  @Interval(1000)
  async publishPending() {
    if (this.running) return;
    this.running = true;
    try {
      const events = await this.prisma.inventoryOutbox.findMany({
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: 50,
      });
      for (const event of events) {
        await this.producer.publish(event.topic, event.payload, event.id);
        await this.prisma.inventoryOutbox.deleteMany({
          where: { id: event.id },
        });
      }
    } catch (error) {
      this.logger.warn('Inventory events remain queued for retry.', error);
    } finally {
      this.running = false;
    }
  }
}
