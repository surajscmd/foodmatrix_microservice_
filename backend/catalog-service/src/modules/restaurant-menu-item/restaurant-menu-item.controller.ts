/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RestaurantMenuItemService } from './restaurant-menu-item.service';
import { CreateRestaurantMenuItemDto } from './dto/create-restaurant-menu-item.dto';
import { UpdateRestaurantMenuItemDto } from './dto/update-restaurant-menu-item.dto';

@Controller('restaurant-menu-item')
export class RestaurantMenuItemController {
  constructor(
    private readonly restaurantMenuItemService: RestaurantMenuItemService,
  ) {}

  @Post()
  async create(
    @Body() createRestaurantMenuItemDto: CreateRestaurantMenuItemDto,
  ) {
    const result = await this.restaurantMenuItemService.create(
      createRestaurantMenuItemDto,
    );
    return {
      message: 'Restaurant menu item created successfully',
      result,
    };
  }

  @Get()
  async findAll() {
    const result = await this.restaurantMenuItemService.findAll();
    return {
      message: 'Restaurant menu items retrieved successfully',
      result,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.restaurantMenuItemService.findOne(id);
    return {
      message: 'Restaurant menu item retrieved successfully',
      result,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRestaurantMenuItemDto: UpdateRestaurantMenuItemDto,
  ) {
    const result = await this.restaurantMenuItemService.update(
      id,
      updateRestaurantMenuItemDto,
    );
    return {
      message: 'Restaurant menu item updated successfully',
      result,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.restaurantMenuItemService.remove(id);
    return {
      result,
    };
  }
}
