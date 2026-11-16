import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { InternalCatalogService } from './internal-catalog.service.js';

import { CreateInternalCatalogDto } from './dto/create-internal-catalog.dto.js';
import { CreateInternalRecipeDto } from './dto/create-internal-recipe.dto.js';
import { GetInternalIngredientsDto } from './dto/get-internal-ingredients.dto.js';

import { InternalAuthGuard } from '../../common/guards/internal-auth.guard.js';
import { CatalogAccess } from '../../auth/catalog-access.js';

@Controller('internal/catalog')
@CatalogAccess('internal')
@UseGuards(InternalAuthGuard)
export class InternalCatalogController {
  constructor(private readonly internalService: InternalCatalogService) {}

  // ============================================================
  // BULK PRICING
  // ============================================================

  @Post('bulk-pricing')
  async getBulkPricing(@Body() dto: CreateInternalCatalogDto) {
    return this.internalService.getBulkPricing(
      dto.restaurantId,
      dto.menuItemIds,
      dto.modifierIds,
    );
  }

  // ============================================================
  // BULK RECIPES
  // ============================================================
  //
  // Inventory Service calls this endpoint to determine
  // which ingredients are consumed by menu items and modifiers.
  //
  // POST /internal/catalog/bulk-recipes
  //
  // Protected by InternalAuthGuard.
  // ============================================================

  @Post('bulk-recipes')
  async getBulkRecipes(@Body() dto: CreateInternalRecipeDto) {
    return this.internalService.getBulkRecipes(
      dto.menuItemIds,
      dto.modifierIds,
    );
  }

  // ============================================================
  // INGREDIENTS
  // ============================================================
  //
  // Fetch one or multiple ingredients.
  //
  // POST /internal/catalog/ingredients
  //
  // Protected by InternalAuthGuard.
  // ============================================================

  @Post('bulk-ingredients')
  getIngredients(@Body() dto: GetInternalIngredientsDto) {
    return this.internalService.getIngredients(dto.ingredientIds);
  }
}
