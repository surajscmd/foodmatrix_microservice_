// src/franchise/franchise.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { CreateFranchiseDto } from './dto/create-franchise.dto.js';
import type { UpdateFranchiseDto } from './dto/update-franchise.dto.js';

@Injectable()
export class FranchiseService {
  constructor(private readonly prisma: PrismaService) {}

  //   add frnchise creation logic here
  async createFranchise(createFranchiseDto: CreateFranchiseDto) {
    // 1. Check if a franchise with this exact name already exists
    const existingFranchise = await this.prisma.franchise.findFirst({
      where: {
        name: {
          equals: createFranchiseDto.name,
          mode: 'insensitive', // Makes the check case-insensitive (e.g., "Matrix" == "matrix")
        },
      },
    });

    // 2. If it exists, block the creation and return a 409 Error
    if (existingFranchise) {
      throw new ConflictException(
        `A franchise with the name '${createFranchiseDto.name}' already exists.`,
      );
    }

    // 3. If it does not exist, proceed with creation
    return this.prisma.franchise.create({
      data: {
        name: createFranchiseDto.name,
        taxId: createFranchiseDto.taxId,
        defaultCurrency: createFranchiseDto.defaultCurrency ?? 'INR',
      },
    });
  }

  //  logic to fetch all franchises here
  async findAllFranchises() {
    return this.prisma.franchise.findMany({
      include: {
        _count: {
          select: { regions: true, systemUsers: true },
        },
      },
    });
  }
  // Helper to fetch single franchise
  async findOne(id: string) {
    const franchise = await this.prisma.franchise.findUnique({
      where: { id },
      include: {
        _count: {
          select: { regions: true },
        },
      },
    });

    if (!franchise) {
      throw new NotFoundException(`Franchise with ID "${id}" not found`);
    }

    return franchise;
  }
  // Update logic
  async update(id: string, payload: UpdateFranchiseDto) {
    await this.findOne(id);

    return this.prisma.franchise.update({
      where: { id },
      data: {
        name: payload.name, // 👈 Make sure this line exists!
        taxId: payload.taxId,
        defaultCurrency: payload.defaultCurrency,
      },
    });
  }
  // Delete logic
  async delete(id: string) {
    await this.findOne(id);

    return this.prisma.franchise.delete({
      where: { id },
    });
  }
}
