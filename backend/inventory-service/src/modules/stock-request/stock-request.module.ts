import { Module } from '@nestjs/common';
import { StockRequestService } from './stock-request.service.js';
import { StockRequestController } from './stock-request.controller.js';
import { CatalogGatewayService } from '../../utils/caltalog-gateway.service.js';

@Module({
  controllers: [StockRequestController],
  providers: [StockRequestService, CatalogGatewayService],
})
export class StockRequestModule {}
