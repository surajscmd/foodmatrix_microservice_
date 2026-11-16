import { InventoryOutboxService } from './inventory-outbox.service.js';
import { Module } from '@nestjs/common';

import { KafkaConsumerService } from './kafka-consumer.service.js';
import { KafkaProducerService } from './kafka-producer.service.js';
import { OrderInventoryModule } from '../modules/order-inventory/order-inventory.module.js';

@Module({
  imports: [OrderInventoryModule],

  providers: [
    KafkaConsumerService,
    KafkaProducerService,
    InventoryOutboxService,
  ],

  exports: [KafkaConsumerService, KafkaProducerService],
})
export class KafkaModule {}
