import { Module } from '@nestjs/common';

import { KafkaModule } from '../../kafka/kafka.module.js';
import { CatalogGatewayService } from '../../utils/caltalog-gateway.service.js';

import { StockRequestController } from './stock-request.controller.js';
import { StockRequestService } from './stock-request.service.js';
import { StockRequestIdentityService } from './stock-request-identity.service.js';

@Module({
  imports: [KafkaModule],
  controllers: [StockRequestController],
  providers: [
    StockRequestService,
    StockRequestIdentityService,
    CatalogGatewayService,
  ],
})
export class StockRequestModule {}
