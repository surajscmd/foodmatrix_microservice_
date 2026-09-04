import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

@Injectable()
export class InternalCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // BULK PRICING
  // ============================================================

  async getBulkPricing(
    restaurantId: string,
    menuItemIds: string[],
    modifierIds: string[],
  ) {
    const uniqueMenuItemIds = this.getUniqueIds(menuItemIds);

    const uniqueModifierIds = this.getUniqueIds(modifierIds);

    const [restaurantMenuItems, menuItems, modifiers] = await Promise.all([
      this.findRestaurantMenuItems(restaurantId, uniqueMenuItemIds),

      this.findMenuItems(uniqueMenuItemIds),

      this.findModifiers(uniqueModifierIds),
    ]);

    const menuItemsResponse = this.buildMenuItemsResponse(
      uniqueMenuItemIds,
      restaurantMenuItems,
      menuItems,
    );

    const modifiersResponse = this.buildModifiersResponse(
      uniqueModifierIds,
      modifiers,
    );

    return {
      menuItems: menuItemsResponse,
      modifiers: modifiersResponse,
    };
  }

  // ============================================================
  // FETCH RESTAURANT MENU ITEMS
  // ============================================================

  private findRestaurantMenuItems(restaurantId: string, menuItemIds: string[]) {
    return this.prisma.restaurantMenuItem.findMany({
      where: {
        restaurantId,

        menuItemId: {
          in: menuItemIds,
        },
      },
    });
  }

  // ============================================================
  // FETCH GLOBAL MENU ITEMS
  // ============================================================

  private findMenuItems(menuItemIds: string[]) {
    return this.prisma.menuItem.findMany({
      where: {
        id: {
          in: menuItemIds,
        },
      },
    });
  }

  // ============================================================
  // FETCH MODIFIERS
  // ============================================================

  private findModifiers(modifierIds: string[]) {
    return this.prisma.modifier.findMany({
      where: {
        id: {
          in: modifierIds,
        },
      },
    });
  }

  // ============================================================
  // BUILD MENU ITEM RESPONSE
  // ============================================================

  private buildMenuItemsResponse(
    menuItemIds: string[],
    restaurantMenuItems: Awaited<
      ReturnType<typeof this.findRestaurantMenuItems>
    >,
    menuItems: Awaited<ReturnType<typeof this.findMenuItems>>,
  ) {
    const restaurantItemMap = new Map(
      restaurantMenuItems.map((item) => [item.menuItemId, item]),
    );

    const menuItemMap = new Map(menuItems.map((item) => [item.id, item]));

    return menuItemIds.map((menuItemId) => {
      const menuItem = menuItemMap.get(menuItemId);

      if (!menuItem) {
        throw new NotFoundException(`Menu item ${menuItemId} was not found.`);
      }

      const restaurantItem = restaurantItemMap.get(menuItemId);

      // --------------------------------------------------------
      // RESTAURANT-SPECIFIC PRICE
      // --------------------------------------------------------

      if (restaurantItem) {
        const isAvailable = restaurantItem.isAvailable && menuItem.isAvailable;

        if (!isAvailable) {
          throw new NotFoundException(
            `Menu item ${menuItemId} is not currently available.`,
          );
        }

        return {
          menuItemId: menuItem.id,

          name: menuItem.name,

          sku: menuItem.sku,

          price: Number(restaurantItem.price),

          isAvailable,
        };
      }

      // --------------------------------------------------------
      // GLOBAL FALLBACK PRICE
      // --------------------------------------------------------

      if (!menuItem.isAvailable) {
        throw new NotFoundException(
          `Menu item ${menuItemId} is not currently available.`,
        );
      }

      return {
        menuItemId: menuItem.id,

        name: menuItem.name,

        sku: menuItem.sku,

        price: Number(menuItem.basePrice),

        isAvailable: menuItem.isAvailable,
      };
    });
  }

  // ============================================================
  // BUILD MODIFIER RESPONSE
  // ============================================================

  private buildModifiersResponse(
    modifierIds: string[],
    modifiers: Awaited<ReturnType<typeof this.findModifiers>>,
  ) {
    const modifierMap = new Map(
      modifiers.map((modifier) => [modifier.id, modifier]),
    );

    return modifierIds.map((modifierId) => {
      const modifier = modifierMap.get(modifierId);

      if (!modifier) {
        throw new NotFoundException(`Modifier ${modifierId} was not found.`);
      }

      if (!modifier.isActive) {
        throw new NotFoundException(
          `Modifier ${modifierId} is not currently available.`,
        );
      }

      return {
        id: modifier.id,

        name: modifier.name,

        extraPrice: Number(modifier.extraPrice),

        isActive: modifier.isActive,
      };
    });
  }

  // ============================================================
  // REMOVE DUPLICATES
  // ============================================================

  private getUniqueIds(ids: string[]): string[] {
    return [...new Set(ids)];
  }

  // ============================================================
  // BULK RECIPE FETCH
  //
  // Fetch recipes for:
  // - Menu items
  // - Modifiers
  //
  // Inventory Service uses this information
  // to calculate ingredient consumption.
  // ============================================================

  async getBulkRecipes(menuItemIds: string[], modifierIds: string[]) {
    const uniqueMenuItemIds = this.getUniqueIds(menuItemIds);

    const uniqueModifierIds = this.getUniqueIds(modifierIds);

    const [menuItemRecipes, modifierRecipes] = await Promise.all([
      this.findMenuItemRecipes(uniqueMenuItemIds),

      this.findModifierRecipes(uniqueModifierIds),
    ]);

    return {
      menuItems: this.buildMenuItemRecipesResponse(
        uniqueMenuItemIds,
        menuItemRecipes,
      ),

      modifiers: this.buildModifierRecipesResponse(
        uniqueModifierIds,
        modifierRecipes,
      ),
    };
  }

  // ============================================================
  // FETCH MENU ITEM RECIPES
  // ============================================================

  private findMenuItemRecipes(menuItemIds: string[]) {
    return this.prisma.recipeItem.findMany({
      where: {
        menuItemId: {
          in: menuItemIds,
        },
      },

      include: {
        ingredient: true,
      },
    });
  }

  // ============================================================
  // FETCH MODIFIER RECIPES
  // ============================================================

  private findModifierRecipes(modifierIds: string[]) {
    return this.prisma.recipeItem.findMany({
      where: {
        modifierId: {
          in: modifierIds,
        },
      },

      include: {
        ingredient: true,
      },
    });
  }

  // ============================================================
  // BUILD MENU ITEM RECIPE RESPONSE
  // ============================================================

  private buildMenuItemRecipesResponse(
    menuItemIds: string[],
    recipes: Awaited<ReturnType<typeof this.findMenuItemRecipes>>,
  ) {
    const recipeMap = new Map<string, typeof recipes>();

    for (const recipe of recipes) {
      if (!recipe.menuItemId) {
        continue;
      }

      const existing = recipeMap.get(recipe.menuItemId);

      if (existing) {
        existing.push(recipe);
      } else {
        recipeMap.set(recipe.menuItemId, [recipe]);
      }
    }

    return menuItemIds.map((menuItemId) => ({
      menuItemId,

      ingredients: (recipeMap.get(menuItemId) ?? []).map((recipe) => ({
        ingredientId: recipe.ingredientId,

        ingredientName: recipe.ingredient.name,

        uom: recipe.ingredient.uom,

        quantityNeeded: Number(recipe.quantityNeeded),
      })),
    }));
  }

  // ============================================================
  // BUILD MODIFIER RECIPE RESPONSE
  // ============================================================

  private buildModifierRecipesResponse(
    modifierIds: string[],
    recipes: Awaited<ReturnType<typeof this.findModifierRecipes>>,
  ) {
    const recipeMap = new Map<string, typeof recipes>();

    for (const recipe of recipes) {
      if (!recipe.modifierId) {
        continue;
      }

      const existing = recipeMap.get(recipe.modifierId);

      if (existing) {
        existing.push(recipe);
      } else {
        recipeMap.set(recipe.modifierId, [recipe]);
      }
    }

    return modifierIds.map((modifierId) => ({
      modifierId,

      ingredients: (recipeMap.get(modifierId) ?? []).map((recipe) => ({
        ingredientId: recipe.ingredientId,

        ingredientName: recipe.ingredient.name,

        uom: recipe.ingredient.uom,

        quantityNeeded: Number(recipe.quantityNeeded),
      })),
    }));
  }

  // ============================================================
  // BULK INGREDIENT FETCH
  //
  // Supports:
  // - Single ingredient ID
  // - Multiple ingredient IDs
  //
  // ============================================================

  async getIngredients(ingredientIds: string[]) {
    const uniqueIngredientIds = this.getUniqueIds(ingredientIds);

    const ingredients = await this.prisma.ingredient.findMany({
      where: {
        id: {
          in: uniqueIngredientIds,
        },
      },

      select: {
        id: true,
        name: true,
        uom: true,
        isActive: true,
      },
    });

    const ingredientMap = new Map(
      ingredients.map((ingredient) => [ingredient.id, ingredient]),
    );

    return uniqueIngredientIds.map((ingredientId) => {
      const ingredient = ingredientMap.get(ingredientId);

      if (!ingredient) {
        throw new NotFoundException(
          `Ingredient ${ingredientId} was not found.`,
        );
      }

      return ingredient;
    });
  }
}
