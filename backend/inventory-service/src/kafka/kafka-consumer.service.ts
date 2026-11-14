import { Injectable, Logger } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { Kafka } from 'kafkajs';
import type { Consumer } from 'kafkajs';

import {
  InsufficientRestaurantStockError,
  OrderInventoryService,
} from '../modules/order-inventory/order-inventory.service.js';

import type { OrderCompleteEvent } from '../modules/order-inventory/events/order-complete.event.js';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private readonly kafka = new Kafka({
    clientId: 'inventory-service-consumer',
    brokers: ['localhost:9094', 'localhost:9095', 'localhost:9096'],
  });

  private readonly consumer: Consumer = this.kafka.consumer({
    groupId: 'inventory-service-group',
  });
  private readonly failedEvents = this.kafka.producer();

  constructor(private readonly orderInventoryService: OrderInventoryService) {}

  // ======================================================
  // MODULE INIT
  // ======================================================

  async onModuleInit(): Promise<void> {
    // ----------------------------------------------------
    // CONNECT CONSUMER
    // ----------------------------------------------------

    await this.failedEvents.connect();
    await this.consumer.connect();

    console.log('Inventory Kafka consumer connected');

    // ----------------------------------------------------
    // SUBSCRIBE
    // ----------------------------------------------------

    await this.consumer.subscribe({
      topics: ['order-complete'],
      fromBeginning: true,
    });

    console.log('Inventory subscribed to topic: order-complete');

    // ----------------------------------------------------
    // CONSUME
    // ----------------------------------------------------

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (!message.value) {
          return;
        }

        const event = JSON.parse(
          message.value.toString(),
        ) as OrderCompleteEvent;

        console.log('\n========== KAFKA EVENT RECEIVED ==========');
        console.log('Topic:', topic);
        console.log('Partition:', partition);
        console.log('Offset:', message.offset);
        console.log('Event:', JSON.stringify(event, null, 2));
        console.log('==========================================');

        try {
          await this.orderInventoryService.processOrderComplete(event);
        } catch (error) {
          if (!(error instanceof InsufficientRestaurantStockError)) throw error;

          // Kafka may advance the source offset only after saving the failed event.
          await this.failedEvents.send({
            topic: 'order-complete-stock-shortage',
            acks: -1,
            messages: [
              {
                key: `${topic}:${partition}:${message.offset}`,
                value: JSON.stringify({
                  event,
                  source: { topic, partition, offset: message.offset },
                  ingredientId: error.ingredientId,
                  requiredQuantity: error.requiredQuantity,
                }),
              },
            ],
          });
          this.logger.warn(
            `Stock deduction deferred for item ${event.orderItemId}: ingredient ${error.ingredientId}, required ${error.requiredQuantity} (${topic}:${partition}:${message.offset}).`,
          );
        }
      },
    });
  }

  // ======================================================
  // MODULE DESTROY
  // ======================================================

  async onModuleDestroy(): Promise<void> {
    try {
      await this.consumer.disconnect();
    } finally {
      await this.failedEvents.disconnect();
    }

    console.log('Inventory Kafka consumer disconnected');
  }
}
