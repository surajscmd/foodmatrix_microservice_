import { InventoryAccess } from '../../auth/inventory-access.js';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { RestaurantStockService } from './restaurant-stock.service.js';
import { AdjustStockDto } from './dto/adjust-stock.dto.js';

@Controller('restaurant-stock')
export class RestaurantStockController {
  constructor(
    private readonly restaurantStockService: RestaurantStockService,
  ) {}

  // ======================================================
  // GET ALL RESTAURANT STOCK
  //
  // RESTAURANT MANAGER
  //
  // GET /restaurant-stock/:restaurantId
  // ======================================================

  @Get(':restaurantId')
  @InventoryAccess('restaurant-read')
  async findByRestaurant(
    @Param('restaurantId') restaurantId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const result = await this.restaurantStockService.findByRestaurant(
      restaurantId,
      Number(page),
      Number(limit),
    );

    return {
      message: 'Restaurant stock fetched successfully.',
      ...result,
    };
  }

  // ======================================================
  // GET LOW STOCK
  //
  // RESTAURANT MANAGER
  //
  // IMPORTANT:
  // This route must come before :ingredientId
  //
  // GET /restaurant-stock/:restaurantId/low-stock
  // ======================================================

  @Get(':restaurantId/low-stock')
  @InventoryAccess('restaurant-read')
  async findLowStock(
    @Param('restaurantId') restaurantId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const result = await this.restaurantStockService.findLowStock(
      restaurantId,
      Number(page),
      Number(limit),
    );

    return {
      message: 'Low stock items fetched successfully.',
      ...result,
    };
  }

  // ======================================================
  // GET ONE INGREDIENT STOCK
  //
  // RESTAURANT MANAGER
  //
  // GET /restaurant-stock/:restaurantId/:ingredientId
  // ======================================================

  @Get(':restaurantId/:ingredientId')
  @InventoryAccess('restaurant-read')
  async findOne(
    @Param('restaurantId') restaurantId: string,
    @Param('ingredientId') ingredientId: string,
  ) {
    const data = await this.restaurantStockService.findOne(
      restaurantId,
      ingredientId,
    );

    return {
      message: 'Restaurant stock fetched successfully.',
      data,
    };
  }
  // ======================================================
  // ADJUST RESTAURANT STOCK
  //
  // Physical stock correction.
  //
  // POST /restaurant-stock/:restaurantId/:ingredientId/adjust
  //
  // Positive:
  //   +5  → increase stock
  //
  // Negative:
  //   -2  → decrease stock
  // ======================================================

  @Post(':restaurantId/:ingredientId/adjust')
  @InventoryAccess('restaurant-write')
  async adjustStock(
    @Param('restaurantId') restaurantId: string,
    @Param('ingredientId') ingredientId: string,
    @Body() dto: AdjustStockDto,
  ) {
    const data = await this.restaurantStockService.adjustStock(
      restaurantId,
      ingredientId,
      dto,
    );

    return {
      message: 'Restaurant stock adjusted successfully',
      data,
    };
  }
}
