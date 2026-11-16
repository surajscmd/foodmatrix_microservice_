import { Global, Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { OrderInventoryOutbox } from './order-inventory-outbox.service';

@Global()
@Module({
  providers: [KafkaService, OrderInventoryOutbox],
  exports: [KafkaService],
})
export class KafkaModule {}
