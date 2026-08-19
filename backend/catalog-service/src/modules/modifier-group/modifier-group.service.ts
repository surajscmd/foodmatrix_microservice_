/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateModifierGroupDto } from './dto/create-modifier-group.dto';
import { UpdateModifierGroupDto } from './dto/update-modifier-group.dto';
import { PrismaService } from '../../lib/prisma/prisma.service';

@Injectable()
export class ModifierGroupService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateModifierGroupDto) {
    this.validateSelections(createDto.minSelections, createDto.maxSelections);

    return this.prisma.modifierGroup.create({
      data: {
        name: createDto.name,
        sortOrder: createDto.sortOrder ?? 0,
        minSelections: createDto.minSelections ?? 0,
        maxSelections: createDto.maxSelections ?? 1,
        isActive: createDto.isActive ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.modifierGroup.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });
  }

  async findOne(id: string) {
    const modifierGroup = await this.prisma.modifierGroup.findUnique({
      where: {
        id,
      },
      include: {
        modifiers: true,
      },
    });

    if (!modifierGroup) {
      throw new NotFoundException('Modifier group not found');
    }

    return modifierGroup;
  }

  async update(id: string, updateDto: UpdateModifierGroupDto) {
    const existing = await this.findOne(id);
    if (!existing.isActive) {
      throw new BadRequestException('Cannot update an inactive modifier group');
    }

    const minSelections = updateDto.minSelections ?? existing.minSelections;

    const maxSelections = updateDto.maxSelections ?? existing.maxSelections;

    this.validateSelections(minSelections, maxSelections);

    return this.prisma.modifierGroup.update({
      where: {
        id,
      },
      data: {
        ...(updateDto.name !== undefined && {
          name: updateDto.name,
        }),

        ...(updateDto.sortOrder !== undefined && {
          sortOrder: updateDto.sortOrder,
        }),

        ...(updateDto.minSelections !== undefined && {
          minSelections: updateDto.minSelections,
        }),

        ...(updateDto.maxSelections !== undefined && {
          maxSelections: updateDto.maxSelections,
        }),

        ...(updateDto.isActive !== undefined && {
          isActive: updateDto.isActive,
        }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.modifierGroup.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    });

    return {
      message: 'Modifier group deleted successfully.',
    };
  }

  private validateSelections(
    minSelections: number,
    maxSelections: number,
  ): void {
    if (minSelections > maxSelections) {
      throw new BadRequestException(
        'minSelections cannot be greater than maxSelections',
      );
    }
  }
}
