import { Module } from '@nestjs/common';
import { PrismaModule } from '../../lib/prisma/prisma.module.js';
import { KafkaModule } from '../../kafka/kafka.module.js';
import { InventorySchedulerService } from './schedule.service.js';
import { CatalogGatewayService } from '../../utils/caltalog-gateway.service.js';

@Module({
  imports: [PrismaModule, KafkaModule],
  providers: [InventorySchedulerService, CatalogGatewayService],
})
export class SchedulerModule {}
