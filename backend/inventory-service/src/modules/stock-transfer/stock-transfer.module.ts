import { Module } from '@nestjs/common';
import { StockTransferService } from './stock-transfer.service.js';
import { StockTransferController } from './stock-transfer.controller.js';
import { CatalogGatewayService } from '../../utils/caltalog-gateway.service.js';
@Module({
  controllers: [StockTransferController],
  providers: [StockTransferService, CatalogGatewayService],
})
export class StockTransferModule {}
