import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import { KafkaService } from './kafka.service';

@Injectable()
export class OrderInventoryOutbox implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderInventoryOutbox.name);
  private timer?: ReturnType<typeof setInterval>;
  private backlogTimer?: ReturnType<typeof setInterval>;
  private pending?: Promise<void>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafka: KafkaService,
  ) {}

  onModuleInit() {
    this.backlogTimer = setInterval(() => {
      void this.reportBacklog();
    }, 60_000);
    this.timer = setInterval(() => {
      this.pending ??= this.publishPending()
        .catch((error: unknown) => {
          this.logger.warn(
            'Inventory event delivery failed. Will retry.',
            error,
          );
        })
        .finally(() => {
          this.pending = undefined;
        });
    }, 1000);
  }

  async onModuleDestroy() {
    clearInterval(this.timer);
    clearInterval(this.backlogTimer);
    await this.pending;
  }

  async reportBacklog() {
    try {
      const [queued, oldest] = await Promise.all([
        this.prisma.orderInventoryEvent.count(),
        this.prisma.orderInventoryEvent.findFirst({
          orderBy: { createdAt: 'asc' },
          select: { createdAt: true },
        }),
      ]);
      if (!oldest) return;

      const oldestAgeSeconds = Math.max(
        0,
        Math.floor((Date.now() - oldest.createdAt.getTime()) / 1000),
      );
      const backlog = {
        event: 'order_inventory_event_backlog',
        queued,
        oldestAgeSeconds,
      };
      if (oldestAgeSeconds >= 60) {
        this.logger.warn(backlog);
      } else {
        this.logger.log(backlog);
      }
    } catch (error) {
      this.logger.warn(
        'Unable to check the Order inventory event backlog.',
        error,
      );
    }
  }

  async publishPending() {
    const events = await this.prisma.orderInventoryEvent.findMany({
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    for (const event of events) {
      // Inventory deduplicates deliveries by order item ID.
      await this.kafka.publish(
        'order-complete',
        event.payload,
        event.orderItemId,
      );
      await this.prisma.orderInventoryEvent.deleteMany({
        where: { orderItemId: event.orderItemId },
      });
    }
  }
}
