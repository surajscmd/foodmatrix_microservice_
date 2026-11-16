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

import { IngredientService } from './ingredient.service.js';
import { CreateIngredientDto } from './dto/create-ingredient.dto.js';
import { UpdateIngredientDto } from './dto/update-ingredient.dto.js';

@Controller('ingredients')
export class IngredientController {
  constructor(private readonly ingredientService: IngredientService) {}

  @Post()
  async create(@Body() createDto: CreateIngredientDto) {
    const result = await this.ingredientService.create(createDto);

    return {
      message: 'Ingredient created successfully',
      data: result,
    };
  }

  @Get()
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    const result = await this.ingredientService.findAll(
      Number(page),
      Number(limit),
      search,
    );

    return {
      message: 'Ingredients fetched successfully',

      data: result.data,

      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.ingredientService.findOne(id);

    return {
      message: 'Ingredient fetched successfully',
      data: result,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateIngredientDto,
  ) {
    const result = await this.ingredientService.update(id, updateDto);

    return {
      message: 'Ingredient updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.ingredientService.remove(id);

    return {
      message: 'Ingredient deactivated successfully',
      data: result,
    };
  }
}
