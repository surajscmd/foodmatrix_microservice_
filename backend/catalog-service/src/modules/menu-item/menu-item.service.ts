/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateMenuItemDto } from './dto/create-menu-item.dto.js';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';

@Injectable()
export class MenuItemService {
  constructor(private readonly prisma: PrismaService) {}

  // CREATE
  async create(createDto: CreateMenuItemDto) {
    const category = await this.prisma.menuCategory.findUnique({
      where: {
        id: createDto.categoryId,
      },
    });

    if (!category) {
      throw new NotFoundException('Menu category not found');
    }

    if (!category.isActive) {
      throw new ConflictException(
        'Cannot create menu item under an inactive category',
      );
    }

    const existingItem = await this.prisma.menuItem.findUnique({
      where: {
        sku: createDto.sku,
      },
    });

    if (existingItem) {
      throw new ConflictException('Menu item with this SKU already exists');
    }

    return this.prisma.menuItem.create({
      data: {
        categoryId: createDto.categoryId,
        name: createDto.name,
        sku: createDto.sku,
        description: createDto.description,
        basePrice: createDto.basePrice,
        isAvailable: createDto.isAvailable ?? true,
      },
      include: {
        category: true,
      },
    });
  }

  // GET ALL
  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [menuItems, total] = await Promise.all([
      this.prisma.menuItem.findMany({
        skip,
        take: limit,

        include: {
          category: true,

          _count: {
            select: {
              restaurantMenus: true,
              recipe: true,
              modifierGroups: true,
            },
          },

          // NEW: Get restaurants where the item is explicitly unavailable.
          restaurantMenus: {
            where: {
              isAvailable: false,
            },
            select: {
              restaurantId: true,
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.menuItem.count(),
    ]);

    const data = menuItems.map((item) => ({
      id: item.id,
      categoryId: item.categoryId,
      name: item.name,
      sku: item.sku,
      description: item.description,
      basePrice: Number(item.basePrice),
      isAvailable: item.isAvailable,

      category: item.category,

      // Counts all stored restaurant configuration records.
      configuredRestaurantCount: item._count.restaurantMenus,

      // NEW: Contains only explicitly unavailable restaurant IDs.
      unavailableRestaurantIds: item.restaurantMenus.map(
        (restaurantMenu) => restaurantMenu.restaurantId,
      ),

      recipeIngredientCount: item._count.recipe,
      modifierGroupCount: item._count.modifierGroups,

      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================================
  // GET MENU ITEM PRICES ACROSS ALL RESTAURANTS
  // GET /menu-items/:menuItemId/restaurants
  //
  // Returns the master menu item and all restaurant-specific
  // price / availability configurations.
  //
  // restaurantId is a soft reference because Restaurant belongs
  // to Organization Service.
  // ============================================================

  async findRestaurantPrices(menuItemId: string) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: {
        id: menuItemId,
      },
      include: {
        category: true,
        restaurantMenus: {
          orderBy: {
            updatedAt: 'desc',
          },
        },
      },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    return {
      menuItem: {
        id: menuItem.id,
        name: menuItem.name,
        sku: menuItem.sku,
        description: menuItem.description,
        basePrice: Number(menuItem.basePrice),
        isAvailable: menuItem.isAvailable,
        category: {
          id: menuItem.category.id,
          name: menuItem.category.name,
          sortOrder: menuItem.category.sortOrder,
        },
      },

      restaurants: menuItem.restaurantMenus.map((restaurantMenu) => ({
        restaurantMenuItemId: restaurantMenu.id,
        restaurantId: restaurantMenu.restaurantId,
        price: Number(restaurantMenu.price),
        priceDifference:
          Number(restaurantMenu.price) - Number(menuItem.basePrice),
        isAvailable: restaurantMenu.isAvailable,
        updatedAt: restaurantMenu.updatedAt,
      })),
    };
  }
  // GET ONE
  async findOne(id: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: {
        id,
      },
      include: {
        category: true,
        modifierGroups: {
          include: {
            group: true,
          },
        },
        recipe: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    return item;
  }
  // GET MENU ITEMS BY CATEGORY

  async findByCategory(categoryId: string) {
    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        categoryId,
      },

      include: {
        category: true,

        _count: {
          select: {
            restaurantMenus: true,
            recipe: true,
            modifierGroups: true,
          },
        },

        // Get restaurants where the item is explicitly unavailable.
        restaurantMenus: {
          where: {
            isAvailable: false,
          },
          select: {
            restaurantId: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    const data = menuItems.map((item) => ({
      id: item.id,
      categoryId: item.categoryId,
      name: item.name,
      sku: item.sku,
      description: item.description,
      basePrice: Number(item.basePrice),
      isAvailable: item.isAvailable,

      category: item.category,

      // Total stored restaurant configuration records.
      configuredRestaurantCount: item._count.restaurantMenus,

      // Explicit restaurant-level availability overrides.
      unavailableRestaurantIds: item.restaurantMenus.map(
        (restaurantMenu) => restaurantMenu.restaurantId,
      ),

      recipeIngredientCount: item._count.recipe,
      modifierGroupCount: item._count.modifierGroups,

      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return {
      data,
    };
  }

  // UPDATE
  async update(id: string, updateDto: UpdateMenuItemDto) {
    await this.findOne(id);

    if (updateDto.categoryId) {
      const category = await this.prisma.menuCategory.findUnique({
        where: {
          id: updateDto.categoryId,
        },
      });

      if (!category) {
        throw new NotFoundException('Menu category not found');
      }

      if (!category.isActive) {
        throw new ConflictException(
          'Cannot assign menu item to an inactive category',
        );
      }
    }

    if (updateDto.sku) {
      const existingItem = await this.prisma.menuItem.findFirst({
        where: {
          sku: updateDto.sku,
          NOT: {
            id,
          },
        },
      });

      if (existingItem) {
        throw new ConflictException('Menu item with this SKU already exists');
      }
    }

    return this.prisma.menuItem.update({
      where: {
        id,
      },
      data: updateDto,
      include: {
        category: true,
      },
    });
  }

  // SOFT DELETE
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.menuItem.update({
      where: {
        id,
      },
      data: {
        isAvailable: false,
      },
    });
  }
}
