import { Module } from '@nestjs/common';

import { CatalogGatewayService } from '../../utils/caltalog-gateway.service.js';

import { StockRequestController } from './stock-request.controller.js';
import { StockRequestService } from './stock-request.service.js';

@Module({
  controllers: [StockRequestController],
  providers: [StockRequestService, CatalogGatewayService],
})
export class StockRequestModule {}
