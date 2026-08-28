import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import {
  Prisma,
  type Ingredient,
  type MenuItem,
  type Modifier,
  type RecipeItem,
} from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service';
import { RecipeItemService } from './recipe-item.service';

import { CreateRecipeItemDto } from './dto/create-recipe-item.dto';

/*
 * ============================================================
 * TEST TYPES
 * ============================================================
 */

type RecipeItemWithRelations = RecipeItem & {
  ingredient: Ingredient;
  menuItem: MenuItem | null;
  modifier: Modifier | null;
};

type RecipeItemWithIngredient = {
  id: string;
  quantityNeeded: Prisma.Decimal;
  ingredient: Ingredient;
};

type MenuItemWithRecipe = {
  id: string;
  name: string;
  sku: string;
  recipe: RecipeItemWithIngredient[];
};

type ModifierWithRecipe = {
  id: string;
  name: string;
  groupId: string;
  recipe: RecipeItemWithIngredient[];
};

type ExistingRecipe = {
  ingredientId: string;
};

/*
 * ============================================================
 * JEST MOCK TYPES
 *
 * We deliberately type the mocks according to what the tests
 * need instead of forcing Prisma's default return type onto
 * relation queries.
 * ============================================================
 */

describe('RecipeItemService', () => {
  let service: RecipeItemService;

  const recipeItemFindUnique = jest.fn<
    Promise<RecipeItem | RecipeItemWithRelations | null>,
    [unknown]
  >();

  const recipeItemFindMany = jest.fn<
    Promise<RecipeItem[] | RecipeItemWithIngredient[] | ExistingRecipe[]>,
    [unknown]
  >();

  const recipeItemCreate = jest.fn<
    Promise<RecipeItemWithRelations>,
    [unknown]
  >();

  const recipeItemUpdate = jest.fn<
    Promise<RecipeItemWithRelations>,
    [unknown]
  >();

  const recipeItemDelete = jest.fn<Promise<RecipeItem>, [unknown]>();

  const ingredientFindUnique = jest.fn<Promise<Ingredient | null>, [unknown]>();

  const ingredientFindMany = jest.fn<Promise<Ingredient[]>, [unknown]>();

  const menuItemFindUnique = jest.fn<Promise<MenuItem | null>, [unknown]>();

  const menuItemFindMany = jest.fn<Promise<MenuItemWithRecipe[]>, [unknown]>();

  const menuItemCount = jest.fn<Promise<number>, [unknown]>();

  const modifierFindUnique = jest.fn<Promise<Modifier | null>, [unknown]>();

  const modifierFindMany = jest.fn<Promise<ModifierWithRecipe[]>, [unknown]>();

  const modifierCount = jest.fn<Promise<number>, [unknown]>();

  const transaction = jest.fn();

  const prismaMock = {
    ingredient: {
      findUnique: ingredientFindUnique,
      findMany: ingredientFindMany,
    },

    menuItem: {
      findUnique: menuItemFindUnique,
      findMany: menuItemFindMany,
      count: menuItemCount,
    },

    modifier: {
      findUnique: modifierFindUnique,
      findMany: modifierFindMany,
      count: modifierCount,
    },

    recipeItem: {
      findUnique: recipeItemFindUnique,
      findMany: recipeItemFindMany,
      create: recipeItemCreate,
      update: recipeItemUpdate,
      delete: recipeItemDelete,
    },

    $transaction: transaction,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new RecipeItemService(prismaMock as unknown as PrismaService);
  });

  /*
   * ============================================================
   * TEST DATA
   * ============================================================
   */

  const ingredient: Ingredient = {
    id: 'ingredient-1',
    name: 'Rice',
    uom: 'kg',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // const secondIngredient: Ingredient = {
  //   id: 'ingredient-2',
  //   name: 'Urad Dal',
  //   uom: 'kg',
  //   isActive: true,
  //   createdAt: new Date(),
  //   updatedAt: new Date(),
  // };

  const inactiveIngredient: Ingredient = {
    ...ingredient,
    isActive: false,
  };

  const menuItem: MenuItem = {
    id: 'menu-item-1',
    categoryId: 'category-1',
    name: 'Masala Dosa',
    sku: 'DOS-MAS-001',
    description: 'Masala dosa',
    basePrice: new Prisma.Decimal('129.00'),
    isAvailable: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const modifier: Modifier = {
    id: 'modifier-1',
    groupId: 'group-1',
    name: 'Extra Butter',
    sortOrder: 1,
    extraPrice: new Prisma.Decimal('20.00'),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const recipeItem: RecipeItemWithRelations = {
    id: 'recipe-1',
    menuItemId: 'menu-item-1',
    modifierId: null,
    ingredientId: 'ingredient-1',
    quantityNeeded: new Prisma.Decimal('0.15'),
    ingredient,
    menuItem,
    modifier: null,
  };

  const modifierRecipeItem: RecipeItemWithRelations = {
    id: 'recipe-2',
    menuItemId: null,
    modifierId: 'modifier-1',
    ingredientId: 'ingredient-1',
    quantityNeeded: new Prisma.Decimal('0.02'),
    ingredient,
    menuItem: null,
    modifier,
  };

  const rawMenuRecipeItem: RecipeItem = {
    id: 'recipe-1',
    menuItemId: 'menu-item-1',
    modifierId: null,
    ingredientId: 'ingredient-1',
    quantityNeeded: new Prisma.Decimal('0.15'),
  };

  const rawModifierRecipeItem: RecipeItem = {
    id: 'recipe-2',
    menuItemId: null,
    modifierId: 'modifier-1',
    ingredientId: 'ingredient-1',
    quantityNeeded: new Prisma.Decimal('0.02'),
  };

  /*
   * ============================================================
   * CREATE
   * ============================================================
   */

  describe('create', () => {
    it('should create recipe for menu item', async () => {
      const dto: CreateRecipeItemDto = {
        menuItemId: 'menu-item-1',
        ingredientId: 'ingredient-1',
        quantityNeeded: 0.15,
      };

      ingredientFindUnique.mockResolvedValue(ingredient);
      menuItemFindUnique.mockResolvedValue(menuItem);
      recipeItemFindUnique.mockResolvedValue(null);
      recipeItemCreate.mockResolvedValue(recipeItem);

      const result = await service.create(dto);

      expect(recipeItemCreate).toHaveBeenCalled();

      expect(result).toEqual(recipeItem);
    });

    it('should create recipe for modifier', async () => {
      const dto: CreateRecipeItemDto = {
        modifierId: 'modifier-1',
        ingredientId: 'ingredient-1',
        quantityNeeded: 0.02,
      };

      ingredientFindUnique.mockResolvedValue(ingredient);
      modifierFindUnique.mockResolvedValue(modifier);
      recipeItemFindUnique.mockResolvedValue(null);
      recipeItemCreate.mockResolvedValue(modifierRecipeItem);

      const result = await service.create(dto);

      expect(modifierFindUnique).toHaveBeenCalledWith({
        where: {
          id: 'modifier-1',
        },
      });

      expect(result).toEqual(modifierRecipeItem);
    });

    it('should reject both menu item and modifier', async () => {
      const dto: CreateRecipeItemDto = {
        menuItemId: 'menu-item-1',
        modifierId: 'modifier-1',
        ingredientId: 'ingredient-1',
        quantityNeeded: 0.15,
      };

      await expect(service.create(dto)).rejects.toThrow(
        new BadRequestException(
          'Recipe item must belong to either a menu item or a modifier, not both',
        ),
      );
    });

    it('should reject when neither owner is provided', async () => {
      const dto: CreateRecipeItemDto = {
        ingredientId: 'ingredient-1',
        quantityNeeded: 0.15,
      };

      await expect(service.create(dto)).rejects.toThrow(
        new BadRequestException(
          'Recipe item must belong to either a menu item or a modifier, not both',
        ),
      );
    });

    it('should reject missing ingredient', async () => {
      ingredientFindUnique.mockResolvedValue(null);

      const dto: CreateRecipeItemDto = {
        menuItemId: 'menu-item-1',
        ingredientId: 'missing',
        quantityNeeded: 0.15,
      };

      await expect(service.create(dto)).rejects.toThrow(
        new NotFoundException('Ingredient not found'),
      );
    });

    it('should reject inactive ingredient', async () => {
      ingredientFindUnique.mockResolvedValue(inactiveIngredient);

      const dto: CreateRecipeItemDto = {
        menuItemId: 'menu-item-1',
        ingredientId: 'ingredient-1',
        quantityNeeded: 0.15,
      };

      await expect(service.create(dto)).rejects.toThrow(
        new BadRequestException('Cannot use an inactive ingredient'),
      );
    });

    it('should reject missing menu item', async () => {
      ingredientFindUnique.mockResolvedValue(ingredient);
      menuItemFindUnique.mockResolvedValue(null);

      const dto: CreateRecipeItemDto = {
        menuItemId: 'missing-menu',
        ingredientId: 'ingredient-1',
        quantityNeeded: 0.15,
      };

      await expect(service.create(dto)).rejects.toThrow(
        new NotFoundException('Menu item not found'),
      );
    });

    it('should reject missing modifier', async () => {
      ingredientFindUnique.mockResolvedValue(ingredient);
      modifierFindUnique.mockResolvedValue(null);

      const dto: CreateRecipeItemDto = {
        modifierId: 'missing-modifier',
        ingredientId: 'ingredient-1',
        quantityNeeded: 0.02,
      };

      await expect(service.create(dto)).rejects.toThrow(
        new NotFoundException('Modifier not found'),
      );
    });

    it('should reject inactive modifier', async () => {
      ingredientFindUnique.mockResolvedValue(ingredient);

      modifierFindUnique.mockResolvedValue({
        ...modifier,
        isActive: false,
      });

      const dto: CreateRecipeItemDto = {
        modifierId: 'modifier-1',
        ingredientId: 'ingredient-1',
        quantityNeeded: 0.02,
      };

      await expect(service.create(dto)).rejects.toThrow(
        new BadRequestException('Cannot use an inactive modifier'),
      );
    });

    it('should reject duplicate menu item recipe', async () => {
      ingredientFindUnique.mockResolvedValue(ingredient);
      menuItemFindUnique.mockResolvedValue(menuItem);
      recipeItemFindUnique.mockResolvedValue(rawMenuRecipeItem);

      const dto: CreateRecipeItemDto = {
        menuItemId: 'menu-item-1',
        ingredientId: 'ingredient-1',
        quantityNeeded: 0.15,
      };

      await expect(service.create(dto)).rejects.toThrow(
        new ConflictException(
          'Ingredient already exists in this menu item recipe',
        ),
      );
    });

    it('should reject duplicate modifier recipe', async () => {
      ingredientFindUnique.mockResolvedValue(ingredient);
      modifierFindUnique.mockResolvedValue(modifier);
      recipeItemFindUnique.mockResolvedValue(rawModifierRecipeItem);

      const dto: CreateRecipeItemDto = {
        modifierId: 'modifier-1',
        ingredientId: 'ingredient-1',
        quantityNeeded: 0.02,
      };

      await expect(service.create(dto)).rejects.toThrow(
        new ConflictException(
          'Ingredient already exists in this modifier recipe',
        ),
      );
    });
  });

  /*
   * ============================================================
   * FIND ONE
   * ============================================================
   */

  describe('findOne', () => {
    it('should return formatted menu item recipe', async () => {
      recipeItemFindUnique.mockResolvedValue(recipeItem);

      const result = await service.findOne('recipe-1');

      expect(result).toEqual({
        recipeItem: {
          id: 'recipe-1',
          quantityNeeded: 0.15,
        },
        menuItem: {
          id: 'menu-item-1',
          name: 'Masala Dosa',
          sku: 'DOS-MAS-001',
        },
        ingredient: {
          id: 'ingredient-1',
          name: 'Rice',
          uom: 'kg',
          isActive: true,
        },
      });
    });

    it('should return formatted modifier recipe', async () => {
      recipeItemFindUnique.mockResolvedValue(modifierRecipeItem);

      const result = await service.findOne('recipe-2');

      expect(result).toEqual({
        recipeItem: {
          id: 'recipe-2',
          quantityNeeded: 0.02,
        },
        modifier: {
          id: 'modifier-1',
          name: 'Extra Butter',
          groupId: 'group-1',
        },
        ingredient: {
          id: 'ingredient-1',
          name: 'Rice',
          uom: 'kg',
          isActive: true,
        },
      });
    });

    it('should throw when recipe does not exist', async () => {
      recipeItemFindUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        new NotFoundException('Recipe item not found'),
      );
    });
  });

  /*
   * ============================================================
   * REMOVE
   * ============================================================
   */

  describe('remove', () => {
    it('should delete recipe item successfully', async () => {
      recipeItemFindUnique.mockResolvedValue(rawMenuRecipeItem);

      recipeItemDelete.mockResolvedValue(rawMenuRecipeItem);

      const result = await service.remove('recipe-1');

      expect(recipeItemFindUnique).toHaveBeenCalledWith({
        where: {
          id: 'recipe-1',
        },
      });

      expect(recipeItemDelete).toHaveBeenCalledWith({
        where: {
          id: 'recipe-1',
        },
      });

      expect(result).toEqual({
        message: 'Recipe item deleted successfully.',
      });
    });

    it('should throw when recipe does not exist', async () => {
      recipeItemFindUnique.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(
        new NotFoundException('Recipe item not found'),
      );
    });
  });
});
