import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { RestaurantMenuItemService } from './restaurant-menu-item.service';
import { CreateRestaurantMenuItemDto } from './dto/create-restaurant-menu-item.dto';
import { ListRestaurantMenuItemsDto } from './dto/list-restaurant-menu-items.dto';
import { UpdateRestaurantMenuItemDto } from './dto/update-restaurant-menu-item.dto';
import {
  CatalogAccess,
  CatalogUser,
  type CatalogActor,
  catalogRestaurantIds,
  requireCatalogRestaurant,
} from '../../auth/catalog-access.js';

@Controller('restaurant-menu-item')
@CatalogAccess('restaurant')
export class RestaurantMenuItemController {
  constructor(
    private readonly restaurantMenuItemService: RestaurantMenuItemService,
  ) {}

  // ============================================================
  // CREATE
  // POST /restaurant-menu-item
  // ============================================================

  @Post()
  async create(
    @CatalogUser() actor: CatalogActor,
    @Body()
    createRestaurantMenuItemDto: CreateRestaurantMenuItemDto,
  ) {
    requireCatalogRestaurant(actor, createRestaurantMenuItemDto.restaurantId);
    const result = await this.restaurantMenuItemService.create(
      createRestaurantMenuItemDto,
    );

    return {
      message: 'Restaurant menu item created successfully',
      data: result,
    };
  }

  // ============================================================
  // GET ALL MENU ITEMS FOR ONE RESTAURANT
  //
  // GET /restaurant-menu-item/restaurant/:restaurantId
  //
  // Pagination:
  // ?page=1&limit=10
  //
  // Returns ALL menu items.
  // Restaurant price overrides global price.
  // ============================================================

  @Get('restaurant/:restaurantId')
  async findAll(
    @CatalogUser() actor: CatalogActor,
    @Param('restaurantId') restaurantId: string,
    @Query() query: ListRestaurantMenuItemsDto,
  ) {
    requireCatalogRestaurant(actor, restaurantId);
    const { page, limit, ...filters } = query;
    const result = await this.restaurantMenuItemService.findAll(
      restaurantId,
      Number(page),
      Number(limit),
      filters,
    );

    return {
      message: 'Restaurant menu items retrieved successfully',
      ...result,
    };
  }

  // ============================================================
  // GET CHANGED ITEMS FOR ONE RESTAURANT
  //
  // GET /restaurant-menu-item/restaurant/:restaurantId/changed
  //
  // Returns ONLY items where restaurant price
  // is different from global basePrice.
  //
  // Pagination:
  // ?page=1&limit=10
  // ============================================================

  @Get('restaurant/:restaurantId/changed')
  async findChangedItems(
    @CatalogUser() actor: CatalogActor,
    @Param('restaurantId') restaurantId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    requireCatalogRestaurant(actor, restaurantId);
    const result = await this.restaurantMenuItemService.findChangedItems(
      restaurantId,
      Number(page),
      Number(limit),
    );

    return {
      message: 'Changed restaurant menu items retrieved successfully',
      data: result.data,
      pagination: result.pagination,
    };
  }

  // ============================================================
  // GET CHANGED ITEMS ACROSS ALL RESTAURANTS
  //
  // GET /restaurant-menu-item/changed
  //
  // Returns ONLY genuine price overrides.
  //
  // Pagination:
  // ?page=1&limit=10
  // ============================================================

  @Get('changed')
  async findAllChangedItems(
    @CatalogUser() actor: CatalogActor,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const result = await this.restaurantMenuItemService.findAllChangedItems(
      Number(page),
      Number(limit),
      catalogRestaurantIds(actor),
    );

    return {
      message: 'Changed restaurant menu items retrieved successfully',
      data: result.data,
      pagination: result.pagination,
    };
  }

  // ============================================================
  // GET ONE
  //
  // GET /restaurant-menu-item/:id
  // ============================================================

  @Get(':id')
  async findOne(@CatalogUser() actor: CatalogActor, @Param('id') id: string) {
    const result = await this.restaurantMenuItemService.findOne(
      id,
      catalogRestaurantIds(actor),
    );

    return {
      message: 'Restaurant menu item retrieved successfully',
      data: result,
    };
  }

  // ============================================================
  // UPDATE
  //
  // PATCH /restaurant-menu-item/:id
  // ============================================================

  @Patch(':id')
  async update(
    @CatalogUser() actor: CatalogActor,
    @Param('id') id: string,
    @Body()
    updateRestaurantMenuItemDto: UpdateRestaurantMenuItemDto,
  ) {
    const result = await this.restaurantMenuItemService.update(
      id,
      updateRestaurantMenuItemDto,
      catalogRestaurantIds(actor),
    );

    return {
      message: 'Restaurant menu item updated successfully',
      data: result,
    };
  }

  // ============================================================
  // DELETE
  //
  // DELETE /restaurant-menu-item/:id
  // ============================================================

  @Delete(':id')
  async remove(@CatalogUser() actor: CatalogActor, @Param('id') id: string) {
    const result = await this.restaurantMenuItemService.remove(
      id,
      catalogRestaurantIds(actor),
    );

    return {
      message: 'Restaurant menu item deleted successfully',
      data: result,
    };
  }
}
