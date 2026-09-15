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

  async find(): Promise<Franchise> {
    const franchise = await this.prisma.franchise.findFirst();

    if (!franchise) {
      throw new NotFoundException('Franchise not found');
    }

    return franchise;
  }

  async update(dto: UpdateFranchiseDto): Promise<Franchise> {
    const franchise = await this.find();

    try {
      return await this.prisma.franchise.update({
        where: {
          id: franchise.id,
        },
        data: dto,
      });
    } catch (error) {
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
