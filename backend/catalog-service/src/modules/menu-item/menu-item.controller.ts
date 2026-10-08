/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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

import { MenuItemService } from './menu-item.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
// POST   /menu-items
// GET    /menu-items
// GET    /menu-items/:id
// PATCH  /menu-items/:id
// DELETE /menu-items/:id
@Controller('menu-items')
export class MenuItemController {
  constructor(private readonly menuItemService: MenuItemService) {}

  @Post()
  async create(@Body() createDto: CreateMenuItemDto) {
    const result = await this.menuItemService.create(createDto);
    return {
      message: 'Menu item created successfully',
      data: result,
    };
  }

  @Get()
  async findAll(@Query('page') page = '1', @Query('limit') limit = '10') {
    const result = await this.menuItemService.findAll(
      Number(page),
      Number(limit),
    );

    return {
      message: 'Menu items retrieved successfully',
      ...result,
    };
  }
  @Get(':menuItemId/restaurants')
  async findRestaurantPrices(@Param('menuItemId') menuItemId: string) {
    const result = await this.menuItemService.findRestaurantPrices(menuItemId);

    return {
      message: 'Menu item restaurant pricing retrieved successfully',
      data: result,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.menuItemService.findOne(id);

    return {
      message: 'Menu item fetched successfully',
      data: result,
    };
  }
  @Get('category/:categoryId')
  async findByCategory(@Param('categoryId') categoryId: string) {
    const result = await this.menuItemService.findByCategory(categoryId);

    return {
      message: 'Menu items by category retrieved successfully',
      ...result,
    };
  }
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateMenuItemDto) {
    const result = await this.menuItemService.update(id, updateDto);

    return {
      message: 'Menu item updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.menuItemService.remove(id);

    return {
      message: 'Menu item deactivated successfully',
      data: result,
    };
  }
}
