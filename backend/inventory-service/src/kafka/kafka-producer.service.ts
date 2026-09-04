import { Injectable } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { Kafka } from 'kafkajs';
import type { Producer } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly kafka = new Kafka({
    clientId: 'inventory-service-producer',
    brokers: ['localhost:9094', 'localhost:9095', 'localhost:9096'],
  });

  private readonly producer: Producer = this.kafka.producer();

  async onModuleInit() {
    await this.producer.connect();

    console.log('Inventory Kafka producer connected');
  }

  async publish(topic: string, message: unknown) {
    await this.producer.send({
      topic,
      messages: [
        {
          value: JSON.stringify(message),
        },
      ],
    });

    console.log(`Kafka event published: ${topic}`);
  }

  async onModuleDestroy() {
    await this.producer.disconnect();

    console.log('Inventory Kafka producer disconnected');
  }
}
