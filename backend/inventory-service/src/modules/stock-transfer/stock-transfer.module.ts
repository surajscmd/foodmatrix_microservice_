import { Module } from '@nestjs/common';

import { KafkaModule } from '../../kafka/kafka.module.js';
import { CatalogGatewayService } from '../../utils/caltalog-gateway.service.js';

import { StockTransferController } from './stock-transfer.controller.js';
import { StockTransferService } from './stock-transfer.service.js';

@Module({
  imports: [KafkaModule],
  controllers: [StockTransferController],
  providers: [StockTransferService, CatalogGatewayService],
})
export class StockTransferModule {}