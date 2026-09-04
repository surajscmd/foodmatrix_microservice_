import { Injectable } from '@nestjs/common';

import { LocationType} from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

import { GetStockMovementsDto } from './dto/get-stock-movements.dto.js';

@Injectable()
export class StockMovementService {
  constructor(private readonly prisma: PrismaService) {}

  // ======================================================
  // GET ALL STOCK MOVEMENTS
  //
  // Optional filters:
  // - ingredientId
  // - movementType
  // - fromDate
  // - toDate
  //
  // Pagination:
  // - page
  // - limit
  // ======================================================

  async findAll(dto: GetStockMovementsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = {
      ...(dto.ingredientId
        ? {
            ingredientId: dto.ingredientId,
          }
        : {}),

      ...(dto.movementType
        ? {
            movementType: dto.movementType,
          }
        : {}),

      ...(dto.fromDate || dto.toDate
        ? {
            createdAt: {
              ...(dto.fromDate
                ? {
                    gte: new Date(dto.fromDate),
                  }
                : {}),

              ...(dto.toDate
                ? {
                    lte: new Date(dto.toDate),
                  }
                : {}),
            },
          }
        : {}),
    };

    const [movements, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,

        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.stockMovement.count({
        where,
      }),
    ]);

    return {
      data: movements,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ======================================================
  // GET RESTAURANT MOVEMENTS
  //
  // Filters movements where:
  // locationType = RESTAURANT
  // locationId   = restaurantId
  // ======================================================

  async findByRestaurant(restaurantId: string, dto: GetStockMovementsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = {
      locationType: LocationType.RESTAURANT,

      locationId: restaurantId,

      ...(dto.ingredientId
        ? {
            ingredientId: dto.ingredientId,
          }
        : {}),

      ...(dto.movementType
        ? {
            movementType: dto.movementType,
          }
        : {}),

      ...(dto.fromDate || dto.toDate
        ? {
            createdAt: {
              ...(dto.fromDate
                ? {
                    gte: new Date(dto.fromDate),
                  }
                : {}),

              ...(dto.toDate
                ? {
                    lte: new Date(dto.toDate),
                  }
                : {}),
            },
          }
        : {}),
    };

    const [movements, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,

        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.stockMovement.count({
        where,
      }),
    ]);

    return {
      data: movements,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ======================================================
  // GET WAREHOUSE MOVEMENTS
  //
  // Filters movements where:
  // locationType = WAREHOUSE
  // locationId   = warehouseId
  // ======================================================

  async findByWarehouse(warehouseId: string, dto: GetStockMovementsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = {
      locationType: LocationType.WAREHOUSE,

      locationId: warehouseId,

      ...(dto.ingredientId
        ? {
            ingredientId: dto.ingredientId,
          }
        : {}),

      ...(dto.movementType
        ? {
            movementType: dto.movementType,
          }
        : {}),

      ...(dto.fromDate || dto.toDate
        ? {
            createdAt: {
              ...(dto.fromDate
                ? {
                    gte: new Date(dto.fromDate),
                  }
                : {}),

              ...(dto.toDate
                ? {
                    lte: new Date(dto.toDate),
                  }
                : {}),
            },
          }
        : {}),
    };

    const [movements, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,

        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.stockMovement.count({
        where,
      }),
    ]);

    return {
      data: movements,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
