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

  // ============================================================
  // CREATE
  // ============================================================

  async create(createDto: CreateModifierGroupDto) {
    const minSelections = createDto.minSelections ?? 0;
    const maxSelections = createDto.maxSelections ?? 1;
    this.validateSelections(minSelections, maxSelections);

    return this.prisma.modifierGroup.create({
      data: {
        name: createDto.name,
        sortOrder: createDto.sortOrder ?? 0,
        minSelections,
        maxSelections,
        isActive: createDto.isActive ?? true,
      },

      include: {
        modifiers: {
          orderBy: [
            {
              sortOrder: 'asc',
            },
            {
              name: 'asc',
            },
          ],
        },
      },
    });
  }

  // ============================================================
  // FIND ALL
  // ============================================================

  async findAll() {
    return this.prisma.modifierGroup.findMany({
      include: {
        modifiers: {
          orderBy: [
            {
              sortOrder: 'asc',
            },
            {
              name: 'asc',
            },
          ],
        },
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
  // ============================================================
  // FIND ONE
  // ============================================================

  async findOne(id: string) {
    const modifierGroup = await this.prisma.modifierGroup.findUnique({
      where: {
        id,
      },

      include: {
        modifiers: {
          orderBy: [
            {
              sortOrder: 'asc',
            },
            {
              name: 'asc',
            },
          ],
        },
      },
    });

    if (!modifierGroup) {
      throw new NotFoundException('Modifier group not found');
    }

    return modifierGroup;
  }

  // ============================================================
  // UPDATE
  // ============================================================

  async update(id: string, updateDto: UpdateModifierGroupDto) {
    const existing = await this.findOne(id);

    if (!existing.isActive && updateDto.isActive !== true) {
      throw new BadRequestException(
        'Inactive modifier groups can only be reactivated first',
      );
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

      include: {
        modifiers: {
          orderBy: [
            {
              sortOrder: 'asc',
            },
            {
              name: 'asc',
            },
          ],
        },
      },
    });
  }

  // ============================================================
  // DELETE / SOFT DELETE
  // ============================================================

  async remove(id: string) {
    const existing = await this.findOne(id);

    if (!existing.isActive) {
      throw new BadRequestException('Modifier group is already inactive');
    }

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

  // ============================================================
  // VALIDATION
  // ============================================================

  private validateSelections(
    minSelections: number,
    maxSelections: number,
  ): void {
    if (minSelections < 0) {
      throw new BadRequestException('minSelections cannot be negative');
    }

    if (maxSelections < 0) {
      throw new BadRequestException('maxSelections cannot be negative');
    }

    if (minSelections > maxSelections) {
      throw new BadRequestException(
        'minSelections cannot be greater than maxSelections',
      );
    }
  }
}
