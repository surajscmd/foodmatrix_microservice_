import { Module } from '@nestjs/common';

import { KafkaConsumerService } from './kafka-consumer.service.js';
import { KafkaProducerService } from './kafka-producer.service.js';
import { OrderInventoryModule } from '../modules/order-inventory/order-inventory.module.js';

@Module({
  imports: [OrderInventoryModule],

  providers: [KafkaConsumerService, KafkaProducerService],

  exports: [KafkaConsumerService, KafkaProducerService],
})
export class KafkaModule {}
