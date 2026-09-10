import { Injectable } from '@nestjs/common';

import { LocationType, type StockMovement } from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

import { CatalogGatewayService } from '../../utils/caltalog-gateway.service.js';

import { GetStockMovementsDto } from './dto/get-stock-movements.dto.js';

@Injectable()
export class StockMovementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogGatewayService: CatalogGatewayService,
  ) {}

  // ======================================================
  // ENRICH MOVEMENTS WITH CATALOG INGREDIENT INFORMATION
  // ======================================================

  private async enrichMovements(movements: StockMovement[]) {
    const ingredientIds = [
      ...new Set(movements.map((movement) => movement.ingredientId)),
    ];

    if (ingredientIds.length === 0) {
      return movements.map((movement) => ({
        ...movement,
        ingredient: null,
      }));
    }

    const ingredients =
      await this.catalogGatewayService.getBulkIngredients(ingredientIds);

    const ingredientMap = new Map(
      ingredients.map((ingredient) => [ingredient.id, ingredient]),
    );

    return movements.map((movement) => {
      const ingredient = ingredientMap.get(movement.ingredientId);

      return {
        ...movement,

        ingredient: ingredient
          ? {
              id: ingredient.id,
              name: ingredient.name,
              uom: ingredient.uom,
              isActive: ingredient.isActive,
            }
          : null,
      };
    });
  }

  // ======================================================
  // GET ALL STOCK MOVEMENTS
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

    const enrichedMovements = await this.enrichMovements(movements);

    return {
      data: enrichedMovements,

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

    const enrichedMovements = await this.enrichMovements(movements);

    return {
      data: enrichedMovements,

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

    const enrichedMovements = await this.enrichMovements(movements);

    return {
      data: enrichedMovements,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
