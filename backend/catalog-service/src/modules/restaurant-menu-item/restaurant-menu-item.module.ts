import { Module } from '@nestjs/common';
import { RestaurantMenuItemService } from './restaurant-menu-item.service';
import { RestaurantMenuItemController } from './restaurant-menu-item.controller';

@Module({
  controllers: [RestaurantMenuItemController],
  providers: [RestaurantMenuItemService],
})
export class RestaurantMenuItemModule {}
