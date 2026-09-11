import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { Kafka } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);

  private readonly kafka = new Kafka({
    clientId: 'hr-service-producer',
    brokers: ['localhost:9094', 'localhost:9095', 'localhost:9096'],
  });

  private readonly producer = this.kafka.producer();

  /**
   * Connect to Kafka when the service starts.
   */
  async onModuleInit(): Promise<void> {
    await this.producer.connect();

    this.logger.log('Kafka producer connected');
  }

  /**
   * Publish an event to Kafka.
   */
  async publish(topic: string, message: unknown): Promise<void> {
    await this.producer.send({
      topic,
      messages: [
        {
          value: JSON.stringify(message),
        },
      ],
    });

    this.logger.log(`Kafka event published: ${topic}`);
  }

  /**
   * Disconnect from Kafka when the service shuts down.
   */
  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();

    this.logger.log('Kafka producer disconnected');
  }
}
