import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateRegionDto } from './dto/create-region.dto.js';
import { UpdateRegionDto } from './dto/update-region.dto.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';

@Injectable()
export class RegionsService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new region
  async create(createRegionDto: CreateRegionDto) {
    const franchise = await this.prisma.franchise.findUnique({
      where: { id: createRegionDto.franchiseId },
    });

    if (!franchise) {
      throw new NotFoundException(
        `Franchise with ID ${createRegionDto.franchiseId} not found`,
      );
    }

    return this.prisma.region.create({
      data: createRegionDto,
    });
  }
  // Get all regions
  async findAll() {
    return this.prisma.region.findMany({
      include: { franchise: true },
    });
  }
  // Get regions by franchise ID
  async findByFranchise(franchiseId: string) {
    return this.prisma.region.findMany({
      where: { franchiseId },
      include: { franchise: true },
    });
  }
  // Get a single region by ID
  async findOne(id: string) {
    const region = await this.prisma.region.findUnique({
      where: { id },
      include: { franchise: true },
    });

    if (!region) {
      throw new NotFoundException(`Region with ID ${id} not found`);
    }

    return region;
  }

  // Update a region by ID
  async update(id: string, payload: UpdateRegionDto) {
    await this.findOne(id);
    // Check if the franchiseId is being updated and validate it
    if (payload.franchiseId) {
      const franchiseExists = await this.prisma.franchise.findUnique({
        where: { id: payload.franchiseId },
      });

      if (!franchiseExists) {
        throw new NotFoundException(
          `Cannot move region: Franchise with ID ${payload.franchiseId} not found`,
        );
      }
    }

    return this.prisma.region.update({
      where: { id },
      data: {
        ...(payload.name !== undefined && {
          name: payload.name,
        }),

        ...(payload.franchiseId !== undefined && {
          franchiseId: payload.franchiseId,
        }),
      },
      include: {
        franchise: true,
      },
    });
  }
  // Delete a region by ID
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.region.delete({
      where: { id },
    });
  }
}
