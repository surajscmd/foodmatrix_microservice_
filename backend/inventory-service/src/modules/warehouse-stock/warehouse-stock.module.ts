import { Module } from '@nestjs/common';
import { WarehouseStockService } from './warehouse-stock.service.js';
import { WarehouseStockController } from './warehouse-stock.controller.js';

@Module({
  controllers: [WarehouseStockController],
  providers: [WarehouseStockService],
})
export class WarehouseStockModule {}
