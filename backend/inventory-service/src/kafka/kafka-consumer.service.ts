import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { Kafka } from 'kafkajs';
import { isOrderCompleteEvent } from '../modules/order-inventory/events/order-complete.event.js';
import { OrderDeductionRetryService } from '../modules/order-inventory/order-deduction-retry.service.js';
import { PrismaService } from '../lib/prisma/prisma.service.js';
import { kafkaSecurity } from './kafka-security.js';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private readonly consumer = new Kafka({
    ...kafkaSecurity(),
    clientId: 'inventory-service-consumer',
    brokers: (
      process.env.KAFKA_BROKERS ||
      'localhost:9094,localhost:9095,localhost:9096'
    )
      .split(',')
      .map((broker) => broker.trim())
      .filter(Boolean),
  }).consumer({ groupId: 'inventory-service-group' });

  private connecting?: Promise<void>;
  private subscribed = false;
  private closing = false;

  constructor(
    private readonly deductions: OrderDeductionRetryService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.consumer.on(this.consumer.events.CRASH, ({ payload }) => {
      if (!payload.restart) this.subscribed = false;
    });
    this.connect();
  }

  @Interval(15000)
  connect() {
    if (this.closing || this.subscribed || this.connecting) return;
    this.connecting = this.subscribe()
      .catch(async (error: unknown) => {
        this.logger.warn(
          'Inventory Kafka consumer will retry its connection.',
          error,
        );
        await this.consumer.disconnect().catch(() => undefined);
      })
      .finally(() => {
        this.connecting = undefined;
      });
  }

  private async subscribe() {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topics: ['order-complete'],
      fromBeginning: true,
    });
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const source = { topic, partition, offset: message.offset };
        const raw = message.value?.toString() ?? '';
        let event: unknown;
        try {
          event = JSON.parse(raw) as unknown;
        } catch {
          event = null;
        }
        if (!isOrderCompleteEvent(event)) {
          await this.prisma.inventoryOutbox.upsert({
            where: { id: topic + ':' + partition + ':' + message.offset },
            create: {
              id: topic + ':' + partition + ':' + message.offset,
              topic: 'order-complete-invalid',
              payload: { source, raw },
            },
            update: {},
          });
          this.logger.warn(
            'Invalid order event queued for review at offset ' + message.offset,
          );
          return;
        }
        await this.deductions.processOrDefer(event, source);
      },
    });
    this.subscribed = true;
  }

  async onModuleDestroy() {
    this.closing = true;
    await this.connecting;
    await this.consumer.disconnect();
  }
}
