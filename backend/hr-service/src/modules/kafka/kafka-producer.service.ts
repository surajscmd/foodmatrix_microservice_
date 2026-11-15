import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { Kafka } from 'kafkajs';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../lib/prisma/prisma.service.js';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);

  private readonly kafka = new Kafka({
    clientId: 'hr-service-producer',
    connectionTimeout: 5_000,
    requestTimeout: 10_000,
    retry: { retries: 2 },
    brokers: (
      process.env.KAFKA_BROKERS ??
      'localhost:9094,localhost:9095,localhost:9096'
    )
      .split(',')
      .map((broker) => broker.trim())
      .filter(Boolean),
  });

  private readonly producer = this.kafka.producer();
  private timer?: ReturnType<typeof setInterval>;
  private work?: Promise<void>;
  private connected = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      if (this.work) return;
      this.work = this.deliverPending()
        .catch((error: unknown) => {
          this.logger.warn(
            `HR notifications will retry: ${error instanceof Error ? error.message : 'delivery failed'}`,
          );
        })
        .finally(() => {
          this.work = undefined;
        });
    }, 2_000);
  }

  async enqueue(
    tx: Prisma.TransactionClient,
    topic: string,
    payload: Prisma.InputJsonObject,
  ): Promise<void> {
    await tx.hrEventOutbox.create({ data: { topic, payload } });
  }

  private async deliverPending(): Promise<void> {
    for (let count = 0; count < 30; count++) {
      const [event] = await this.prisma.$queryRaw<
        { id: string; topic: string; payload: Prisma.JsonValue }[]
      >`
        UPDATE "HrEventOutbox"
        SET "availableAt" = CURRENT_TIMESTAMP + INTERVAL '2 minutes'
        WHERE id = (
          SELECT id FROM "HrEventOutbox"
          WHERE "availableAt" <= CURRENT_TIMESTAMP
          ORDER BY "createdAt", id
          LIMIT 1 FOR UPDATE SKIP LOCKED
        )
        RETURNING id, topic, payload
      `;
      if (!event) return;

      try {
        if (!this.connected) {
          await this.producer.connect();
          this.connected = true;
        }
        await this.producer.send({
          topic: event.topic,
          messages: [
            {
              value: JSON.stringify(event.payload),
              headers: { 'hr-event-id': event.id },
            },
          ],
        });
      } catch (error) {
        this.connected = false;
        await this.producer.disconnect().catch(() => undefined);
        throw error;
      }
      await this.prisma.hrEventOutbox.deleteMany({ where: { id: event.id } });
    }
  }

  async onModuleDestroy(): Promise<void> {
    clearInterval(this.timer);
    await this.work;
    if (this.connected) await this.producer.disconnect();
  }
}
