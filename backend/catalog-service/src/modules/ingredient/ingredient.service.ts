/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

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
  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [ingredients, total] = await Promise.all([
      this.prisma.ingredient.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.ingredient.count(),
    ]);

    return {
      data: ingredients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
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
