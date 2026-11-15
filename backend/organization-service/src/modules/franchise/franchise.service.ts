import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { Franchise, Prisma } from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { UpdateFranchiseDto } from './dto/update-franchise.dto.js';

@Injectable()
export class FranchiseService {
  constructor(private readonly prisma: PrismaService) {}

  listOptions() {
    return this.prisma.franchise.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  async find(id: string): Promise<Franchise> {
    const franchise = await this.prisma.franchise.findUnique({ where: { id } });

    if (!franchise) {
      throw new NotFoundException('Franchise not found');
    }

    return franchise;
  }

  async update(id: string, dto: UpdateFranchiseDto): Promise<Franchise> {
    try {
      return await this.prisma.franchise.update({
        where: {
          id,
        },
        data: dto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Franchise not found');
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A franchise with this name already exists',
        );
      }

      throw error;
    }
  }
}
