import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { CreateItemModifierGroupDto } from './dto/create-item-modifier-group.dto';
import { PrismaService } from '../../lib/prisma/prisma.service';

type ItemModifierGroupWithRelations = Prisma.ItemModifierGroupGetPayload<{
  include: {
    menuItem: true;
    group: {
      include: {
        modifiers: true;
      };
    };
  };
}>;

@Injectable()
export class ItemModifierGroupService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // CREATE
  // ============================================================

  async create(
    createDto: CreateItemModifierGroupDto,
  ): Promise<ItemModifierGroupWithRelations> {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: {
        id: createDto.menuItemId,
      },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    const group = await this.prisma.modifierGroup.findUnique({
      where: {
        id: createDto.groupId,
      },
    });

    if (!group) {
      throw new NotFoundException('Modifier group not found');
    }

    if (!group.isActive) {
      throw new BadRequestException('Cannot assign an inactive modifier group');
    }

    const existing = await this.prisma.itemModifierGroup.findUnique({
      where: {
        menuItemId_groupId: {
          menuItemId: createDto.menuItemId,
          groupId: createDto.groupId,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'Modifier group is already assigned to this menu item',
      );
    }

    return this.prisma.itemModifierGroup.create({
      data: {
        menuItemId: createDto.menuItemId,
        groupId: createDto.groupId,
      },

      include: {
        menuItem: true,

        group: {
          include: {
            modifiers: {
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
            },
          },
        },
      },
    });
  }

  // ============================================================
  // FIND ALL
  // ============================================================

  async findAll(
    menuItemId?: string,
  ): Promise<ItemModifierGroupWithRelations[]> {
    return this.prisma.itemModifierGroup.findMany({
      where: {
        ...(menuItemId !== undefined && {
          menuItemId,
        }),

        group: {
          isActive: true,
        },
      },

      include: {
        menuItem: true,

        group: {
          include: {
            modifiers: {
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
            },
          },
        },
      },

      orderBy: {
        group: {
          sortOrder: 'asc',
        },
      },
    });
  }

  // ============================================================
  // FIND ONE
  // ============================================================

  async findOne(
    menuItemId: string,
    groupId: string,
  ): Promise<ItemModifierGroupWithRelations> {
    const relation = await this.prisma.itemModifierGroup.findFirst({
      where: {
        menuItemId,
        groupId,

        group: {
          isActive: true,
        },
      },

      include: {
        menuItem: true,

        group: {
          include: {
            modifiers: {
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
            },
          },
        },
      },
    });

    if (!relation) {
      throw new NotFoundException('Modifier group assignment not found');
    }

    return relation;
  }

  // ============================================================
  // REMOVE
  // ============================================================

  async remove(
    menuItemId: string,
    groupId: string,
  ): Promise<{ message: string }> {
    await this.findOne(menuItemId, groupId);

    await this.prisma.itemModifierGroup.delete({
      where: {
        menuItemId_groupId: {
          menuItemId,
          groupId,
        },
      },
    });

    return {
      message: 'Modifier group removed from menu item successfully.',
    };
  }
}
