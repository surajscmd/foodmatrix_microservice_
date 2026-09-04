import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

import { ReceiveWarehouseStockDto } from './dto/receive-warehouse-stock.dto.js';
import { AdjustWarehouseStockDto } from './dto/adjust-warehouse-stock.dto.js';

@Injectable()
export class WarehouseStockService {
  constructor(private readonly prisma: PrismaService) {}

  // ======================================================
  // RECEIVE STOCK INTO WAREHOUSE
  //
  // This is used when stock physically arrives at the
  // warehouse, for example from a supplier/purchase.
  //
  // WarehouseStock + quantity
  // StockMovement PURCHASE + quantity
  //
  // Both happen in ONE transaction.
  // ======================================================

  async receiveStock(dto: ReceiveWarehouseStockDto) {
    const quantity = new Prisma.Decimal(dto.quantity);

    if (quantity.lte(0)) {
      throw new BadRequestException('Quantity must be greater than zero');
    }

    return this.prisma.$transaction(async (tx) => {
      // ------------------------------------------------
      // Add/increase warehouse stock
      // ------------------------------------------------

      const stock = await tx.warehouseStock.upsert({
        where: {
          warehouseId_ingredientId: {
            warehouseId: dto.warehouseId,

            ingredientId: dto.ingredientId,
          },
        },

        create: {
          warehouseId: dto.warehouseId,

          ingredientId: dto.ingredientId,

          quantityOnHand: quantity,
        },

        update: {
          quantityOnHand: {
            increment: quantity,
          },
        },
      });

      // ------------------------------------------------
      // Create immutable audit movement
      // ------------------------------------------------

      await tx.stockMovement.create({
        data: {
          locationType: 'WAREHOUSE',

          locationId: dto.warehouseId,

          ingredientId: dto.ingredientId,

          movementType: 'PURCHASE',

          quantityChange: quantity,

          referenceId: dto.referenceId,
        },
      });

      return stock;
    });
  }

  // ======================================================
  // GET WAREHOUSE STOCK
  //
  // Used by warehouse dashboard.
  // ======================================================

  async findByWarehouse(warehouseId: string) {
    return this.prisma.warehouseStock.findMany({
      where: {
        warehouseId,
      },

      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  // ======================================================
  // GET ONE INGREDIENT STOCK
  // ======================================================

  async findByWarehouseAndIngredient(
    warehouseId: string,
    ingredientId: string,
  ) {
    const stock = await this.prisma.warehouseStock.findUnique({
      where: {
        warehouseId_ingredientId: {
          warehouseId,
          ingredientId,
        },
      },
    });

    if (!stock) {
      throw new BadRequestException('Warehouse stock not found');
    }

    return stock;
  }

  // ======================================================
  // ADJUST WAREHOUSE STOCK
  //
  // Positive quantityChange = increase
  // Negative quantityChange = decrease
  //
  // Example:
  // +10 => 100 -> 110
  // -20 => 100 -> 80
  //
  // Creates StockMovement = ADJUSTMENT
  // ======================================================

  async adjustStock(
    warehouseId: string,
    ingredientId: string,
    dto: AdjustWarehouseStockDto,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        // ------------------------------------------------
        // Find warehouse stock
        // ------------------------------------------------

        const stock = await tx.warehouseStock.findUnique({
          where: {
            warehouseId_ingredientId: {
              warehouseId,
              ingredientId,
            },
          },
        });

        if (!stock) {
          throw new NotFoundException(
            'Warehouse stock not found for this ingredient',
          );
        }

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
            `Insufficient warehouse stock. Available: ${stock.quantityOnHand.toString()}, adjustment: ${quantityChange.abs().toString()}`,
          );
        }

        // ------------------------------------------------
        // Atomic stock adjustment
        // ------------------------------------------------

        const updatedStock = await tx.warehouseStock.updateMany({
          where: {
            warehouseId,
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
          throw new BadRequestException('Unable to adjust warehouse stock');
        }

        // ------------------------------------------------
        // Create audit movement
        // ------------------------------------------------

        const movement = await tx.stockMovement.create({
          data: {
            locationType: 'WAREHOUSE',
            locationId: warehouseId,
            ingredientId,
            movementType: 'ADJUSTMENT',
            quantityChange,
            referenceId: null,
            reason: dto.reason.trim(),
          },
        });

        // ------------------------------------------------
        // Get final stock
        // ------------------------------------------------

        const finalStock = await tx.warehouseStock.findUnique({
          where: {
            warehouseId_ingredientId: {
              warehouseId,
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
