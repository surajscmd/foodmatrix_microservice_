import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { catalogPageOffset } from '../../common/catalog-pagination.js';

import { CreateIngredientDto } from './dto/create-ingredient.dto.js';
import { UpdateIngredientDto } from './dto/update-ingredient.dto.js';

@Injectable()
export class IngredientService {
  constructor(private readonly prisma: PrismaService) {}

  // CREATE
  async create(createDto: CreateIngredientDto) {
    const existingIngredient = await this.prisma.ingredient.findFirst({
      where: {
        name: createDto.name,
      },
    });

    if (existingIngredient) {
      throw new ConflictException('Ingredient with this name already exists');
    }

    return this.prisma.ingredient.create({
      data: {
        name: createDto.name,
        uom: createDto.uom,
        isActive: createDto.isActive ?? true,
      },
    });
  }

  // GET ALL
  async findAll(page = 1, limit = 10, search?: string) {
    const skip = catalogPageOffset(page, limit);

    const where = {
      ...(search
        ? {
            name: {
              contains: search,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    const [ingredients, total] = await this.prisma.$transaction([
      this.prisma.ingredient.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          name: 'asc',
        },
      }),

      this.prisma.ingredient.count({
        where,
      }),
    ]);

    return {
      data: ingredients,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  // GET ONE
  async findOne(id: string) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: {
        id,
      },
    });

    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }

    return ingredient;
  }

  // UPDATE
  async update(id: string, updateDto: UpdateIngredientDto) {
    await this.findOne(id);

    if (updateDto.name) {
      const existingIngredient = await this.prisma.ingredient.findFirst({
        where: {
          name: updateDto.name,
          NOT: {
            id,
          },
        },
      });

      if (existingIngredient) {
        throw new ConflictException('Ingredient with this name already exists');
      }
    }

    return this.prisma.ingredient.update({
      where: {
        id,
      },
      data: updateDto,
    });
  }

  // SOFT DELETE
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.ingredient.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    });
  }
}
