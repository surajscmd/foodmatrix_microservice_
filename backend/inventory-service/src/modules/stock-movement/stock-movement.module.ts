import { Module } from '@nestjs/common';
import { StockMovementService } from './stock-movement.service.js';
import { StockMovementController } from './stock-movement.controller.js';
import { CatalogGatewayService } from '../../utils/caltalog-gateway.service.js';

@Module({
  controllers: [StockMovementController],
  providers: [StockMovementService, CatalogGatewayService],
})
export class StockMovementModule {}
