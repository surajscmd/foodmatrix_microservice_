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

  // ============================================================
  // CREATE ONE RECIPE
  // POST /recipe-items
  //
  // Creates one recipe for either:
  // 1. A menu item
  // 2. A modifier
  //
  // The DTO decides which one is the owner.
  // ============================================================

  @Post()
  async create(@Body() createDto: CreateRecipeItemDto) {
    const result = await this.recipeItemService.create(createDto);

    return {
      message: 'Recipe item created successfully',
      result,
    };
  }

  // ============================================================
  // CREATE MULTIPLE RECIPES
  // POST /recipe-items/bulk
  //
  // Creates multiple ingredients for one owner.
  //
  // Owner can be:
  // menuItemId OR modifierId
  //
  // Example:
  // Menu Item → Rice, Dal, Oil
  // Modifier  → Butter, Cheese
  // ============================================================

  @Post('bulk')
  async createBulk(@Body() createDto: CreateBulkRecipeItemDto) {
    const result = await this.recipeItemService.createBulk(createDto);

    return {
      message: 'Recipe items created successfully',
      data: result,
    };
  }

  // ============================================================
  // GET ALL MENU ITEMS WITH THEIR INGREDIENTS
  // GET /recipe-items/menu-items
  //
  // Returns menu items that have recipes.
  //
  // Pagination:
  // ?page=1&limit=10
  //
  // Example:
  // GET /recipe-items/menu-items?page=1&limit=10
  // ============================================================

  @Get('menu-items')
  async findAllMenuItems(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const result = await this.recipeItemService.findAllMenuItems(
      Number(page),
      Number(limit),
    );

    return {
      message: 'Menu item recipes retrieved successfully',
      data: result.data,
      pagination: result.pagination,
    };
  }

  // ============================================================
  // GET ALL MODIFIERS WITH THEIR INGREDIENTS
  // GET /recipe-items/modifiers
  //
  // Returns modifiers that have recipes.
  //
  // Pagination:
  // ?page=1&limit=10
  //
  // Example:
  // GET /recipe-items/modifiers?page=1&limit=10
  // ============================================================

  @Get('modifiers')
  async findAllModifiers(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const result = await this.recipeItemService.findAllModifiers(
      Number(page),
      Number(limit),
    );

    return {
      message: 'Modifier recipes retrieved successfully',
      data: result.data,
      pagination: result.pagination,
    };
  }

  // ============================================================
  // GET ALL RECIPES FOR ONE MENU ITEM
  // GET /recipe-items/menu-items/:menuItemId
  //
  // When frontend clicks a menu item,
  // use this endpoint to get all its ingredients.
  //
  // Example:
  // GET /recipe-items/menu-items/14bd0224-...
  // ============================================================

  @Get('menu-items/:menuItemId')
  async findMenuItemRecipes(@Param('menuItemId') menuItemId: string) {
    const result = await this.recipeItemService.findRecipes(
      menuItemId,
      undefined,
    );

    return {
      message: 'Menu item recipes retrieved successfully',
      ...result,
    };
  }

  // ============================================================
  // GET ALL RECIPES FOR ONE MODIFIER
  // GET /recipe-items/modifiers/:modifierId
  //
  // When frontend clicks a modifier,
  // use this endpoint to get all its ingredients.
  //
  // Example:
  // GET /recipe-items/modifiers/f2e0c712-...
  // ============================================================

  @Get('modifiers/:modifierId')
  async findModifierRecipes(@Param('modifierId') modifierId: string) {
    const result = await this.recipeItemService.findRecipes(
      undefined,
      modifierId,
    );

    return {
      message: 'Modifier recipes retrieved successfully',
      ...result,
    };
  }

  // ============================================================
  // GET ONE RECIPE
  // GET /recipe-items/:id
  //
  // Returns one RecipeItem record by its recipeItem ID.
  //
  // Example:
  // GET /recipe-items/35eade43-...
  // ============================================================

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.recipeItemService.findOne(id);

    return {
      message: 'Recipe item retrieved successfully',
      result,
    };
  }

  // ============================================================
  // UPDATE ONE RECIPE
  // PATCH /recipe-items/:id
  //
  // Can update:
  // - ingredientId
  // - quantityNeeded
  //
  // Example:
  // PATCH /recipe-items/35eade43-...
  // ============================================================

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

  // ============================================================
  // DELETE ONE RECIPE
  // DELETE /recipe-items/:id
  //
  // Deletes the RecipeItem record.
  //
  // Example:
  // DELETE /recipe-items/35eade43-...
  // ============================================================

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.recipeItemService.remove(id);
  }
}
