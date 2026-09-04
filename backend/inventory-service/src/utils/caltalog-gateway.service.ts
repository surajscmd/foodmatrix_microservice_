import {
  BadGatewayException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

// ============================================================
// MENU ITEM PRICING
// ============================================================

export interface CatalogMenuItem {
  menuItemId: string;
  name: string;
  sku: string;
  price: number;
  isAvailable: boolean;
}

// ============================================================
// MODIFIER PRICING
// ============================================================

export interface CatalogModifier {
  id: string;
  name: string;
  extraPrice: number;
  isActive: boolean;
}

// ============================================================
// BULK PRICING RESPONSE
// ============================================================

export interface BulkCatalogResponse {
  menuItems: CatalogMenuItem[];
  modifiers: CatalogModifier[];
}

// ============================================================
// RECIPE INGREDIENT
// ============================================================

export interface CatalogRecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  uom: string;
  quantityNeeded: number;
}

// ============================================================
// MENU ITEM RECIPE
// ============================================================

export interface CatalogMenuItemRecipe {
  menuItemId: string;
  ingredients: CatalogRecipeIngredient[];
}

// ============================================================
// MODIFIER RECIPE
// ============================================================

export interface CatalogModifierRecipe {
  modifierId: string;
  ingredients: CatalogRecipeIngredient[];
}

// ============================================================
// BULK RECIPE RESPONSE
// ============================================================

export interface BulkCatalogRecipeResponse {
  menuItems: CatalogMenuItemRecipe[];
  modifiers: CatalogModifierRecipe[];
}

// ============================================================
// INGREDIENT
// ============================================================

export interface CatalogIngredient {
  id: string;
  name: string;
  uom: string;
  isActive: boolean;
}

@Injectable()
export class CatalogGatewayService {
  private readonly baseUrl =
    process.env.CATALOG_SERVICE_URL ?? 'http://localhost:3004';

  private readonly internalApiKey = process.env.INTERNAL_API_KEY ?? '';

  // ============================================================
  // BULK PRICING
  // ============================================================

  async getBulkPricing(
    restaurantId: string,
    menuItemIds: string[],
    modifierIds: string[],
  ): Promise<BulkCatalogResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/internal/catalog/bulk-pricing`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            'x-internal-key': this.internalApiKey,
          },

          body: JSON.stringify({
            restaurantId,
            menuItemIds,
            modifierIds,
          }),
        },
      );

      if (response.status === 401 || response.status === 403) {
        throw new UnauthorizedException(
          'Inventory Service is not authorized to access Catalog Service.',
        );
      }

      if (response.status === 404) {
        throw new NotFoundException('Catalog item was not found.');
      }

      if (!response.ok) {
        throw new BadGatewayException('Catalog Service returned an error.');
      }

      return (await response.json()) as BulkCatalogResponse;
    } catch (error: unknown) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException ||
        error instanceof BadGatewayException
      ) {
        throw error;
      }

      console.error('Catalog Service connection failed:', error);

      throw new BadGatewayException('Unable to connect to Catalog Service.');
    }
  }

  // ============================================================
  // BULK RECIPES
  //
  // Inventory uses this endpoint to calculate ingredient
  // consumption for menu items and modifiers.
  // ============================================================

  async getBulkRecipes(
    menuItemIds: string[],
    modifierIds: string[],
  ): Promise<BulkCatalogRecipeResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/internal/catalog/bulk-recipes`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            'x-internal-key': this.internalApiKey,
          },

          body: JSON.stringify({
            menuItemIds,
            modifierIds,
          }),
        },
      );

      if (response.status === 401 || response.status === 403) {
        throw new UnauthorizedException(
          'Inventory Service is not authorized to access Catalog Service.',
        );
      }

      if (response.status === 404) {
        throw new NotFoundException('Catalog recipe was not found.');
      }

      if (!response.ok) {
        throw new BadGatewayException('Catalog Service returned an error.');
      }

      return (await response.json()) as BulkCatalogRecipeResponse;
    } catch (error: unknown) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException ||
        error instanceof BadGatewayException
      ) {
        throw error;
      }

      console.error('Catalog Service connection failed:', error);

      throw new BadGatewayException('Unable to connect to Catalog Service.');
    }
  }

  // ============================================================
  // BULK INGREDIENTS
  // ============================================================

  async getBulkIngredients(
    ingredientIds: string[],
  ): Promise<CatalogIngredient[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/internal/catalog/bulk-ingredients`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            'x-internal-key': this.internalApiKey,
          },

          body: JSON.stringify({
            ingredientIds,
          }),
        },
      );

      if (response.status === 401 || response.status === 403) {
        throw new UnauthorizedException(
          'Inventory Service is not authorized to access Catalog Service.',
        );
      }

      if (response.status === 404) {
        throw new NotFoundException('Ingredient was not found.');
      }

      if (!response.ok) {
        throw new BadGatewayException('Catalog Service returned an error.');
      }

      return (await response.json()) as CatalogIngredient[];
    } catch (error: unknown) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException ||
        error instanceof BadGatewayException
      ) {
        throw error;
      }

      console.error('Catalog Service connection failed:', error);

      throw new BadGatewayException('Unable to connect to Catalog Service.');
    }
  }
}
