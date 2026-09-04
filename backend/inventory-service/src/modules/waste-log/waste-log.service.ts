import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

import { CreateWasteLogDto } from './dto/create-waste-log.dto.js';

@Injectable()
export class WasteLogService {
  constructor(private readonly prisma: PrismaService) {}

  // ======================================================
  // CREATE WASTE
  //
  // Restaurant records wasted ingredient.
  //
  // RestaurantStock decreases
  // StockMovement = WASTE
  // WasteLog is created
  //
  // All operations happen in ONE transaction.
  // ======================================================

  async create(dto: CreateWasteLogDto) {
    if (dto.qty <= 0) {
      throw new BadRequestException('Waste quantity must be greater than zero');
    }

    if (!dto.reason?.trim()) {
      throw new BadRequestException('Waste reason is required');
    }

    return this.prisma.$transaction(
      async (tx) => {
        // ------------------------------------------------
        // Find restaurant stock
        // ------------------------------------------------

        const stock = await tx.restaurantStock.findUnique({
          where: {
            restaurantId_ingredientId: {
              restaurantId: dto.restaurantId,

              ingredientId: dto.ingredientId,
            },
          },
        });

        if (!stock) {
          throw new NotFoundException(
            'Restaurant stock not found for this ingredient',
          );
        }

        const wasteQty = new Prisma.Decimal(dto.qty);

        // ------------------------------------------------
        // Cannot waste more than available stock
        // ------------------------------------------------

        if (stock.quantityOnHand.lt(wasteQty)) {
          throw new BadRequestException(
            `Insufficient restaurant stock. Available: ${stock.quantityOnHand.toString()}, requested waste: ${wasteQty.toString()}`,
          );
        }

        // ------------------------------------------------
        // ATOMIC STOCK DECREASE
        // ------------------------------------------------

        const updatedStock = await tx.restaurantStock.updateMany({
          where: {
            restaurantId: dto.restaurantId,

            ingredientId: dto.ingredientId,

            quantityOnHand: {
              gte: wasteQty,
            },
          },

          data: {
            quantityOnHand: {
              decrement: wasteQty,
            },
          },
        });

        if (updatedStock.count !== 1) {
          throw new BadRequestException('Insufficient restaurant stock');
        }

        // ------------------------------------------------
        // CREATE STOCK MOVEMENT
        // ------------------------------------------------

        const movement = await tx.stockMovement.create({
          data: {
            locationType: 'RESTAURANT',

            locationId: dto.restaurantId,

            ingredientId: dto.ingredientId,

            movementType: 'WASTE',

            quantityChange: wasteQty.negated(),

            referenceId: null,
          },
        });

        // ------------------------------------------------
        // CREATE WASTE LOG
        // ------------------------------------------------

        const wasteLog = await tx.wasteLog.create({
          data: {
            restaurantId: dto.restaurantId,

            ingredientId: dto.ingredientId,

            qty: wasteQty,

            reason: dto.reason.trim(),
          },
        });

        // ------------------------------------------------
        // RETURN UPDATED DATA
        // ------------------------------------------------

        return {
          wasteLog,

          stockMovement: movement,

          stock: await tx.restaurantStock.findUnique({
            where: {
              restaurantId_ingredientId: {
                restaurantId: dto.restaurantId,

                ingredientId: dto.ingredientId,
              },
            },
          }),
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  // ======================================================
  // GET WASTE LOGS BY RESTAURANT
  // ======================================================

  async findByRestaurant(restaurantId: string) {
    return this.prisma.wasteLog.findMany({
      where: {
        restaurantId,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ======================================================
  // GET SINGLE WASTE LOG
  // ======================================================

  async findOne(id: string) {
    const wasteLog = await this.prisma.wasteLog.findUnique({
      where: {
        id,
      },
    });

    if (!wasteLog) {
      throw new NotFoundException('Waste log not found');
    }

    return wasteLog;
  }
}
