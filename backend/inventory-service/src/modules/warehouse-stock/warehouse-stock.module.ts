import { Module } from '@nestjs/common';
import { WarehouseStockService } from './warehouse-stock.service.js';
import { WarehouseStockController } from './warehouse-stock.controller.js';
import { CatalogGatewayService } from '../../utils/caltalog-gateway.service.js';

@Module({
  controllers: [WarehouseStockController],
  providers: [WarehouseStockService, CatalogGatewayService],
})
export class WarehouseStockModule {}
