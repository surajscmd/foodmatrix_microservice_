import { Module } from '@nestjs/common';
import { RestaurantService } from './restaurant.service.js';
import { RestaurantController } from './restaurant.controller.js';

@Module({
  controllers: [RestaurantController],
  providers: [RestaurantService],
})
export class RestaurantModule {}
