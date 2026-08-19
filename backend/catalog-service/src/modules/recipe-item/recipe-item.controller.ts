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

import { RecipeItemService } from './recipe-item.service';
import { CreateRecipeItemDto } from './dto/create-recipe-item.dto';
import { CreateBulkRecipeItemDto } from './dto/create-bulk-recipe-item.dto';
import { UpdateRecipeItemDto } from './dto/update-recipe-item.dto';

@Controller('recipe-items')
export class RecipeItemController {
  constructor(private readonly recipeItemService: RecipeItemService) {}

  @Post()
  async create(@Body() createDto: CreateRecipeItemDto) {
    const result = await this.recipeItemService.create(createDto);

    return {
      message: 'Recipe item created successfully',
      result,
    };
  }

  @Post('bulk')
  async createBulk(@Body() createDto: CreateBulkRecipeItemDto) {
    const result = await this.recipeItemService.createBulk(createDto);

    return {
      message: 'Recipe items in bulk created successfully',
      result,
    };
  }

  @Get()
  async findAll(
    @Query('menuItemId') menuItemId?: string,
    @Query('modifierId') modifierId?: string,
  ) {
    const result = await this.recipeItemService.findAll(menuItemId, modifierId);

    return {
      message: 'Recipe items retrieved successfully',
      result,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.recipeItemService.findOne(id);

    return {
      message: 'Recipe item retrieved successfully',
      result,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateRecipeItemDto,
  ) {
    const result = await this.recipeItemService.update(id, updateDto);

    return {
      message: 'Recipe item updated successfully',
      result,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.recipeItemService.remove(id);
  }
}
