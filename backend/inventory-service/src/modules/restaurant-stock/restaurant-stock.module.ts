import { Module } from '@nestjs/common';
import { RestaurantStockService } from './restaurant-stock.service.js';
import { RestaurantStockController } from './restaurant-stock.controller.js';

@Module({
  controllers: [RestaurantStockController],
  providers: [RestaurantStockService],
})
export class RestaurantStockModule {}
