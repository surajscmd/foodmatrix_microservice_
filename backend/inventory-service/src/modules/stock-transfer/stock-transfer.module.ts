import { Module } from '@nestjs/common';
import { StockTransferService } from './stock-transfer.service.js';
import { StockTransferController } from './stock-transfer.controller.js';

@Module({
  controllers: [StockTransferController],
  providers: [StockTransferService],
})
export class StockTransferModule {}
