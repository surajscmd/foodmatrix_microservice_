/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateRestaurantMenuItemDto } from './dto/create-restaurant-menu-item.dto';
import { UpdateRestaurantMenuItemDto } from './dto/update-restaurant-menu-item.dto';
import { PrismaService } from '../../lib/prisma/prisma.service';

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
        price: dto.price,
        isAvailable: dto.isAvailable ?? true,
      },
      include: {
        menuItem: true,
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async findAll(restaurantId?: string) {
    return this.prisma.restaurantMenuItem.findMany({
      where: restaurantId
        ? {
            restaurantId,
          }
        : undefined,
      include: {
        menuItem: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.restaurantMenuItem.findUnique({
      where: {
        id,
      },
      include: {
        menuItem: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Restaurant menu item not found');
    }

    return item;
  }

  async update(id: string, dto: UpdateRestaurantMenuItemDto) {
    await this.findOne(id);

    // If restaurantId or menuItemId is being changed,
    // make sure the new combination doesn't already exist.
    if (dto.restaurantId || dto.menuItemId) {
      const current = await this.prisma.restaurantMenuItem.findUnique({
        where: { id },
      });

      if (!current) {
        throw new NotFoundException('Restaurant menu item not found');
      }

      const restaurantId = dto.restaurantId ?? current.restaurantId;
      const menuItemId = dto.menuItemId ?? current.menuItemId;

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

      // Make sure the menu item exists if changing it
      if (dto.menuItemId) {
        const menuItem = await this.prisma.menuItem.findUnique({
          where: {
            id: dto.menuItemId,
          },
        });

        if (!menuItem) {
          throw new NotFoundException('Menu item not found');
        }
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
        menuItem: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

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
