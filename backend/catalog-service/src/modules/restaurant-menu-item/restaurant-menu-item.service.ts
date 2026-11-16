import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { CreateRestaurantMenuItemDto } from './dto/create-restaurant-menu-item.dto';
import type { ListRestaurantMenuItemsDto } from './dto/list-restaurant-menu-items.dto';
import { UpdateRestaurantMenuItemDto } from './dto/update-restaurant-menu-item.dto';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { catalogPageOffset } from '../../common/catalog-pagination';

@Injectable()
export class RestaurantMenuItemService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRestaurantMenuItemDto) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: {
        id: dto.menuItemId,
      },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    const existing = await this.prisma.restaurantMenuItem.findUnique({
      where: {
        restaurantId_menuItemId: {
          restaurantId: dto.restaurantId,
          menuItemId: dto.menuItemId,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'Menu item is already configured for this restaurant',
      );
    }

    return this.prisma.restaurantMenuItem.create({
      data: {
        restaurantId: dto.restaurantId,
        menuItemId: dto.menuItemId,

        // If no restaurant price is supplied,
        // use the global base price.
        price: dto.price ?? menuItem.basePrice,

        // Restaurant controls its own availability.
        isAvailable: dto.isAvailable ?? true,
      },

      include: {
        menuItem: {
          include: {
            category: true,
          },
        },
      },
    });
  }
  // ============================================================
  // GET ALL MENU ITEMS FOR ONE RESTAURANT
  // ============================================================
  // Returns ALL global menu items.
  //
  // Configured restaurant item:
  //     use RestaurantMenuItem.price
  //
  // Not configured:
  //     use MenuItem.basePrice
  //
  // Pagination is applied to global MenuItems.
  // ============================================================

  async findAll(
    restaurantId: string,
    page = 1,
    limit = 10,
    {
      categoryId,
      search,
      availability,
      includeAvailabilityCounts,
    }: Omit<ListRestaurantMenuItemsDto, 'page' | 'limit'> = {},
  ) {
    const skip = catalogPageOffset(page, limit);
    const unavailableHere = { restaurantId, isAvailable: false };
    const term = search?.trim();
    const match = { contains: term, mode: 'insensitive' } as const;
    const baseWhere: Prisma.MenuItemWhereInput = {
      isAvailable: true,
      category: { isActive: true },
      ...(categoryId && { categoryId }),
      ...(term && {
        OR: [{ name: match }, { sku: match }, { category: { name: match } }],
      }),
    };
    const unavailableWhere = {
      ...baseWhere,
      restaurantMenus: { some: unavailableHere },
    };
    const where =
      availability === 'unavailable'
        ? unavailableWhere
        : availability === 'available'
          ? { ...baseWhere, restaurantMenus: { none: unavailableHere } }
          : baseWhere;
    const findItems = this.prisma.menuItem.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        category: true,
        restaurantMenus: {
          where: {
            restaurantId,
          },
        },
      },
    });

    const [menuItems, matchingCount, unavailableCount] =
      includeAvailabilityCounts === 'true'
        ? await this.prisma.$transaction(
            [
              findItems,
              this.prisma.menuItem.count({ where: baseWhere }),
              this.prisma.menuItem.count({ where: unavailableWhere }),
            ],
            { isolationLevel: 'RepeatableRead' },
          )
        : await Promise.all([findItems, this.prisma.menuItem.count({ where })]);
    const availabilityCounts =
      unavailableCount === undefined
        ? undefined
        : {
            available: matchingCount - unavailableCount,
            unavailable: unavailableCount,
          };
    const total =
      availabilityCounts && availability
        ? availabilityCounts[availability]
        : matchingCount;

    return {
      data: menuItems.map((menuItem) => {
        const restaurantMenu = menuItem.restaurantMenus[0];

        return {
          id: menuItem.id,
          name: menuItem.name,
          sku: menuItem.sku,
          description: menuItem.description,

          // Restaurant price if configured,
          // otherwise global base price.
          price: Number(restaurantMenu?.price ?? menuItem.basePrice),

          isAvailable: restaurantMenu?.isAvailable ?? menuItem.isAvailable,

          restaurantConfigured: restaurantMenu !== undefined,

          restaurantMenuItemId: restaurantMenu?.id ?? null,

          category: {
            id: menuItem.category.id,
            name: menuItem.category.name,
            sortOrder: menuItem.category.sortOrder,
          },
        };
      }),

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      ...(availabilityCounts && { availabilityCounts }),
    };
  }

  // ============================================================
  // GET ONLY CHANGED ITEMS FOR ONE RESTAURANT
  // ============================================================
  // Only returns items where:
  //
  // RestaurantMenuItem.price
  //        !=
  // MenuItem.basePrice
  //
  // Example:
  //
  // Global       Restaurant
  // ₹399         ₹399    -> NOT returned
  // ₹399         ₹429    -> returned
  // ============================================================

  async findChangedItems(restaurantId: string, page = 1, limit = 10) {
    const skip = catalogPageOffset(page, limit);
    const items = await this.prisma.restaurantMenuItem.findMany({
      where: {
        restaurantId,
      },
      include: {
        menuItem: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const changedItems = items.filter(
      (item) => !item.price.equals(item.menuItem.basePrice),
    );

    const total = changedItems.length;

    return {
      data: changedItems.slice(skip, skip + limit).map((item) => ({
        id: item.id,
        restaurantId: item.restaurantId,

        menuItem: {
          id: item.menuItem.id,
          name: item.menuItem.name,
          sku: item.menuItem.sku,
        },

        defaultPrice: Number(item.menuItem.basePrice),

        restaurantPrice: Number(item.price),

        priceDifference: Number(item.price) - Number(item.menuItem.basePrice),

        isAvailable: item.isAvailable,
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
  // GET ONLY CHANGED ITEMS ACROSS ALL RESTAURANTS
  // ============================================================
  // Only returns genuine price overrides.
  //
  // Same price as global:
  //     NOT returned
  //
  // Different price:
  //     returned
  // ============================================================

  async findAllChangedItems(page = 1, limit = 10, restaurantIds?: string[]) {
    const skip = catalogPageOffset(page, limit);
    const items = await this.prisma.restaurantMenuItem.findMany({
      ...(restaurantIds && { where: { restaurantId: { in: restaurantIds } } }),
      include: {
        menuItem: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const changedItems = items.filter(
      (item) => !item.price.equals(item.menuItem.basePrice),
    );

    const restaurantMap = new Map<
      string,
      {
        restaurantId: string;
        menuItems: {
          id: string;
          menuItem: {
            id: string;
            name: string;
            sku: string;
          };
          category: {
            id: string;
            name: string;
          };
          defaultPrice: number;
          restaurantPrice: number;
          priceDifference: number;
          isAvailable: boolean;
        }[];
      }
    >();

    for (const item of changedItems) {
      if (!restaurantMap.has(item.restaurantId)) {
        restaurantMap.set(item.restaurantId, {
          restaurantId: item.restaurantId,
          menuItems: [],
        });
      }

      restaurantMap.get(item.restaurantId)!.menuItems.push({
        id: item.id,

        menuItem: {
          id: item.menuItem.id,
          name: item.menuItem.name,
          sku: item.menuItem.sku,
        },

        category: {
          id: item.menuItem.category.id,
          name: item.menuItem.category.name,
        },

        defaultPrice: Number(item.menuItem.basePrice),

        restaurantPrice: Number(item.price),

        priceDifference: Number(item.price) - Number(item.menuItem.basePrice),

        isAvailable: item.isAvailable,
      });
    }

    const restaurants = Array.from(restaurantMap.values());

    const totalRestaurants = restaurants.length;
    const totalChangedItems = changedItems.length;

    return {
      data: restaurants.slice(skip, skip + limit),

      pagination: {
        page,
        limit,
        totalRestaurants,
        totalChangedItems,
        totalPages: Math.ceil(totalRestaurants / limit),
      },
    };
  }

  // ============================================================
  // FIND ONE
  // ============================================================

  async findOne(id: string, restaurantIds?: string[]) {
    const item = await this.prisma.restaurantMenuItem.findUnique({
      where: {
        id,
        ...(restaurantIds && { restaurantId: { in: restaurantIds } }),
      },
      include: {
        menuItem: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Restaurant menu item not found');
    }

    return {
      id: item.id,
      restaurantId: item.restaurantId,

      menuItem: {
        id: item.menuItem.id,
        name: item.menuItem.name,
        sku: item.menuItem.sku,
        description: item.menuItem.description,
      },

      defaultPrice: Number(item.menuItem.basePrice),

      restaurantPrice: Number(item.price),

      priceDifference: Number(item.price) - Number(item.menuItem.basePrice),

      isAvailable: item.isAvailable,

      category: {
        id: item.menuItem.category.id,
        name: item.menuItem.category.name,
        sortOrder: item.menuItem.category.sortOrder,
      },
    };
  }

  // ============================================================
  // UPDATE
  // ============================================================

  async update(
    id: string,
    dto: UpdateRestaurantMenuItemDto,
    restaurantIds?: string[],
  ) {
    const existing = await this.prisma.restaurantMenuItem.findUnique({
      where: {
        id,
        ...(restaurantIds && { restaurantId: { in: restaurantIds } }),
      },
    });

    if (!existing) {
      throw new NotFoundException('Restaurant menu item not found');
    }

    // Restaurant-level configuration is intentionally limited to:
    // 1. price
    // 2. isAvailable
    //
    // restaurantId and menuItemId MUST NOT be changed.

    return this.prisma.restaurantMenuItem.update({
      where: {
        id,
      },
      data: {
        ...(dto.price !== undefined && {
          price: dto.price,
        }),

        ...(dto.isAvailable !== undefined && {
          isAvailable: dto.isAvailable,
        }),
      },

      include: {
        menuItem: {
          include: {
            category: true,
          },
        },
      },
    });
  }
  // ============================================================
  // DELETE
  // ============================================================

  async remove(id: string, restaurantIds?: string[]) {
    const existing = await this.prisma.restaurantMenuItem.findUnique({
      where: {
        id,
        ...(restaurantIds && { restaurantId: { in: restaurantIds } }),
      },
    });

    if (!existing) {
      throw new NotFoundException('Restaurant menu item not found');
    }

    await this.prisma.restaurantMenuItem.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Restaurant menu item deleted successfully.',
    };
  }
}
