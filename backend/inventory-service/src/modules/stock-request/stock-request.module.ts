import { Module } from '@nestjs/common';
import { StockRequestService } from './stock-request.service.js';
import { StockRequestController } from './stock-request.controller.js';

@Module({
  controllers: [StockRequestController],
  providers: [StockRequestService],
})
export class StockRequestModule {}
