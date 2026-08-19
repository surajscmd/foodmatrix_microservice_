/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
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

    return this.prisma.modifier.create({
      data: {
        groupId: createDto.groupId,
        name: createDto.name,
        sortOrder: createDto.sortOrder ?? 0,
        extraPrice: createDto.extraPrice ?? 0,
        isActive: createDto.isActive ?? true,
      },
      include: {
        group: true,
      },
    });
  }

  async findAll(groupId?: string) {
    return this.prisma.modifier.findMany({
      where: {
        isActive: true,
        ...(groupId !== undefined && {
          groupId,
        }),
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
  }

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

    return modifier;
  }

  async update(id: string, updateDto: UpdateModifierDto) {
    const existing = await this.findOne(id);

    if (!existing.isActive) {
      throw new BadRequestException('Cannot update an inactive modifier');
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

    return this.prisma.modifier.update({
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
  }

  async remove(id: string) {
    const modifier = await this.findOne(id);

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
