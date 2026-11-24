import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import { kafkaSecurity } from './kafka-security.js';

@Injectable()
export class KafkaService implements OnModuleDestroy {
  private readonly producer = new Kafka({
    ...kafkaSecurity(),
    clientId: 'order-service',
    brokers: (
      process.env.KAFKA_BROKERS ||
      'localhost:9094,localhost:9095,localhost:9096'
    )
      .split(',')
      .map((broker) => broker.trim())
      .filter(Boolean),
  }).producer();

  private connection?: Promise<void>;

  async publish(topic: string, message: unknown, key: string) {
    this.connection ??= this.producer.connect().catch((error: unknown) => {
      this.connection = undefined;
      throw error;
    });
    await this.connection;
    await this.producer.send({
      topic,
      messages: [{ key, value: JSON.stringify(message) }],
    });
  }

  async onModuleDestroy() {
    if (this.connection) {
      await this.connection.catch(() => undefined);
      await this.producer.disconnect();
    }
  }
}
