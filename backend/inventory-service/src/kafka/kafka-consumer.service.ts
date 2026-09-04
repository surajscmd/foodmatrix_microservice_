import { Injectable } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { Kafka } from 'kafkajs';
import type { Consumer } from 'kafkajs';

import { OrderInventoryService } from '../modules/order-inventory/order-inventory.service.js';

import type { OrderCompleteEvent } from '../modules/order-inventory/events/order-complete.event.js';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly kafka = new Kafka({
    clientId: 'inventory-service-consumer',
    brokers: ['localhost:9094', 'localhost:9095', 'localhost:9096'],
  });

  private readonly consumer: Consumer = this.kafka.consumer({
    groupId: 'inventory-service-group',
  });

  constructor(private readonly orderInventoryService: OrderInventoryService) {}

  // ======================================================
  // MODULE INIT
  // ======================================================

  async onModuleInit(): Promise<void> {
    // ----------------------------------------------------
    // CONNECT CONSUMER
    // ----------------------------------------------------

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

        await this.orderInventoryService.processOrderComplete(event);
      },
    });
  }

  // ======================================================
  // MODULE DESTROY
  // ======================================================

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();

    console.log('Inventory Kafka consumer disconnected');
  }
}
