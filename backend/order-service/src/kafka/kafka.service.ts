import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer, Consumer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly kafka = new Kafka({
    clientId: 'order-service',
    brokers: [
      'localhost:9094',
      'localhost:9095',
      'localhost:9096',
    ],
  });

  private readonly producer: Producer = this.kafka.producer();

  async onModuleInit() {
    await this.producer.connect();

    console.log('Kafka producer connected');
  }

  async onModuleDestroy() {
    await this.producer.disconnect();

    console.log('Kafka producer disconnected');
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
  }
}