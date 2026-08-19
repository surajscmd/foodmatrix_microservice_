import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

import { CreateRestaurantDto } from './dto/create-restaurant.dto.js';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto.js';

type RestaurantStatus = 'ACTIVE' | 'INACTIVE';

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // CREATE RESTAURANT
  // ============================================================

  async create(payload: CreateRestaurantDto) {
    // 1. Verify Region exists
    const regionExists = await this.prisma.region.findUnique({
      where: {
        id: payload.regionId,
      },
    });

    if (!regionExists) {
      throw new NotFoundException(
        `Region with ID ${payload.regionId} not found`,
      );
    }

    // 2. Check duplicate restaurant
    // inside the same region.
    const duplicateRestaurant = await this.prisma.restaurant.findFirst({
      where: {
        regionId: payload.regionId,

        name: {
          equals: payload.name,
          mode: 'insensitive',
        },
      },
    });

    if (duplicateRestaurant) {
      throw new ConflictException(
        `Restaurant with the name '${payload.name}' already exists in this region.`,
      );
    }

    // 3. Create restaurant
    //
    // Status is NOT supplied here.
    // Prisma automatically uses:
    //
    // status = ACTIVE
    //
    try {
      return await this.prisma.restaurant.create({
        data: {
          name: payload.name,
          address: payload.address,
          city: payload.city,
          state: payload.state,
          country: payload.country,
          timezone: payload.timezone,
          regionId: payload.regionId,
        },

        include: {
          region: {
            include: {
              franchise: true,
            },
          },
        },
      });
    } catch (error: unknown) {
      // Protect against race-condition duplicates.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Restaurant with the name '${payload.name}' already exists in this region.`,
        );
      }

      throw error;
    }
  }

  // ============================================================
  // GET ALL RESTAURANTS
  // Optional regionId filtering
  // ============================================================

  async findAll(regionId?: string) {
    // If regionId was provided,
    // verify that the region exists.
    if (regionId) {
      const regionExists = await this.prisma.region.findUnique({
        where: {
          id: regionId,
        },
      });

      if (!regionExists) {
        throw new NotFoundException(`Region with ID ${regionId} not found`);
      }
    }

    return this.prisma.restaurant.findMany({
      where: regionId
        ? {
            regionId,
          }
        : undefined,

      orderBy: {
        name: 'asc',
      },

      include: {
        region: {
          include: {
            franchise: true,
          },
        },
      },
    });
  }

  // ============================================================
  // GET RESTAURANT BY ID
  // ============================================================

  async findOne(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: {
        id,
      },

      include: {
        region: {
          include: {
            franchise: true,
          },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }

    return restaurant;
  }

  // ============================================================
  // UPDATE RESTAURANT DETAILS
  // ============================================================

  async update(id: string, payload: UpdateRestaurantDto) {
    // 1. Verify restaurant exists
    const existingRestaurant = await this.findOne(id);

    // 2. Determine target region
    //
    // If regionId isn't being changed,
    // keep existing region.
    const targetRegionId = payload.regionId ?? existingRestaurant.regionId;

    // 3. Verify new region if restaurant
    // is being moved.
    if (payload.regionId !== undefined) {
      const regionExists = await this.prisma.region.findUnique({
        where: {
          id: payload.regionId,
        },
      });

      if (!regionExists) {
        throw new NotFoundException(
          `Cannot move restaurant: Region with ID ${payload.regionId} not found`,
        );
      }
    }

    // 4. Determine target name
    const targetName = payload.name ?? existingRestaurant.name;

    // 5. Check duplicate restaurant
    // within target region.
    if (payload.name !== undefined || payload.regionId !== undefined) {
      const duplicateRestaurant = await this.prisma.restaurant.findFirst({
        where: {
          regionId: targetRegionId,

          name: {
            equals: targetName,
            mode: 'insensitive',
          },

          NOT: {
            id,
          },
        },
      });

      if (duplicateRestaurant) {
        throw new ConflictException(
          `Restaurant with the name '${targetName}' already exists in this region.`,
        );
      }
    }

    // 6. Update only supplied fields.
    try {
      return await this.prisma.restaurant.update({
        where: {
          id,
        },

        data: {
          name: payload.name,
          address: payload.address,
          city: payload.city,
          state: payload.state,
          country: payload.country,
          timezone: payload.timezone,
          regionId: payload.regionId,
        },

        include: {
          region: {
            include: {
              franchise: true,
            },
          },
        },
      });
    } catch (error: unknown) {
      // Handle database-level unique constraint.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Restaurant with the name '${targetName}' already exists in this region.`,
        );
      }

      throw error;
    }
  }

  // ============================================================
  // UPDATE RESTAURANT STATUS
  // ============================================================

  async updateStatus(id: string, status: RestaurantStatus) {
    // 1. Verify restaurant exists
    const restaurant = await this.findOne(id);

    // 2. Don't perform unnecessary update
    if (restaurant.status === status) {
      throw new ConflictException(`Restaurant is already ${status}`);
    }

    // 3. Update status
    return this.prisma.restaurant.update({
      where: {
        id,
      },

      data: {
        status,
      },

      include: {
        region: {
          include: {
            franchise: true,
          },
        },
      },
    });
  }

  // ============================================================
  // DELETE RESTAURANT
  // ============================================================

  async remove(id: string) {
    // 1. Verify restaurant exists
    await this.findOne(id);

    // 2. Delete restaurant
    try {
      return await this.prisma.restaurant.delete({
        where: {
          id,
        },
      });
    } catch (error: unknown) {
      // P2003 = Foreign key constraint failed
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'Cannot delete restaurant because it still has users or terminals attached.',
        );
      }

      throw error;
    }
  }
}
