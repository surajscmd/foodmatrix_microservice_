/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CreateRecipeItemDto } from './dto/create-recipe-item.dto';
import { CreateBulkRecipeItemDto } from './dto/create-bulk-recipe-item.dto';
import { UpdateRecipeItemDto } from './dto/update-recipe-item.dto';
import { PrismaService } from '../../lib/prisma/prisma.service';

type RecipeItemWithRelations = Prisma.RecipeItemGetPayload<{
  include: {
    ingredient: true;
    menuItem: true;
    modifier: true;
  };
}>;

@Injectable()
export class RecipeItemService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // CREATE SINGLE
  // ============================================================

  async create(
    createDto: CreateRecipeItemDto,
  ): Promise<RecipeItemWithRelations> {
    this.validateOwner(createDto.menuItemId, createDto.modifierId);

    await this.validateIngredient(createDto.ingredientId);

    if (createDto.menuItemId) {
      await this.validateMenuItem(createDto.menuItemId);

      const existing = await this.prisma.recipeItem.findUnique({
        where: {
          menuItemId_ingredientId: {
            menuItemId: createDto.menuItemId,
            ingredientId: createDto.ingredientId,
          },
        },
      });

      if (existing) {
        throw new ConflictException(
          'Ingredient already exists in this menu item recipe',
        );
      }
    }

    if (createDto.modifierId) {
      await this.validateModifier(createDto.modifierId);

      const existing = await this.prisma.recipeItem.findUnique({
        where: {
          modifierId_ingredientId: {
            modifierId: createDto.modifierId,
            ingredientId: createDto.ingredientId,
          },
        },
      });

      if (existing) {
        throw new ConflictException(
          'Ingredient already exists in this modifier recipe',
        );
      }
    }

    return this.prisma.recipeItem.create({
      data: {
        menuItemId: createDto.menuItemId,
        modifierId: createDto.modifierId,
        ingredientId: createDto.ingredientId,
        quantityNeeded: createDto.quantityNeeded,
      },
      include: {
        ingredient: true,
        menuItem: true,
        modifier: true,
      },
    });
  }

  // ============================================================
  // CREATE BULK MENU ITEM RECIPE
  // ============================================================

  async createBulk(
    createDto: CreateBulkRecipeItemDto,
  ): Promise<RecipeItemWithRelations[]> {
    await this.validateMenuItem(createDto.menuItemId);

    const ingredientIds = createDto.recipes.map(
      (recipe) => recipe.ingredientId,
    );

    // Prevent duplicate ingredients inside request
    const uniqueIngredientIds = new Set(ingredientIds);

    if (uniqueIngredientIds.size !== ingredientIds.length) {
      throw new ConflictException(
        'Duplicate ingredients are not allowed in the same recipe',
      );
    }

    // Get all ingredients in one query
    const ingredients = await this.prisma.ingredient.findMany({
      where: {
        id: {
          in: ingredientIds,
        },
      },
    });

    // Check missing ingredients
    if (ingredients.length !== uniqueIngredientIds.size) {
      const foundIds = new Set(ingredients.map((ingredient) => ingredient.id));

      const missingIds = ingredientIds.filter((id) => !foundIds.has(id));

      throw new NotFoundException(
        `Ingredient(s) not found: ${missingIds.join(', ')}`,
      );
    }

    // Check inactive ingredients
    const inactiveIngredient = ingredients.find(
      (ingredient) => !ingredient.isActive,
    );

    if (inactiveIngredient) {
      throw new BadRequestException(
        `Ingredient "${inactiveIngredient.name}" is inactive`,
      );
    }

    // Check if any already exists
    const existing = await this.prisma.recipeItem.findMany({
      where: {
        menuItemId: createDto.menuItemId,
        ingredientId: {
          in: ingredientIds,
        },
      },
      select: {
        ingredientId: true,
      },
    });

    if (existing.length > 0) {
      const existingIds = existing.map((item) => item.ingredientId);

      throw new ConflictException(
        `Ingredient(s) already exist in recipe: ${existingIds.join(', ')}`,
      );
    }

    // Atomic transaction
    return this.prisma.$transaction(async (tx) => {
      const createdItems: RecipeItemWithRelations[] = [];

      for (const recipe of createDto.recipes) {
        const created = await tx.recipeItem.create({
          data: {
            menuItemId: createDto.menuItemId,
            ingredientId: recipe.ingredientId,
            quantityNeeded: recipe.quantityNeeded,
          },
          include: {
            ingredient: true,
            menuItem: true,
            modifier: true,
          },
        });

        createdItems.push(created);
      }

      return createdItems;
    });
  }

  // ============================================================
  // FIND ALL
  // ============================================================

  async findAll(
    menuItemId?: string,
    modifierId?: string,
  ): Promise<RecipeItemWithRelations[]> {
    if (menuItemId && modifierId) {
      throw new BadRequestException(
        'Provide either menuItemId or modifierId, not both',
      );
    }

    return this.prisma.recipeItem.findMany({
      where: {
        ...(menuItemId && {
          menuItemId,
        }),

        ...(modifierId && {
          modifierId,
        }),
      },
      include: {
        ingredient: true,
        menuItem: true,
        modifier: true,
      },
      orderBy: {
        ingredient: {
          name: 'asc',
        },
      },
    });
  }

  // ============================================================
  // FIND ONE
  // ============================================================

  async findOne(id: string): Promise<RecipeItemWithRelations> {
    const recipeItem = await this.prisma.recipeItem.findUnique({
      where: {
        id,
      },
      include: {
        ingredient: true,
        menuItem: true,
        modifier: true,
      },
    });

    if (!recipeItem) {
      throw new NotFoundException('Recipe item not found');
    }

    return recipeItem;
  }

  // ============================================================
  // UPDATE
  // ============================================================

  async update(
    id: string,
    updateDto: UpdateRecipeItemDto,
  ): Promise<RecipeItemWithRelations> {
    const existing = await this.findOne(id);

    const ingredientId = updateDto.ingredientId ?? existing.ingredientId;

    if (
      updateDto.ingredientId &&
      updateDto.ingredientId !== existing.ingredientId
    ) {
      await this.validateIngredient(updateDto.ingredientId);

      if (existing.menuItemId) {
        const duplicate = await this.prisma.recipeItem.findUnique({
          where: {
            menuItemId_ingredientId: {
              menuItemId: existing.menuItemId,
              ingredientId,
            },
          },
        });

        if (duplicate && duplicate.id !== id) {
          throw new ConflictException(
            'Ingredient already exists in this menu item recipe',
          );
        }
      }

      if (existing.modifierId) {
        const duplicate = await this.prisma.recipeItem.findUnique({
          where: {
            modifierId_ingredientId: {
              modifierId: existing.modifierId,
              ingredientId,
            },
          },
        });

        if (duplicate && duplicate.id !== id) {
          throw new ConflictException(
            'Ingredient already exists in this modifier recipe',
          );
        }
      }
    }

    return this.prisma.recipeItem.update({
      where: {
        id,
      },
      data: {
        ...(updateDto.ingredientId && {
          ingredientId: updateDto.ingredientId,
        }),

        ...(updateDto.quantityNeeded !== undefined && {
          quantityNeeded: updateDto.quantityNeeded,
        }),
      },
      include: {
        ingredient: true,
        menuItem: true,
        modifier: true,
      },
    });
  }

  // ============================================================
  // DELETE
  // ============================================================

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    await this.prisma.recipeItem.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Recipe item deleted successfully.',
    };
  }

  // ============================================================
  // VALIDATIONS
  // ============================================================

  private validateOwner(menuItemId?: string, modifierId?: string): void {
    const hasMenuItem = Boolean(menuItemId);

    const hasModifier = Boolean(modifierId);

    if (hasMenuItem === hasModifier) {
      throw new BadRequestException(
        'Recipe item must belong to either a menu item or a modifier, not both',
      );
    }
  }

  private async validateMenuItem(menuItemId: string): Promise<void> {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: {
        id: menuItemId,
      },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }
  }

  private async validateModifier(modifierId: string): Promise<void> {
    const modifier = await this.prisma.modifier.findUnique({
      where: {
        id: modifierId,
      },
    });

    if (!modifier) {
      throw new NotFoundException('Modifier not found');
    }

    if (!modifier.isActive) {
      throw new BadRequestException('Cannot use an inactive modifier');
    }
  }

  private async validateIngredient(ingredientId: string): Promise<void> {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: {
        id: ingredientId,
      },
    });

    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }

    if (!ingredient.isActive) {
      throw new BadRequestException('Cannot use an inactive ingredient');
    }
  }
}
