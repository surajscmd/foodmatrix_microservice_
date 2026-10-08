/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateModifierDto } from './dto/create-modifier.dto';
import { UpdateModifierDto } from './dto/update-modifier.dto';

import { PrismaService } from '../../lib/prisma/prisma.service';

@Injectable()
export class ModifierService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // CREATE MODIFIER
  // ============================================================

  async create(createDto: CreateModifierDto) {
    const group = await this.prisma.modifierGroup.findUnique({
      where: {
        id: createDto.groupId,
      },
    });

    if (!group) {
      throw new NotFoundException('Modifier group not found');
    }

    if (!group.isActive) {
      throw new BadRequestException(
        'Cannot add modifier to an inactive modifier group',
      );
    }

    const modifier = await this.prisma.modifier.create({
      data: {
        groupId: createDto.groupId,
        name: createDto.name,
        sortOrder: createDto.sortOrder ?? 0,
        extraPrice: createDto.extraPrice ?? 0,
        isActive: createDto.isActive ?? true,
      },
    });

    return {
      group: {
        id: group.id,
        name: group.name,
        sortOrder: group.sortOrder,
        minSelections: group.minSelections,
        maxSelections: group.maxSelections,
        isActive: group.isActive,
      },

      modifier: {
        id: modifier.id,
        groupId: modifier.groupId,
        name: modifier.name,
        sortOrder: modifier.sortOrder,
        extraPrice: Number(modifier.extraPrice),
        isActive: modifier.isActive,
        createdAt: modifier.createdAt,
        updatedAt: modifier.updatedAt,
      },
    };
  }

  // ============================================================
  // FIND ALL MODIFIERS
  // ============================================================

  async findAll(groupId?: string) {
    const modifiers = await this.prisma.modifier.findMany({
      where: {
        ...(groupId !== undefined ? { groupId } : {}),
      },

      include: {
        group: true,
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

    const grouped = modifiers.reduce<
      {
        group: {
          id: string;
          name: string;
          sortOrder: number;
          minSelections: number;
          maxSelections: number;
          isActive: boolean;
        };
        modifiers: {
          id: string;
          groupId: string;
          name: string;
          sortOrder: number;
          extraPrice: number;
          isActive: boolean;
          createdAt: Date;
          updatedAt: Date;
        }[];
      }[]
    >((groups, modifier) => {
      let group = groups.find((item) => item.group.id === modifier.group.id);

      if (!group) {
        group = {
          group: {
            id: modifier.group.id,
            name: modifier.group.name,
            sortOrder: modifier.group.sortOrder,
            minSelections: modifier.group.minSelections,
            maxSelections: modifier.group.maxSelections,
            isActive: modifier.group.isActive,
          },
          modifiers: [],
        };

        groups.push(group);
      }

      group.modifiers.push({
        id: modifier.id,
        groupId: modifier.groupId,
        name: modifier.name,
        sortOrder: modifier.sortOrder,
        extraPrice: Number(modifier.extraPrice),
        isActive: modifier.isActive,
        createdAt: modifier.createdAt,
        updatedAt: modifier.updatedAt,
      });

      return groups;
    }, []);

    return grouped;
  }

  // ============================================================
  // FIND ONE MODIFIER
  // ============================================================

  async findOne(id: string) {
    const modifier = await this.prisma.modifier.findUnique({
      where: {
        id,
      },

      include: {
        group: true,
      },
    });

    if (!modifier) {
      throw new NotFoundException('Modifier not found');
    }

    return {
      group: {
        id: modifier.group.id,
        name: modifier.group.name,
        sortOrder: modifier.group.sortOrder,
        minSelections: modifier.group.minSelections,
        maxSelections: modifier.group.maxSelections,
        isActive: modifier.group.isActive,
      },

      modifier: {
        id: modifier.id,
        groupId: modifier.groupId,
        name: modifier.name,
        sortOrder: modifier.sortOrder,
        extraPrice: Number(modifier.extraPrice),
        isActive: modifier.isActive,
        createdAt: modifier.createdAt,
        updatedAt: modifier.updatedAt,
      },
    };
  }

  // ============================================================
  // UPDATE MODIFIER
  // ============================================================

  async update(id: string, updateDto: UpdateModifierDto) {
    const existing = await this.prisma.modifier.findUnique({
      where: {
        id,
      },
    });

    if (!existing?.isActive && updateDto.isActive === true) {
      const groupId = updateDto.groupId ?? existing?.groupId;

      const group = await this.prisma.modifierGroup.findUnique({
        where: {
          id: groupId,
        },
      });

      if (!group) {
        throw new NotFoundException('Modifier group not found');
      }

      if (!group.isActive) {
        throw new BadRequestException(
          'Cannot activate a modifier under an inactive modifier group',
        );
      }
    }

    if (updateDto.groupId !== undefined) {
      const group = await this.prisma.modifierGroup.findUnique({
        where: {
          id: updateDto.groupId,
        },
      });

      if (!group) {
        throw new NotFoundException('Modifier group not found');
      }

      if (!group.isActive) {
        throw new BadRequestException(
          'Cannot assign modifier to an inactive modifier group',
        );
      }
    }

    const modifier = await this.prisma.modifier.update({
      where: {
        id,
      },

      data: {
        ...(updateDto.groupId !== undefined && {
          groupId: updateDto.groupId,
        }),

        ...(updateDto.name !== undefined && {
          name: updateDto.name,
        }),

        ...(updateDto.sortOrder !== undefined && {
          sortOrder: updateDto.sortOrder,
        }),

        ...(updateDto.extraPrice !== undefined && {
          extraPrice: updateDto.extraPrice,
        }),

        ...(updateDto.isActive !== undefined && {
          isActive: updateDto.isActive,
        }),
      },

      include: {
        group: true,
      },
    });

    return {
      group: {
        id: modifier.group.id,
        name: modifier.group.name,
        sortOrder: modifier.group.sortOrder,
        minSelections: modifier.group.minSelections,
        maxSelections: modifier.group.maxSelections,
        isActive: modifier.group.isActive,
      },

      modifier: {
        id: modifier.id,
        groupId: modifier.groupId,
        name: modifier.name,
        sortOrder: modifier.sortOrder,
        extraPrice: Number(modifier.extraPrice),
        isActive: modifier.isActive,
        createdAt: modifier.createdAt,
        updatedAt: modifier.updatedAt,
      },
    };
  }

  // ============================================================
  // REMOVE / DEACTIVATE MODIFIER
  // ============================================================

  async remove(id: string) {
    const modifier = await this.prisma.modifier.findUnique({
      where: {
        id,
      },
    });

    if (!modifier) {
      throw new NotFoundException('Modifier not found');
    }

    if (!modifier.isActive) {
      throw new BadRequestException('Modifier is already inactive');
    }

    await this.prisma.modifier.update({
      where: {
        id,
      },

      data: {
        isActive: false,
      },
    });

    return {
      message: 'Modifier deleted successfully.',
    };
  }
}
