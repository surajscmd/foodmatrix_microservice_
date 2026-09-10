import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

import { ReceiveWarehouseStockDto } from './dto/receive-warehouse-stock.dto.js';
import { AdjustWarehouseStockDto } from './dto/adjust-warehouse-stock.dto.js';
import { BulkReceiveWarehouseStockDto } from './dto/bulk-receive-warehouse-stock.dto.js';
import { CatalogGatewayService } from '../../utils/caltalog-gateway.service.js';

@Injectable()
export class WarehouseStockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogGatewayService: CatalogGatewayService,
  ) {}

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
  async findByWarehouse(warehouseId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [stocks, total] = await Promise.all([
      this.prisma.warehouseStock.findMany({
        where: {
          warehouseId,
        },

        skip,
        take: limit,

        orderBy: {
          updatedAt: 'desc',
        },
      }),

      this.prisma.warehouseStock.count({
        where: {
          warehouseId,
        },
      }),
    ]);

    // ------------------------------------------------
    // Fetch ingredient information from Catalog
    // ------------------------------------------------

    const ingredientIds = stocks.map((stock) => stock.ingredientId);

    const ingredients =
      ingredientIds.length > 0
        ? await this.catalogGatewayService.getBulkIngredients(ingredientIds)
        : [];

    // ------------------------------------------------
    // Create lookup map
    // ------------------------------------------------

    const ingredientMap = new Map(
      ingredients.map((ingredient) => [ingredient.id, ingredient]),
    );

    // ------------------------------------------------
    // Enrich warehouse stock
    // ------------------------------------------------

    const enrichedStocks = stocks.map((stock) => {
      const ingredient = ingredientMap.get(stock.ingredientId);

      return {
        ...stock,

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

    return {
      data: enrichedStocks,

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
      throw new NotFoundException(
        'Warehouse stock not found for this ingredient',
      );
    }

    // ------------------------------------------------
    // Fetch ingredient information from Catalog
    // ------------------------------------------------

    const ingredients = await this.catalogGatewayService.getBulkIngredients([
      ingredientId,
    ]);

    const ingredient = ingredients.find((item) => item.id === ingredientId);

    // ------------------------------------------------
    // Return stock + ingredient information
    // ------------------------------------------------

    return {
      ...stock,

      ingredient: ingredient
        ? {
            id: ingredient.id,
            name: ingredient.name,
            uom: ingredient.uom,
            isActive: ingredient.isActive,
          }
        : null,
    };
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
  // ======================================================
  // BULK RECEIVE WAREHOUSE STOCK
  //
  //
  // Bulk receive is used when multiple ingredients are received at once, for example from a supplier/purchase.
  //
  // WarehouseStock + quantity
  // ======================================================
  async bulkReceiveStock(dto: BulkReceiveWarehouseStockDto) {
    return this.prisma.$transaction(async (tx) => {
      if (dto.items.length === 0) {
        throw new BadRequestException('At least one ingredient is required');
      }

      // ------------------------------------------------
      // Prevent duplicate ingredients in the same request
      // ------------------------------------------------

      const ingredientIds = dto.items.map((item) => item.ingredientId);

      const uniqueIngredientIds = new Set(ingredientIds);

      if (uniqueIngredientIds.size !== ingredientIds.length) {
        throw new BadRequestException(
          'Duplicate ingredients are not allowed in one bulk receive request',
        );
      }

      // ------------------------------------------------
      // Validate quantities before changing anything
      // ------------------------------------------------

      for (const item of dto.items) {
        const quantity = new Prisma.Decimal(item.quantity);

        if (quantity.lte(0)) {
          throw new BadRequestException(
            `Quantity must be greater than zero for ingredient ${item.ingredientId}`,
          );
        }
      }

      const results = [];

      // ------------------------------------------------
      // Receive every ingredient
      // ------------------------------------------------

      for (const item of dto.items) {
        const quantity = new Prisma.Decimal(item.quantity);

        // ----------------------------------------------
        // Update warehouse stock
        // ----------------------------------------------

        const stock = await tx.warehouseStock.upsert({
          where: {
            warehouseId_ingredientId: {
              warehouseId: dto.warehouseId,
              ingredientId: item.ingredientId,
            },
          },

          create: {
            warehouseId: dto.warehouseId,
            ingredientId: item.ingredientId,
            quantityOnHand: quantity,
          },

          update: {
            quantityOnHand: {
              increment: quantity,
            },
          },
        });

        // ----------------------------------------------
        // Audit movement
        // ----------------------------------------------

        const movement = await tx.stockMovement.create({
          data: {
            locationType: 'WAREHOUSE',

            locationId: dto.warehouseId,

            ingredientId: item.ingredientId,

            movementType: 'PURCHASE',

            quantityChange: quantity,

            referenceId: item.referenceId ?? null,
          },
        });

        results.push({
          stock,
          stockMovement: movement,
        });
      }

      return results;
    });
  }
}
