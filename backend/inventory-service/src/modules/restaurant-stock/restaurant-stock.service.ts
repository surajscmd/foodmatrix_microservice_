import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { AdjustStockDto } from './dto/adjust-stock.dto.js';

@Injectable()
export class RestaurantStockService {
  constructor(private readonly prisma: PrismaService) {}

  // ======================================================
  // GET ALL RESTAURANT STOCK
  // ======================================================

  async findByRestaurant(restaurantId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [stocks, total] = await Promise.all([
      this.prisma.restaurantStock.findMany({
        where: {
          restaurantId,
        },

        skip,
        take: limit,

        orderBy: {
          ingredientId: 'asc',
        },
      }),

      this.prisma.restaurantStock.count({
        where: {
          restaurantId,
        },
      }),
    ]);

    return {
      data: stocks,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ======================================================
  // GET ONE INGREDIENT STOCK
  // ======================================================

  async findOne(restaurantId: string, ingredientId: string) {
    const stock = await this.prisma.restaurantStock.findUnique({
      where: {
        restaurantId_ingredientId: {
          restaurantId,
          ingredientId,
        },
      },
    });

    if (!stock) {
      throw new NotFoundException('Restaurant stock not found');
    }

    return stock;
  }

  // ======================================================
  // GET LOW STOCK
  // ======================================================

  async findLowStock(restaurantId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const stocks = await this.prisma.$queryRaw<
      Array<{
        id: string;
        restaurantId: string;
        ingredientId: string;
        quantityOnHand: unknown;
        reorderLevel: unknown;
        reorderQuantity: unknown;
        updatedAt: Date;
      }>
    >`
        SELECT
          id,
          "restaurantId",
          "ingredientId",
          "quantityOnHand",
          "reorderLevel",
          "reorderQuantity",
          "updatedAt"
        FROM "RestaurantStock"
        WHERE "restaurantId" = ${restaurantId}
          AND "quantityOnHand" <= "reorderLevel"
        ORDER BY "quantityOnHand" ASC
        LIMIT ${limit}
        OFFSET ${skip}
      `;

    const totalResult = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) AS count
        FROM "RestaurantStock"
        WHERE "restaurantId" = ${restaurantId}
          AND "quantityOnHand" <= "reorderLevel"
      `;

    const total = Number(totalResult[0]?.count ?? 0);

    return {
      data: stocks,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ======================================================
  // ADJUST STOCK
  //
  // Positive quantityChange = increase
  // Negative quantityChange = decrease
  //
  // Example:
  //
  // +5 => 17 -> 22
  // -2 => 17 -> 15
  //
  // Creates StockMovement = ADJUSTMENT
  // ======================================================

  async adjustStock(
    restaurantId: string,
    ingredientId: string,
    dto: AdjustStockDto,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        // ------------------------------------------------
        // Find current stock
        // ------------------------------------------------

        const stock = await tx.restaurantStock.findUnique({
          where: {
            restaurantId_ingredientId: {
              restaurantId,
              ingredientId,
            },
          },
        });

        if (!stock) {
          throw new NotFoundException(
            'Restaurant stock not found for this ingredient',
          );
        }

        // ------------------------------------------------
        // Convert number to Prisma Decimal
        // ------------------------------------------------

        const quantityChange = new Prisma.Decimal(dto.quantityChange);

        // ------------------------------------------------
        // Zero adjustment is invalid
        // ------------------------------------------------

        if (quantityChange.eq(0)) {
          throw new BadRequestException('Quantity change cannot be zero');
        }

        // ------------------------------------------------
        // Negative adjustment cannot exceed stock
        // ------------------------------------------------

        if (
          quantityChange.lt(0) &&
          stock.quantityOnHand.lt(quantityChange.abs())
        ) {
          throw new BadRequestException(
            `Insufficient restaurant stock. Available: ${stock.quantityOnHand.toString()}, adjustment: ${quantityChange.abs().toString()}`,
          );
        }

        // ------------------------------------------------
        // Atomic update
        // ------------------------------------------------

        const updatedStock = await tx.restaurantStock.updateMany({
          where: {
            restaurantId,
            ingredientId,

            ...(quantityChange.lt(0)
              ? {
                  quantityOnHand: {
                    gte: quantityChange.abs(),
                  },
                }
              : {}),
          },

          data: {
            quantityOnHand: {
              increment: quantityChange,
            },
          },
        });

        if (updatedStock.count !== 1) {
          throw new BadRequestException('Unable to adjust restaurant stock');
        }

        // ------------------------------------------------
        // Create audit movement
        // ------------------------------------------------

        const movement = await tx.stockMovement.create({
          data: {
            locationType: 'RESTAURANT',
            locationId: restaurantId,
            ingredientId,
            movementType: 'ADJUSTMENT',
            quantityChange,
            referenceId: null,
            reason: dto.reason.trim(),
          },
        });

        // ------------------------------------------------
        // Fetch final stock
        // ------------------------------------------------

        const finalStock = await tx.restaurantStock.findUnique({
          where: {
            restaurantId_ingredientId: {
              restaurantId,
              ingredientId,
            },
          },
        });

        return {
          stock: finalStock,
          stockMovement: movement,
        };
      },

      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }
}
