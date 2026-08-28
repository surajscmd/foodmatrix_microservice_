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

  // ============================================================
  // CREATE BULK RECIPE
  // Supports either MenuItem OR Modifier
  // ============================================================

  async createBulk(
    createDto: CreateBulkRecipeItemDto,
  ): Promise<RecipeItemWithRelations[]> {
    this.validateOwner(createDto.menuItemId, createDto.modifierId);

    // Validate owner
    if (createDto.menuItemId) {
      await this.validateMenuItem(createDto.menuItemId);
    }

    if (createDto.modifierId) {
      await this.validateModifier(createDto.modifierId);
    }

    // Get ingredient IDs from request
    const ingredientIds = createDto.recipes.map(
      (recipe) => recipe.ingredientId,
    );

    // Prevent duplicate ingredients in same request
    const uniqueIngredientIds = new Set(ingredientIds);

    if (uniqueIngredientIds.size !== ingredientIds.length) {
      throw new ConflictException(
        'Duplicate ingredients are not allowed in the same recipe',
      );
    }

    // Fetch all ingredients in one query
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

    // Check existing recipes
    type ExistingRecipe = {
      ingredientId: string;
    };

    let existingRecipes: ExistingRecipe[] = [];

    if (createDto.menuItemId) {
      existingRecipes = await this.prisma.recipeItem.findMany({
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
    } else if (createDto.modifierId) {
      existingRecipes = await this.prisma.recipeItem.findMany({
        where: {
          modifierId: createDto.modifierId,
          ingredientId: {
            in: ingredientIds,
          },
        },
        select: {
          ingredientId: true,
        },
      });
    }

    if (existingRecipes.length > 0) {
      const existingIds = existingRecipes.map((recipe) => recipe.ingredientId);

      throw new ConflictException(
        `Ingredient(s) already exist in recipe: ${existingIds.join(', ')}`,
      );
    }

    // Create all recipe items atomically
    return this.prisma.$transaction(async (tx) => {
      const createdItems: RecipeItemWithRelations[] = [];

      for (const recipe of createDto.recipes) {
        const created = await tx.recipeItem.create({
          data: {
            ...(createDto.menuItemId && {
              menuItemId: createDto.menuItemId,
            }),

            ...(createDto.modifierId && {
              modifierId: createDto.modifierId,
            }),

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
  // GET ALL MENU ITEMS WITH INGREDIENTS
  // ============================================================

  async findAllMenuItems(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [menuItems, total] = await Promise.all([
      this.prisma.menuItem.findMany({
        where: {
          recipe: {
            some: {},
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          sku: true,
          recipe: {
            orderBy: {
              ingredient: {
                name: 'asc',
              },
            },
            select: {
              id: true,
              ingredient: {
                select: {
                  id: true,
                  name: true,
                  uom: true,
                  isActive: true,
                },
              },
              quantityNeeded: true,
            },
          },
        },
      }),

      this.prisma.menuItem.count({
        where: {
          recipe: {
            some: {},
          },
        },
      }),
    ]);

    return {
      data: menuItems.map((item) => ({
        menuItem: {
          id: item.id,
          name: item.name,
          sku: item.sku,
        },
        ingredients: item.recipe.map((recipeItem) => ({
          recipeItemId: recipeItem.id,
          ingredientId: recipeItem.ingredient.id,
          name: recipeItem.ingredient.name,
          uom: recipeItem.ingredient.uom,
          isActive: recipeItem.ingredient.isActive,
          quantityNeeded: Number(recipeItem.quantityNeeded),
        })),
      })),

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================================
  // GET ALL MODIFIERS WITH INGREDIENTS
  // ============================================================

  async findAllModifiers(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [modifiers, total] = await Promise.all([
      this.prisma.modifier.findMany({
        where: {
          recipe: {
            some: {},
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          groupId: true,
          recipe: {
            orderBy: {
              ingredient: {
                name: 'asc',
              },
            },
            select: {
              id: true,
              ingredient: {
                select: {
                  id: true,
                  name: true,
                  uom: true,
                  isActive: true,
                },
              },
              quantityNeeded: true,
            },
          },
        },
      }),

      this.prisma.modifier.count({
        where: {
          recipe: {
            some: {},
          },
        },
      }),
    ]);

    return {
      data: modifiers.map((modifier) => ({
        modifier: {
          id: modifier.id,
          name: modifier.name,
          groupId: modifier.groupId,
        },
        ingredients: modifier.recipe.map((recipeItem) => ({
          recipeItemId: recipeItem.id,
          ingredientId: recipeItem.ingredient.id,
          name: recipeItem.ingredient.name,
          uom: recipeItem.ingredient.uom,
          isActive: recipeItem.ingredient.isActive,
          quantityNeeded: Number(recipeItem.quantityNeeded),
        })),
      })),

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================================
  // GET RECIPES FOR ONE MENU ITEM OR MODIFIER
  // ============================================================

  async findRecipes(menuItemId?: string, modifierId?: string) {
    if (menuItemId && modifierId) {
      throw new BadRequestException(
        'Provide either menuItemId or modifierId, not both',
      );
    }

    if (!menuItemId && !modifierId) {
      throw new BadRequestException('Provide either menuItemId or modifierId');
    }

    if (menuItemId) {
      const menuItem = await this.prisma.menuItem.findUnique({
        where: {
          id: menuItemId,
        },
        select: {
          id: true,
          name: true,
          sku: true,
        },
      });

      if (!menuItem) {
        throw new NotFoundException('Menu item not found');
      }

      const recipes = await this.prisma.recipeItem.findMany({
        where: {
          menuItemId,
        },
        select: {
          id: true,
          quantityNeeded: true,
          ingredient: {
            select: {
              id: true,
              name: true,
              uom: true,
              isActive: true,
            },
          },
        },
        orderBy: {
          ingredient: {
            name: 'asc',
          },
        },
      });

      return {
        menuItem,
        data: recipes.map((recipe) => ({
          recipeItemId: recipe.id,
          ingredientId: recipe.ingredient.id,
          name: recipe.ingredient.name,
          uom: recipe.ingredient.uom,
          isActive: recipe.ingredient.isActive,
          quantityNeeded: Number(recipe.quantityNeeded),
        })),
      };
    }

    const modifier = await this.prisma.modifier.findUnique({
      where: {
        id: modifierId,
      },
      select: {
        id: true,
        name: true,
        groupId: true,
      },
    });

    if (!modifier) {
      throw new NotFoundException('Modifier not found');
    }

    const recipes = await this.prisma.recipeItem.findMany({
      where: {
        modifierId,
      },
      select: {
        id: true,
        quantityNeeded: true,
        ingredient: {
          select: {
            id: true,
            name: true,
            uom: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        ingredient: {
          name: 'asc',
        },
      },
    });

    return {
      modifier,
      data: recipes.map((recipe) => ({
        recipeItemId: recipe.id,
        ingredientId: recipe.ingredient.id,
        name: recipe.ingredient.name,
        uom: recipe.ingredient.uom,
        isActive: recipe.ingredient.isActive,
        quantityNeeded: Number(recipe.quantityNeeded),
      })),
    };
  }

  // ============================================================
  // FIND ONE
  // ============================================================

  async findOne(id: string) {
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

    return {
      recipeItem: {
        id: recipeItem.id,
        quantityNeeded: Number(recipeItem.quantityNeeded),
      },

      ...(recipeItem.menuItem
        ? {
            menuItem: {
              id: recipeItem.menuItem.id,
              name: recipeItem.menuItem.name,
              sku: recipeItem.menuItem.sku,
            },
          }
        : {}),

      ...(recipeItem.modifier
        ? {
            modifier: {
              id: recipeItem.modifier.id,
              name: recipeItem.modifier.name,
              groupId: recipeItem.modifier.groupId,
            },
          }
        : {}),

      ingredient: {
        id: recipeItem.ingredient.id,
        name: recipeItem.ingredient.name,
        uom: recipeItem.ingredient.uom,
        isActive: recipeItem.ingredient.isActive,
      },
    };
  }

  // ============================================================
  // UPDATE
  // ============================================================
  async update(
    id: string,
    updateDto: UpdateRecipeItemDto,
  ): Promise<RecipeItemWithRelations> {
    const existing = await this.prisma.recipeItem.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Recipe item not found');
    }

    if (
      updateDto.ingredientId !== undefined &&
      updateDto.ingredientId !== existing.ingredientId
    ) {
      await this.validateIngredient(updateDto.ingredientId);

      if (existing.menuItemId) {
        const duplicate = await this.prisma.recipeItem.findUnique({
          where: {
            menuItemId_ingredientId: {
              menuItemId: existing.menuItemId,
              ingredientId: updateDto.ingredientId,
            },
          },
        });

        if (duplicate) {
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
              ingredientId: updateDto.ingredientId,
            },
          },
        });

        if (duplicate) {
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
        ...(updateDto.ingredientId !== undefined && {
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
    const existing = await this.prisma.recipeItem.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Recipe item not found');
    }

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
