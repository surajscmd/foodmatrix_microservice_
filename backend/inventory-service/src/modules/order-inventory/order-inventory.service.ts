import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

import {
  CatalogGatewayService,
  type CatalogMenuItemRecipe,
  type CatalogModifierRecipe,
} from '../../utils/caltalog-gateway.service.js';

import type { OrderCompleteEvent } from './events/order-complete.event.js';

@Injectable()
export class OrderInventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogGatewayService: CatalogGatewayService,
  ) {}

  // ============================================================
  // PROCESS ORDER COMPLETE
  // ============================================================
  //
  // Kafka:
  //
  // order-complete
  //      ↓
  // Catalog recipes
  //      ↓
  // Calculate ingredient consumption
  //      ↓
  // RestaurantStock deduction
  //      ↓
  // POS_SALE movement
  //
  // ============================================================

  async processOrderComplete(event: OrderCompleteEvent): Promise<void> {
    // ----------------------------------------------------------
    // 1. VALIDATE EVENT
    // ----------------------------------------------------------

    if (!event.orderItemId) {
      throw new BadRequestException(
        'ORDER-COMPLETE event is missing orderItemId',
      );
    }

    if (!event.restaurantId) {
      throw new BadRequestException(
        'ORDER-COMPLETE event is missing restaurantId',
      );
    }

    if (!event.menuItemId) {
      throw new BadRequestException(
        'ORDER-COMPLETE event is missing menuItemId',
      );
    }

    if (event.quantity <= 0) {
      throw new BadRequestException('Order quantity must be greater than zero');
    }

    // ----------------------------------------------------------
    // 2. COLLECT IDS FOR CATALOG
    // ----------------------------------------------------------

    const menuItemIds = [event.menuItemId];

    const modifierIds = [
      ...new Set(event.modifiers?.map((modifier) => modifier.modifierId) ?? []),
    ];

    // ----------------------------------------------------------
    // 3. FETCH RECIPES FROM CATALOG
    // ----------------------------------------------------------

    const recipeResponse = await this.catalogGatewayService.getBulkRecipes(
      menuItemIds,
      modifierIds,
    );

    // ----------------------------------------------------------
    // 4. BUILD RECIPE MAPS
    // ----------------------------------------------------------

    const menuItemRecipeMap = new Map<string, CatalogMenuItemRecipe>();

    for (const recipe of recipeResponse.menuItems) {
      menuItemRecipeMap.set(recipe.menuItemId, recipe);
    }

    const modifierRecipeMap = new Map<string, CatalogModifierRecipe>();

    for (const recipe of recipeResponse.modifiers) {
      modifierRecipeMap.set(recipe.modifierId, recipe);
    }

    // ----------------------------------------------------------
    // 5. CALCULATE INGREDIENT CONSUMPTION
    // ----------------------------------------------------------

    const ingredientConsumption = new Map<string, Prisma.Decimal>();

    this.addMenuItemConsumption(
      event,
      menuItemRecipeMap,
      ingredientConsumption,
    );

    this.addModifierConsumption(
      event,
      modifierRecipeMap,
      ingredientConsumption,
    );

    // ----------------------------------------------------------
    // 6. MAKE SURE RECIPE ACTUALLY CONSUMES INGREDIENTS
    // ----------------------------------------------------------

    if (ingredientConsumption.size === 0) {
      throw new BadRequestException(
        `No ingredient consumption found for menu item ${event.menuItemId}`,
      );
    }

    // ----------------------------------------------------------
    // 7. DEDUCT RESTAURANT STOCK
    //
    // EVERYTHING IS ONE TRANSACTION.
    //
    // If ANY ingredient does not have enough stock:
    //
    // - No stock is deducted
    // - No POS_SALE movement is created
    // - Transaction rolls back
    // - Error is returned
    //
    // This prevents partial inventory deduction.
    // ----------------------------------------------------------

    await this.prisma.$transaction(async (tx) => {
      for (const [ingredientId, quantity] of ingredientConsumption.entries()) {
        // ----------------------------------------------------
        // ATOMIC CHECK + DEDUCTION
        // ----------------------------------------------------

        const updatedStock = await tx.restaurantStock.updateMany({
          where: {
            restaurantId: event.restaurantId,

            ingredientId,

            quantityOnHand: {
              gte: quantity,
            },
          },

          data: {
            quantityOnHand: {
              decrement: quantity,
            },
          },
        });

        // ----------------------------------------------------
        // STOCK DOES NOT EXIST OR IS INSUFFICIENT
        // ----------------------------------------------------

        if (updatedStock.count !== 1) {
          throw new ConflictException(
            `Insufficient restaurant stock for ingredient ${ingredientId}`,
          );
        }

        // ----------------------------------------------------
        // CREATE POS SALE MOVEMENT
        // ----------------------------------------------------

        await tx.stockMovement.create({
          data: {
            locationType: 'RESTAURANT',

            locationId: event.restaurantId,

            ingredientId,

            movementType: 'POS_SALE',

            quantityChange: quantity.negated(),

            referenceId: event.orderItemId,
          },
        });
      }
    });

    console.log(
      `Inventory consumption completed for order item ${event.orderItemId}`,
    );
  }

  // ============================================================
  // MENU ITEM CONSUMPTION
  // ============================================================

  private addMenuItemConsumption(
    event: OrderCompleteEvent,
    recipeMap: Map<string, CatalogMenuItemRecipe>,
    ingredientConsumption: Map<string, Prisma.Decimal>,
  ): void {
    const recipe = recipeMap.get(event.menuItemId);

    if (!recipe) {
      throw new NotFoundException(
        `Recipe not found for menu item ${event.menuItemId}`,
      );
    }

    const orderQuantity = new Prisma.Decimal(event.quantity);

    for (const ingredient of recipe.ingredients) {
      const recipeQuantity = new Prisma.Decimal(ingredient.quantityNeeded);

      const consumedQuantity = recipeQuantity.mul(orderQuantity);

      this.addIngredientQuantity(
        ingredientConsumption,
        ingredient.ingredientId,
        consumedQuantity,
      );
    }
  }

  // ============================================================
  // MODIFIER CONSUMPTION
  // ============================================================

  private addModifierConsumption(
    event: OrderCompleteEvent,
    recipeMap: Map<string, CatalogModifierRecipe>,
    ingredientConsumption: Map<string, Prisma.Decimal>,
  ): void {
    for (const modifier of event.modifiers ?? []) {
      const recipe = recipeMap.get(modifier.modifierId);

      if (!recipe) {
        throw new NotFoundException(
          `Recipe not found for modifier ${modifier.modifierId}`,
        );
      }

      const modifierQuantity = new Prisma.Decimal(modifier.quantity);

      if (modifierQuantity.lte(0)) {
        throw new BadRequestException(
          `Modifier quantity must be greater than zero for ${modifier.modifierId}`,
        );
      }

      for (const ingredient of recipe.ingredients) {
        const recipeQuantity = new Prisma.Decimal(ingredient.quantityNeeded);

        const consumedQuantity = recipeQuantity.mul(modifierQuantity);

        this.addIngredientQuantity(
          ingredientConsumption,
          ingredient.ingredientId,
          consumedQuantity,
        );
      }
    }
  }

  // ============================================================
  // AGGREGATE INGREDIENT QUANTITY
  // ============================================================

  private addIngredientQuantity(
    ingredientConsumption: Map<string, Prisma.Decimal>,
    ingredientId: string,
    quantity: Prisma.Decimal,
  ): void {
    const existing = ingredientConsumption.get(ingredientId);

    if (existing) {
      ingredientConsumption.set(ingredientId, existing.add(quantity));
    } else {
      ingredientConsumption.set(ingredientId, quantity);
    }
  }
}
