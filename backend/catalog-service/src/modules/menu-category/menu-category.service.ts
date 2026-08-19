import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto.js';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';

@Injectable()
export class MenuCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateMenuCategoryDto) {
    return this.prisma.menuCategory.create({
      data: createDto,
    });
  }

  async findAll() {
    return this.prisma.menuCategory.findMany({
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Menu category not found');
    }

    return category;
  }

  async update(id: string, updateDto: UpdateMenuCategoryDto) {
    await this.findOne(id);

    return this.prisma.menuCategory.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.menuCategory.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }
}
