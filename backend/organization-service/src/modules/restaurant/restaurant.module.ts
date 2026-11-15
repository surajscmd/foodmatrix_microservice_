import { Module } from '@nestjs/common';
import { RestaurantService } from './restaurant.service.js';
import { RestaurantController } from './restaurant.controller.js';
import { HrAccessController } from './hr-access.controller.js';

@Module({
  controllers: [RestaurantController, HrAccessController],
  providers: [RestaurantService],
})
export class RestaurantModule {}
