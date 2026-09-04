import { Module } from '@nestjs/common';
import { StockMovementService } from './stock-movement.service.js';
import { StockMovementController } from './stock-movement.controller.js';

@Module({
  controllers: [StockMovementController],
  providers: [StockMovementService],
})
export class StockMovementModule {}
