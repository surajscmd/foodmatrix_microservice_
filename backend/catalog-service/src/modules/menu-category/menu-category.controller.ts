import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { MenuCategoryService } from './menu-category.service.js';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto.js';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto.js';

@Controller('menu-categories')
export class MenuCategoryController {
  constructor(private readonly menuCategoryService: MenuCategoryService) {}

  @Post()
  async create(@Body() createDto: CreateMenuCategoryDto) {
    const result = await this.menuCategoryService.create(createDto);
    return {
      message: 'Menu category created successfully',
      data: result,
    };
  }

  @Get()
  async findAll() {
    const result = await this.menuCategoryService.findAll();
    return {
      message: 'Menu categories retrieved successfully',
      data: result,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.menuCategoryService.findOne(id);
    return {
      message: 'Menu category retrieved successfully',
      data: result,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateMenuCategoryDto,
  ) {
    const result = await this.menuCategoryService.update(id, updateDto);
    return {
      message: 'Menu category updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.menuCategoryService.remove(id);
    return {
      message: 'Menu category removed successfully',
      data: result,
    };
  }
}
