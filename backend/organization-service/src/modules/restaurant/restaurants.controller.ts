import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { RestaurantsService } from './restaurants.service.js';

import { CreateRestaurantDto } from './dto/create-restaurant.dto.js';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto.js';
import { UpdateRestaurantStatusDto } from './dto/update-restaurant-status.dto.js';

@Controller({
  path: 'restaurants',
  version: '1',
})
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  // ============================================================
  // CREATE RESTAURANT
  // POST /v1/restaurants
  // ============================================================

  @Post()
  async create(@Body() createRestaurantDto: CreateRestaurantDto) {
    const restaurant =
      await this.restaurantsService.create(createRestaurantDto);

    return {
      message: 'Restaurant created successfully',
      data: restaurant,
    };
  }

  // ============================================================
  // GET ALL RESTAURANTS
  // GET /v1/restaurants
  //
  // Optional:
  // GET /v1/restaurants?regionId=UUID
  // ============================================================

  @Get()
  async findAll(@Query('regionId') regionId?: string) {
    const restaurants = await this.restaurantsService.findAll(regionId);

    return {
      message: regionId
        ? 'Restaurants retrieved successfully for the region'
        : 'Restaurants retrieved successfully',
      data: restaurants,
    };
  }

  // ============================================================
  // GET RESTAURANT BY ID
  // GET /v1/restaurants/:id
  // ============================================================

  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' }))
    id: string,
  ) {
    const restaurant = await this.restaurantsService.findOne(id);

    return {
      message: 'Restaurant retrieved successfully',
      data: restaurant,
    };
  }

  // ============================================================
  // UPDATE RESTAURANT DETAILS
  // PATCH /v1/restaurants/:id
  //
  // Updates:
  // name
  // address
  // city
  // state
  // country
  // timezone
  // regionId
  //
  // DOES NOT UPDATE STATUS
  // ============================================================

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' }))
    id: string,

    @Body() updateRestaurantDto: UpdateRestaurantDto,
  ) {
    const restaurant = await this.restaurantsService.update(
      id,
      updateRestaurantDto,
    );

    return {
      message: 'Restaurant updated successfully',
      data: restaurant,
    };
  }

  // ============================================================
  // UPDATE RESTAURANT STATUS
  // PATCH /v1/restaurants/:id/status
  //
  // ACTIVE / INACTIVE
  // ============================================================

  @Patch(':id/status')
  async updateStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' }))
    id: string,

    @Body() payload: UpdateRestaurantStatusDto,
  ) {
    const restaurant = await this.restaurantsService.updateStatus(
      id,
      payload.status,
    );

    return {
      message: 'Restaurant status updated successfully',
      data: restaurant,
    };
  }

  // ============================================================
  // DELETE RESTAURANT
  // DELETE /v1/restaurants/:id
  // ============================================================

  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' }))
    id: string,
  ) {
    const restaurant = await this.restaurantsService.remove(id);

    return {
      message: 'Restaurant deleted successfully',
      data: restaurant,
    };
  }
}
