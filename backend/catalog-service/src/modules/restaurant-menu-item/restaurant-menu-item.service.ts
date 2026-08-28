import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateRestaurantMenuItemDto } from './dto/create-restaurant-menu-item.dto';
import { UpdateRestaurantMenuItemDto } from './dto/update-restaurant-menu-item.dto';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { Prisma } from '@prisma/client';

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

    // If restaurant price is the same as global price,
    // no restaurant-specific record is required.
    if (
      dto.price !== undefined &&
      new Prisma.Decimal(dto.price).equals(menuItem.basePrice)
    ) {
      throw new ConflictException(
        'Restaurant price is the same as the default price. No override is required.',
      );
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
        price: dto.price,
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

  async findAll(restaurantId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [menuItems, total] = await Promise.all([
      this.prisma.menuItem.findMany({
        where: {
          isAvailable: true,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          category: true,
          restaurantMenus: {
            where: {
              restaurantId,
            },
          },
        },
      }),

      this.prisma.menuItem.count({
        where: {
          isAvailable: true,
        },
      }),
    ]);

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

    const skip = (page - 1) * limit;

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

  async findAllChangedItems(page = 1, limit = 10) {
    const items = await this.prisma.restaurantMenuItem.findMany({
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

    const skip = (page - 1) * limit;

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

  async findOne(id: string) {
    const item = await this.prisma.restaurantMenuItem.findUnique({
      where: {
        id,
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

  async update(id: string, dto: UpdateRestaurantMenuItemDto) {
    const existing = await this.prisma.restaurantMenuItem.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Restaurant menu item not found');
    }

    // If restaurant or menu item changes,
    // validate that the combination is unique.
    if (dto.restaurantId !== undefined || dto.menuItemId !== undefined) {
      const restaurantId = dto.restaurantId ?? existing.restaurantId;

      const menuItemId = dto.menuItemId ?? existing.menuItemId;

      const duplicate = await this.prisma.restaurantMenuItem.findUnique({
        where: {
          restaurantId_menuItemId: {
            restaurantId,
            menuItemId,
          },
        },
      });

      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          'This menu item is already configured for this restaurant',
        );
      }
    }

    // Validate new menu item if changed.
    if (dto.menuItemId !== undefined) {
      const menuItem = await this.prisma.menuItem.findUnique({
        where: {
          id: dto.menuItemId,
        },
      });

      if (!menuItem) {
        throw new NotFoundException('Menu item not found');
      }
    }

    return this.prisma.restaurantMenuItem.update({
      where: {
        id,
      },
      data: {
        ...(dto.restaurantId !== undefined && {
          restaurantId: dto.restaurantId,
        }),

        ...(dto.menuItemId !== undefined && {
          menuItemId: dto.menuItemId,
        }),

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

  async remove(id: string) {
    const existing = await this.prisma.restaurantMenuItem.findUnique({
      where: {
        id,
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
