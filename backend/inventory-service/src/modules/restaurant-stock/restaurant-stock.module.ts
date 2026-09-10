import { Module } from '@nestjs/common';
import { RestaurantStockService } from './restaurant-stock.service.js';
import { RestaurantStockController } from './restaurant-stock.controller.js';
import { CatalogGatewayService } from '../../utils/caltalog-gateway.service.js';


@Module({
  controllers: [RestaurantStockController],
  providers: [RestaurantStockService, CatalogGatewayService],
})
export class RestaurantStockModule {}
