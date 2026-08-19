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
  findAll() {
    return this.prisma.menuItem.findMany({
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
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
