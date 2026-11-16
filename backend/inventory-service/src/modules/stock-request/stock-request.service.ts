import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, StockRequestStatus, TransferStatus } from '@prisma/client';

import { CreateStockRequestDto } from './dto/create-stock-request.dto.js';
import { ApproveStockRequestDto } from './dto/approve-stock-request.dto.js';
import { RejectStockRequestDto } from './dto/reject-stock-request.dto.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { UpdateStockRequestDto } from './dto/update-stock-request.dto.js';
import { CatalogGatewayService } from '../../utils/caltalog-gateway.service.js';

@Injectable()
export class StockRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogGatewayService: CatalogGatewayService,
  ) {}

  // ======================================================
  // CREATE STOCK REQUEST
  //
  // RESTAURANT MANAGER
  //
  // Restaurant requests ingredients from its assigned
  // warehouse.
  //
  // REQUESTED
  // ======================================================

  async create(dto: CreateStockRequestDto, requestedBy: string) {
    if (dto.items.length === 0) {
      throw new BadRequestException('At least one ingredient is required');
    }

    // ----------------------------------------------------
    // Prevent duplicate ingredients inside one request
    // ----------------------------------------------------

    const ingredientIds = dto.items.map((item) => item.ingredientId);

    const uniqueIngredientIds = new Set(ingredientIds);

    if (uniqueIngredientIds.size !== ingredientIds.length) {
      throw new BadRequestException(
        'Duplicate ingredients are not allowed in one stock request',
      );
    }

    // ----------------------------------------------------
    // Prevent duplicate ACTIVE requests
    // ----------------------------------------------------

    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${'stock-request:' + dto.restaurantId}, 0))`;
      const existingActiveItems = await tx.stockRequestItem.findMany({
        where: {
          ingredientId: {
            in: ingredientIds,
          },

          stockRequest: {
            restaurantId: dto.restaurantId,

            status: {
              in: [StockRequestStatus.REQUESTED, StockRequestStatus.APPROVED],
            },
          },
        },

        select: {
          ingredientId: true,

          stockRequest: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

      if (existingActiveItems.length > 0) {
        const duplicateIngredients = [
          ...new Set(existingActiveItems.map((item) => item.ingredientId)),
        ];

        throw new ConflictException(
          `Active stock request already exists for ingredient(s): ${duplicateIngredients.join(', ')}`,
        );
      }

      // ----------------------------------------------------
      // CREATE REQUEST
      // ----------------------------------------------------

      const stockRequest = await tx.stockRequest.create({
        data: {
          restaurantId: dto.restaurantId,
          warehouseId: dto.warehouseId,
          requestedBy,
          reason: dto.reason,
          status: StockRequestStatus.REQUESTED,

          items: {
            create: dto.items.map((item) => ({
              ingredientId: item.ingredientId,
              requestedQty: new Prisma.Decimal(item.requestedQty),
            })),
          },
        },

        include: {
          items: true,
        },
      });

      // ----------------------------------------------------
      // PUBLISH KAFKA EVENT
      // ----------------------------------------------------

      await tx.inventoryOutbox.create({
        data: {
          topic: 'inventory.stock-request-created',
          payload: {
            stockRequestId: stockRequest.id,
            restaurantId: stockRequest.restaurantId,
            warehouseId: stockRequest.warehouseId,
            requestedBy: stockRequest.requestedBy,
            itemCount: stockRequest.items.length,
          },
        },
      });

      return stockRequest;
    });
  }

  // ======================================================
  // UPDATE STOCK REQUEST
  //
  // RESTAURANT MANAGER
  //
  // Only REQUESTED requests can be edited.
  //
  // Editable:
  // - reason
  // - ingredients
  // - requested quantities
  //
  // REQUESTED -> REQUESTED
  // ======================================================

  async update(requestId: string, dto: UpdateStockRequestDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      // ------------------------------------------------
      // Fetch request
      // ------------------------------------------------

      const request = await tx.stockRequest.findUnique({
        where: {
          id: requestId,
        },

        include: {
          items: true,
        },
      });

      if (!request) {
        throw new NotFoundException('Stock request not found');
      }

      // ------------------------------------------------
      // Only request creator can edit
      // ------------------------------------------------

      if (request.requestedBy !== userId) {
        throw new ConflictException('You cannot edit this stock request');
      }

      // ------------------------------------------------
      // Only REQUESTED can be edited
      // ------------------------------------------------

      if (request.status !== StockRequestStatus.REQUESTED) {
        throw new ConflictException(
          `Cannot edit request in ${request.status} state`,
        );
      }

      // ------------------------------------------------
      // Validate items
      // ------------------------------------------------

      if (dto.items.length === 0) {
        throw new BadRequestException('At least one ingredient is required');
      }

      const ingredientIds = dto.items.map((item) => item.ingredientId);

      const uniqueIngredientIds = new Set(ingredientIds);

      if (uniqueIngredientIds.size !== ingredientIds.length) {
        throw new BadRequestException(
          'Duplicate ingredients are not allowed in one stock request',
        );
      }

      // ------------------------------------------------
      // Replace existing request items
      // ------------------------------------------------

      await tx.stockRequestItem.deleteMany({
        where: {
          stockRequestId: requestId,
        },
      });

      await tx.stockRequestItem.createMany({
        data: dto.items.map((item) => ({
          stockRequestId: requestId,
          ingredientId: item.ingredientId,
          requestedQty: new Prisma.Decimal(item.requestedQty),
        })),
      });

      // ------------------------------------------------
      // Update request metadata
      // ------------------------------------------------

      await tx.stockRequest.update({
        where: {
          id: requestId,
        },

        data: {
          reason: dto.reason,
        },
      });

      // ------------------------------------------------
      // Return updated request
      // ------------------------------------------------

      return tx.stockRequest.findUnique({
        where: {
          id: requestId,
        },

        include: {
          items: true,
        },
      });
    });
  }

  // ======================================================
  // GET ONE
  //
  // COMMON
  // ======================================================

  async findOwner(id: string) {
    const request = await this.prisma.stockRequest.findUnique({
      where: { id },
      select: { restaurantId: true, requestedBy: true },
    });
    if (!request) throw new NotFoundException('Stock request not found');
    return request;
  }

  async findById(id: string) {
    const request = await this.prisma.stockRequest.findUnique({
      where: {
        id,
      },

      include: {
        items: true,

        transfers: {
          include: {
            items: true,
            shipment: true,
            discrepancies: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Stock request not found');
    }

    // ------------------------------------------------------
    // COLLECT INGREDIENT IDS
    // ------------------------------------------------------

    const ingredientIds = [
      ...new Set(request.items.map((item) => item.ingredientId)),
    ];

    // ------------------------------------------------------
    // GET INGREDIENT DETAILS FROM CATALOG
    // ------------------------------------------------------

    const ingredients =
      ingredientIds.length > 0
        ? await this.catalogGatewayService.getBulkIngredients(ingredientIds)
        : [];

    const ingredientMap = new Map(
      ingredients.map((ingredient) => [ingredient.id, ingredient]),
    );

    // ------------------------------------------------------
    // ENRICH REQUEST ITEMS
    // ------------------------------------------------------

    const items = request.items.map((item) => ({
      ...item,
      ingredient: ingredientMap.get(item.ingredientId) ?? null,
    }));

    return {
      ...request,
      items,
    };
  }

  // ======================================================
  // GET RESTAURANT REQUESTS
  //
  // RESTAURANT MANAGER
  // ======================================================

  async findByRestaurant(
    restaurantId: string,
    status?: StockRequestStatus,
    page = 1,
    limit = 10,
  ) {
    const skip = (page - 1) * limit;

    const where = {
      restaurantId,
      ...(status ? { status } : {}),
    };

    const [stockRequests, total] = await this.prisma.$transaction([
      this.prisma.stockRequest.findMany({
        where,

        include: {
          items: true,

          transfers: {
            select: {
              id: true,
              status: true,
              fromWarehouseId: true,
              toRestaurantId: true,
              createdAt: true,
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },

        skip,
        take: limit,
      }),

      this.prisma.stockRequest.count({
        where,
      }),
    ]);

    // ------------------------------------------------------
    // COLLECT ALL INGREDIENT IDS FROM ALL REQUEST ITEMS
    // ------------------------------------------------------

    const ingredientIds = [
      ...new Set(
        stockRequests.flatMap((request) =>
          request.items.map((item) => item.ingredientId),
        ),
      ),
    ];

    // ------------------------------------------------------
    // GET INGREDIENT DETAILS FROM CATALOG SERVICE
    // ------------------------------------------------------

    const ingredients =
      ingredientIds.length > 0
        ? await this.catalogGatewayService.getBulkIngredients(ingredientIds)
        : [];

    const ingredientMap = new Map(
      ingredients.map((ingredient) => [ingredient.id, ingredient]),
    );

    // ------------------------------------------------------
    // ENRICH REQUEST ITEMS
    // ------------------------------------------------------

    const data = stockRequests.map((request) => ({
      ...request,

      items: request.items.map((item) => ({
        ...item,

        ingredient: ingredientMap.get(item.ingredientId) ?? null,
      })),
    }));

    // ------------------------------------------------------
    // RETURN PAGINATED RESPONSE
    // ------------------------------------------------------

    return {
      data,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ======================================================
  // GET WAREHOUSE REQUESTS
  //
  // WAREHOUSE ADMIN
  //
  // Returns requests belonging to this warehouse.
  // ======================================================

  async findByWarehouse(
    warehouseId: string,
    status?: StockRequestStatus,
    page = 1,
    limit = 10,
  ) {
    const skip = (page - 1) * limit;

    const where = {
      warehouseId,
      ...(status ? { status } : {}),
    };

    const [stockRequests, total] = await this.prisma.$transaction([
      this.prisma.stockRequest.findMany({
        where,

        include: {
          items: true,
        },

        orderBy: {
          createdAt: 'desc',
        },

        skip,
        take: limit,
      }),

      this.prisma.stockRequest.count({
        where,
      }),
    ]);

    // ------------------------------------------------------
    // COLLECT INGREDIENT IDS
    // ------------------------------------------------------

    const ingredientIds = [
      ...new Set(
        stockRequests.flatMap((request) =>
          request.items.map((item) => item.ingredientId),
        ),
      ),
    ];

    // ------------------------------------------------------
    // GET INGREDIENTS FROM CATALOG SERVICE
    // ------------------------------------------------------

    const ingredients =
      ingredientIds.length > 0
        ? await this.catalogGatewayService.getBulkIngredients(ingredientIds)
        : [];

    const ingredientMap = new Map(
      ingredients.map((ingredient) => [ingredient.id, ingredient]),
    );

    // ------------------------------------------------------
    // ENRICH ITEMS
    // ------------------------------------------------------

    const data = stockRequests.map((request) => ({
      ...request,

      items: request.items.map((item) => ({
        ...item,
        ingredient: ingredientMap.get(item.ingredientId) ?? null,
      })),
    }));

    return {
      data,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ======================================================
  // GET ALL
  //
  // INTERNAL / ADMIN
  // ======================================================

  async findAll(status?: StockRequestStatus, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const where = status
      ? {
          status,
        }
      : undefined;

    const [stockRequests, total] = await this.prisma.$transaction([
      this.prisma.stockRequest.findMany({
        where,

        include: {
          items: true,
        },

        orderBy: {
          createdAt: 'desc',
        },

        skip,
        take: limit,
      }),

      this.prisma.stockRequest.count({
        where,
      }),
    ]);

    // ------------------------------------------------------
    // COLLECT INGREDIENT IDS
    // ------------------------------------------------------

    const ingredientIds = [
      ...new Set(
        stockRequests.flatMap((request) =>
          request.items.map((item) => item.ingredientId),
        ),
      ),
    ];

    // ------------------------------------------------------
    // GET INGREDIENT DETAILS FROM CATALOG
    // ------------------------------------------------------

    const ingredients =
      ingredientIds.length > 0
        ? await this.catalogGatewayService.getBulkIngredients(ingredientIds)
        : [];

    const ingredientMap = new Map(
      ingredients.map((ingredient) => [ingredient.id, ingredient]),
    );

    // ------------------------------------------------------
    // ENRICH ITEMS
    // ------------------------------------------------------

    const data = stockRequests.map((request) => ({
      ...request,

      items: request.items.map((item) => ({
        ...item,
        ingredient: ingredientMap.get(item.ingredientId) ?? null,
      })),
    }));

    return {
      data,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  // ======================================================
  // delete request
  //
  // retorent can delete requet
  // ======================================================
  async deleteByRestaurant(
    requestId: string,
    restaurantId: string,
    userId: string,
  ) {
    const request = await this.prisma.stockRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        restaurantId: true,
        requestedBy: true,
        status: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Stock request not found');
    }

    if (request.restaurantId !== restaurantId) {
      throw new BadRequestException(
        'Stock request does not belong to this restaurant',
      );
    }

    if (request.requestedBy !== userId) {
      throw new BadRequestException(
        'You can only delete your own stock request',
      );
    }

    if (request.status !== StockRequestStatus.REQUESTED) {
      throw new BadRequestException(
        `Cannot delete stock request in ${request.status} status`,
      );
    }

    await this.prisma.stockRequest.delete({
      where: {
        id: requestId,
      },
    });

    return {
      message: 'Stock request deleted successfully',
      requestId,
    };
  }

  // ======================================================
  // APPROVE STOCK REQUEST
  //
  // WAREHOUSE ADMIN
  //
  // REQUESTED -> APPROVED
  //
  // Example:
  //
  // Restaurant requests = 40 kg
  // Warehouse approves  = 35 kg
  //
  // requestedQty = 40
  // approvedQty  = 35
  //
  // IMPORTANT:
  // Warehouse stock is NOT deducted here.
  //
  // A StockTransfer is created.
  // Actual warehouse deduction happens during SHIP.
  // ======================================================

  async approve(
    requestId: string,
    dto: ApproveStockRequestDto,
    approvedBy: string,
    warehouseId: string,
  ) {
    const transfer = await this.prisma.$transaction(async (tx) => {
      // ------------------------------------------------
      // Fetch request
      // ------------------------------------------------

      const request = await tx.stockRequest.findUnique({
        where: {
          id: requestId,
        },

        include: {
          items: true,
        },
      });

      if (!request) {
        throw new NotFoundException('Stock request not found');
      }

      // ------------------------------------------------
      // Make sure this warehouse owns the request
      // ------------------------------------------------

      if (request.warehouseId !== warehouseId) {
        throw new ConflictException(
          'This stock request belongs to a different warehouse',
        );
      }

      // ------------------------------------------------
      // Validate current state
      // ------------------------------------------------

      if (request.status !== StockRequestStatus.REQUESTED) {
        throw new ConflictException(
          `Cannot approve request in ${request.status} state`,
        );
      }

      // ------------------------------------------------
      // Request must have items
      // ------------------------------------------------

      if (request.items.length === 0) {
        throw new BadRequestException('Stock request has no items');
      }

      // ------------------------------------------------
      // Make a map of requested items
      // ------------------------------------------------

      const requestedMap = new Map(
        request.items.map((item) => [item.ingredientId, item]),
      );

      // ------------------------------------------------
      // Validate approval input
      // ------------------------------------------------

      const approvalMap = new Map<string, Prisma.Decimal>();

      for (const item of dto.items) {
        if (approvalMap.has(item.ingredientId)) {
          throw new BadRequestException(
            `Duplicate ingredient ${item.ingredientId}`,
          );
        }

        const requestedItem = requestedMap.get(item.ingredientId);

        if (!requestedItem) {
          throw new BadRequestException(
            `Ingredient ${item.ingredientId} was not part of this request`,
          );
        }

        const approvedQty = new Prisma.Decimal(item.approvedQty);

        if (approvedQty.lte(0)) {
          throw new BadRequestException(
            `Approved quantity must be greater than zero for ingredient ${item.ingredientId}`,
          );
        }

        if (approvedQty.gt(requestedItem.requestedQty)) {
          throw new BadRequestException(
            `Approved quantity for ingredient ${item.ingredientId} cannot exceed requested quantity`,
          );
        }

        approvalMap.set(item.ingredientId, approvedQty);
      }

      // ------------------------------------------------
      // At least one item must be approved
      // ------------------------------------------------

      if (approvalMap.size === 0) {
        throw new BadRequestException('At least one item must be approved');
      }

      // ------------------------------------------------
      // Check warehouse stock
      // ------------------------------------------------

      for (const [ingredientId, approvedQty] of approvalMap) {
        const warehouseStock = await tx.warehouseStock.findUnique({
          where: {
            warehouseId_ingredientId: {
              warehouseId,
              ingredientId,
            },
          },
        });

        if (!warehouseStock) {
          throw new BadRequestException(
            `No warehouse stock found for ingredient ${ingredientId}`,
          );
        }

        if (warehouseStock.quantityOnHand.lt(approvedQty)) {
          throw new BadRequestException(
            `Insufficient warehouse stock for ingredient ${ingredientId}. Available: ${warehouseStock.quantityOnHand.toString()}, requested approval: ${approvedQty.toString()}`,
          );
        }
      }

      const approvedAt = new Date();

      // ------------------------------------------------
      // Update request items
      // ------------------------------------------------

      for (const requestItem of request.items) {
        const approvedQty =
          approvalMap.get(requestItem.ingredientId) ?? new Prisma.Decimal(0);

        await tx.stockRequestItem.update({
          where: {
            id: requestItem.id,
          },

          data: {
            approvedQty,
          },
        });
      }

      // ------------------------------------------------
      // Create transfer
      // ------------------------------------------------

      const transferItems = request.items
        .filter((item) => {
          const approvedQty = approvalMap.get(item.ingredientId);

          return approvedQty !== undefined && approvedQty.gt(0);
        })
        .map((item) => {
          const approvedQty = approvalMap.get(item.ingredientId)!;

          return {
            ingredientId: item.ingredientId,
            requestedQty: item.requestedQty,
            approvedQty,
          };
        });

      if (transferItems.length === 0) {
        throw new BadRequestException(
          'No approved items available for transfer',
        );
      }

      const transfer = await tx.stockTransfer.create({
        data: {
          stockRequestId: request.id,

          fromWarehouseId: warehouseId,

          toRestaurantId: request.restaurantId,

          status: TransferStatus.APPROVED,

          requestedBy: request.requestedBy,

          approvedBy,

          requestedAt: request.requestedAt,

          approvedAt,

          items: {
            create: transferItems,
          },
        },

        include: {
          items: true,
        },
      });

      // ------------------------------------------------
      // Update request
      // ------------------------------------------------

      const requestState = await tx.stockRequest.updateMany({
        where: {
          id: request.id,
          status: StockRequestStatus.REQUESTED,
        },

        data: {
          status: StockRequestStatus.APPROVED,

          approvedBy,

          approvedAt,
        },
      });

      if (requestState.count !== 1) {
        throw new ConflictException('Stock request has already been processed');
      }

      await tx.inventoryOutbox.create({
        data: {
          topic: 'inventory.stock-request-approved',
          payload: {
            stockRequestId: requestId,
            restaurantId: transfer.toRestaurantId,
            warehouseId: transfer.fromWarehouseId,

            items: transfer.items.map((item) => ({
              ingredientId: item.ingredientId,
              approvedQty: item.approvedQty?.toJSON() ?? null,
            })),
          },
        },
      });
      return transfer;
    });

    return transfer;
  }

  // ======================================================
  // REJECT STOCK REQUEST
  //
  // WAREHOUSE ADMIN
  //
  // REQUESTED -> REJECTED
  // ======================================================

  async reject(
    requestId: string,
    dto: RejectStockRequestDto,
    rejectedBy: string,
    warehouseId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.stockRequest.findUnique({
        where: {
          id: requestId,
        },
      });

      if (!request) {
        throw new NotFoundException('Stock request not found');
      }

      // ------------------------------------------------
      // Verify warehouse ownership
      // ------------------------------------------------

      if (request.warehouseId !== warehouseId) {
        throw new ConflictException(
          'This stock request belongs to a different warehouse',
        );
      }

      // ------------------------------------------------
      // Atomic state transition
      // ------------------------------------------------

      const result = await tx.stockRequest.updateMany({
        where: {
          id: requestId,
          status: StockRequestStatus.REQUESTED,
        },

        data: {
          status: StockRequestStatus.REJECTED,

          rejectedBy,

          rejectedAt: new Date(),

          rejectionReason: dto.reason,
        },
      });

      if (result.count !== 1) {
        throw new ConflictException('Stock request has already been processed');
      }

      return tx.stockRequest.findUnique({
        where: {
          id: requestId,
        },

        include: {
          items: true,
        },
      });
    });
  }

  // ======================================================
  // CANCEL STOCK REQUEST
  //
  // RESTAURANT MANAGER
  //
  // REQUESTED -> CANCELLED
  // ======================================================

  async cancel(requestId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.stockRequest.findUnique({
        where: {
          id: requestId,
        },
      });

      if (!request) {
        throw new NotFoundException('Stock request not found');
      }

      // ------------------------------------------------
      // Only request creator can cancel
      // ------------------------------------------------

      if (request.requestedBy !== userId) {
        throw new ConflictException('You cannot cancel this stock request');
      }

      // ------------------------------------------------
      // Only REQUESTED can be cancelled
      // ------------------------------------------------

      const result = await tx.stockRequest.updateMany({
        where: {
          id: requestId,
          status: StockRequestStatus.REQUESTED,
        },

        data: {
          status: StockRequestStatus.CANCELLED,
        },
      });

      if (result.count !== 1) {
        throw new ConflictException(
          `Cannot cancel request because it is already ${request.status}`,
        );
      }

      return tx.stockRequest.findUnique({
        where: {
          id: requestId,
        },

        include: {
          items: true,
        },
      });
    });
  }
  // ======================================================
  // CREATE STOCK REQUEST FROM LOW STOCK
  //
  // RESTAURANT MANAGER
  //
  // Finds:
  // quantityOnHand <= reorderLevel
  //
  // Uses:
  // reorderQuantity
  //
  // Creates ONE stock request containing all
  // low-stock ingredients.
  //
  // ======================================================

  async createFromLowStock(
    restaurantId: string,
    warehouseId: string,
    requestedBy: string,
  ) {
    const lowStockItems = await this.prisma.$queryRaw<
      Array<{
        ingredientId: string;
        quantityOnHand: unknown;
        reorderLevel: unknown;
        reorderQuantity: unknown;
      }>
    >`
    SELECT
      "ingredientId",
      "quantityOnHand",
      "reorderLevel",
      "reorderQuantity"
    FROM "RestaurantStock"
    WHERE "restaurantId" = ${restaurantId}
      AND "quantityOnHand" <= "reorderLevel"
      AND "reorderQuantity" > 0
    ORDER BY "quantityOnHand" ASC
  `;

    if (lowStockItems.length === 0) {
      throw new BadRequestException(
        'No low stock ingredients found for this restaurant',
      );
    }

    // Get ingredients that already have an active stock request
    const existingActiveItems = await this.prisma.stockRequestItem.findMany({
      where: {
        ingredientId: {
          in: lowStockItems.map((item) => item.ingredientId),
        },
        stockRequest: {
          restaurantId,
          status: {
            in: [StockRequestStatus.REQUESTED, StockRequestStatus.APPROVED],
          },
        },
      },
      select: {
        ingredientId: true,
      },
    });

    const existingIngredientIds = new Set(
      existingActiveItems.map((item) => item.ingredientId),
    );

    // Only create requests for ingredients that do not already
    // have an active REQUESTED/APPROVED stock request.
    const newLowStockItems = lowStockItems.filter(
      (item) => !existingIngredientIds.has(item.ingredientId),
    );

    if (newLowStockItems.length === 0) {
      throw new BadRequestException(
        'All low stock ingredients already have active stock requests',
      );
    }

    return this.create(
      {
        restaurantId,
        warehouseId,
        reason: 'Automatic replenishment request generated from low stock',
        items: newLowStockItems.map((item) => ({
          ingredientId: item.ingredientId,
          requestedQty: Number(item.reorderQuantity),
        })),
      },
      requestedBy,
    );
  }

  // ======================================================
  // GET LOW STOCK INGREDIENTS
  //
  // RESTAURANT MANAGER
  //
  // Finds:
  // quantityOnHand <= reorderLevel
  //
  // Uses:
  // reorderQuantity
  //
  // Does NOT create a stock request.
  //
  // ======================================================
  async findLowStock(restaurantId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const lowStockItems = await this.prisma.$queryRaw<
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
      "id",
      "restaurantId",
      "ingredientId",
      "quantityOnHand",
      "reorderLevel",
      "reorderQuantity",
      "updatedAt"
    FROM "RestaurantStock"
    WHERE "restaurantId" = ${restaurantId}
      AND "quantityOnHand" <= "reorderLevel"
      AND "reorderQuantity" > 0
    ORDER BY "quantityOnHand" ASC
    OFFSET ${skip}
    LIMIT ${limit}
  `;

    const totalResult = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) AS count
    FROM "RestaurantStock"
    WHERE "restaurantId" = ${restaurantId}
      AND "quantityOnHand" <= "reorderLevel"
      AND "reorderQuantity" > 0
  `;

    const total = Number(totalResult[0]?.count ?? 0);

    // ------------------------------------------------------
    // GET INGREDIENT DETAILS FROM CATALOG
    // ------------------------------------------------------

    const ingredientIds = [
      ...new Set(lowStockItems.map((item) => item.ingredientId)),
    ];

    const ingredients =
      ingredientIds.length > 0
        ? await this.catalogGatewayService.getBulkIngredients(ingredientIds)
        : [];

    const ingredientMap = new Map(
      ingredients.map((ingredient) => [ingredient.id, ingredient]),
    );

    // ------------------------------------------------------
    // ENRICH LOW STOCK ITEMS
    // ------------------------------------------------------

    const data = lowStockItems.map((item) => ({
      ...item,
      ingredient: ingredientMap.get(item.ingredientId) ?? null,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
