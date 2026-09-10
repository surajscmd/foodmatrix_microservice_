import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, StockRequestStatus, TransferStatus } from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

import { CreateShipmentDto } from './dto/create-shipment.dto.js';
import { ShipTransferDto } from './dto/ship-transfer.dto.js';
import { ReceiveTransferDto } from './dto/receive-transfer.dto.js';
import { ResolveDiscrepancyDto } from './dto/resolve-discrepancy.dto.js';
import { CatalogGatewayService } from '../../utils/caltalog-gateway.service.js';

@Injectable()
export class StockTransferService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogGatewayService: CatalogGatewayService,
  ) {}

  // ======================================================
  // COMMON
  // ======================================================

  // ------------------------------------------------------
  // GET SINGLE TRANSFER
  // ------------------------------------------------------

  async findById(id: string) {
    const transfer = await this.prisma.stockTransfer.findUnique({
      where: {
        id,
      },

      include: {
        items: true,
        shipment: true,
        discrepancies: true,

        stockRequest: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!transfer) {
      throw new NotFoundException('Stock transfer not found');
    }

    // ------------------------------------------------------
    // COLLECT INGREDIENT IDS
    // ------------------------------------------------------

    const ingredientIds = [
      ...new Set(transfer.items.map((item) => item.ingredientId)),
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
    // ENRICH TRANSFER ITEMS
    // ------------------------------------------------------

    return {
      ...transfer,

      items: transfer.items.map((item) => ({
        ...item,
        ingredient: ingredientMap.get(item.ingredientId) ?? null,
      })),

      // ----------------------------------------------------
      // ENRICH STOCK REQUEST ITEMS TOO
      // ----------------------------------------------------

      stockRequest: transfer.stockRequest
        ? {
            ...transfer.stockRequest,

            items: transfer.stockRequest.items.map((item) => ({
              ...item,
              ingredient: ingredientMap.get(item.ingredientId) ?? null,
            })),
          }
        : null,
    };
  }

  // ======================================================
  // WAREHOUSE
  // ======================================================

  // ------------------------------------------------------
  // GET OUTGOING TRANSFERS
  // ------------------------------------------------------

  async findByWarehouse(
    warehouseId: string,
    status?: TransferStatus,
    page = 1,
    limit = 10,
  ) {
    const skip = (page - 1) * limit;

    const where = {
      fromWarehouseId: warehouseId,
      ...(status ? { status } : {}),
    };

    const [transfers, total] = await this.prisma.$transaction([
      this.prisma.stockTransfer.findMany({
        where,
        include: {
          items: true,
          shipment: true,
          discrepancies: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),

      this.prisma.stockTransfer.count({
        where,
      }),
    ]);

    const ingredientIds = [
      ...new Set(
        transfers.flatMap((transfer) =>
          transfer.items.map((item) => item.ingredientId),
        ),
      ),
    ];

    const ingredients =
      ingredientIds.length > 0
        ? await this.catalogGatewayService.getBulkIngredients(ingredientIds)
        : [];

    const ingredientMap = new Map(
      ingredients.map((ingredient) => [ingredient.id, ingredient]),
    );

    const data = transfers.map((transfer) => ({
      ...transfer,

      items: transfer.items.map((item) => ({
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
  // RESTAURANT
  // ======================================================

  // ------------------------------------------------------
  // GET INCOMING TRANSFERS
  // ------------------------------------------------------

  async findByRestaurant(
    restaurantId: string,
    status?: TransferStatus,
    page = 1,
    limit = 10,
  ) {
    const skip = (page - 1) * limit;

    const where = {
      toRestaurantId: restaurantId,
      ...(status ? { status } : {}),
    };

    const [transfers, total] = await this.prisma.$transaction([
      this.prisma.stockTransfer.findMany({
        where,

        include: {
          items: true,
          shipment: true,

          stockRequest: {
            select: {
              id: true,
              restaurantId: true,
              warehouseId: true,
              status: true,
              requestedAt: true,
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },

        skip,
        take: limit,
      }),

      this.prisma.stockTransfer.count({
        where,
      }),
    ]);

    // ------------------------------------------------------
    // COLLECT INGREDIENT IDS
    // ------------------------------------------------------

    const ingredientIds = [
      ...new Set(
        transfers.flatMap((transfer) =>
          transfer.items.map((item) => item.ingredientId),
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
    // ENRICH TRANSFER ITEMS
    // ------------------------------------------------------

    const data = transfers.map((transfer) => ({
      ...transfer,

      items: transfer.items.map((item) => ({
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
  // PICKING
  // ======================================================

  // ------------------------------------------------------
  // APPROVED -> PICKING
  // ------------------------------------------------------

  async startPicking(transferId: string, warehouseUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({
        where: {
          id: transferId,
        },
      });

      if (!transfer) {
        throw new NotFoundException('Stock transfer not found');
      }

      if (transfer.status !== TransferStatus.APPROVED) {
        throw new ConflictException(
          `Cannot start picking from ${transfer.status} state`,
        );
      }

      // warehouseUserId is intentionally accepted here for
      // authorization/audit at controller/auth layer.
      // Your current Prisma schema has no pickedBy field.
      void warehouseUserId;

      const updated = await tx.stockTransfer.updateMany({
        where: {
          id: transferId,
          status: TransferStatus.APPROVED,
        },

        data: {
          status: TransferStatus.PICKING,
        },
      });

      if (updated.count !== 1) {
        throw new ConflictException('Transfer has already been processed');
      }

      return tx.stockTransfer.findUnique({
        where: {
          id: transferId,
        },

        include: {
          items: true,
        },
      });
    });
  }

  // ======================================================
  // READY TO SHIP
  // ======================================================

  // ------------------------------------------------------
  // PICKING -> READY_TO_SHIP
  // ------------------------------------------------------

  async readyToShip(transferId: string) {
    const transfer = await this.prisma.stockTransfer.findUnique({
      where: {
        id: transferId,
      },

      include: {
        items: true,
      },
    });

    if (!transfer) {
      throw new NotFoundException('Stock transfer not found');
    }

    if (transfer.status !== TransferStatus.PICKING) {
      throw new ConflictException(
        `Cannot mark transfer ready from ${transfer.status} state`,
      );
    }

    if (transfer.items.length === 0) {
      throw new BadRequestException('Transfer has no items');
    }

    for (const item of transfer.items) {
      if (!item.approvedQty || item.approvedQty.lte(0)) {
        throw new BadRequestException(
          `Invalid approved quantity for ingredient ${item.ingredientId}`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.stockTransfer.updateMany({
        where: {
          id: transferId,
          status: TransferStatus.PICKING,
        },

        data: {
          status: TransferStatus.READY_TO_SHIP,
        },
      });

      if (updated.count !== 1) {
        throw new ConflictException('Transfer has already been processed');
      }

      return tx.stockTransfer.findUnique({
        where: {
          id: transferId,
        },

        include: {
          items: true,
          shipment: true,
        },
      });
    });
  }

  // ======================================================
  // SHIPMENT
  // ======================================================

  // ------------------------------------------------------
  // CREATE SHIPMENT
  // ------------------------------------------------------

  async createShipment(transferId: string, dto: CreateShipmentDto) {
    const transfer = await this.prisma.stockTransfer.findUnique({
      where: {
        id: transferId,
      },
    });

    if (!transfer) {
      throw new NotFoundException('Stock transfer not found');
    }

    if (transfer.status !== TransferStatus.READY_TO_SHIP) {
      throw new ConflictException(
        `Cannot create shipment while transfer is ${transfer.status}`,
      );
    }

    const existingShipment = await this.prisma.shipment.findUnique({
      where: {
        transferId,
      },
    });

    if (existingShipment) {
      throw new ConflictException('Shipment already exists for this transfer');
    }

    try {
      return await this.prisma.shipment.create({
        data: {
          transferId,

          carrierName: dto.carrierName,

          trackingNumber: dto.trackingNumber,

          shipperName: dto.dispatcherName,

          shipperPhone: dto.dispatcherPhone,

          driverName: dto.driverName,

          driverPhone: dto.driverPhone,

          vehicleNumber: dto.vehicleNumber,

          vehicleType: dto.vehicleType,

          dispatchLocation: dto.dispatchLocation,

          deliveryLocation: dto.deliveryLocation,

          estimatedArrival: dto.estimatedArrival
            ? new Date(dto.estimatedArrival)
            : undefined,

          notes: dto.notes,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Shipment already exists for this transfer',
        );
      }

      throw error;
    }
  }

  // ======================================================
  // SHIP
  // ======================================================

  // ------------------------------------------------------
  // READY_TO_SHIP -> SHIPPED
  //
  // Warehouse stock:
  //      - shippedQty
  //
  // Transit:
  //      + shippedQty
  //
  // Movement:
  //      TRANSFER_OUT -shippedQty
  // ------------------------------------------------------

  async ship(transferId: string, dto: ShipTransferDto, shippedBy: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const transfer = await tx.stockTransfer.findUnique({
          where: {
            id: transferId,
          },

          include: {
            items: true,
            shipment: true,
          },
        });

        if (!transfer) {
          throw new NotFoundException('Stock transfer not found');
        }

        if (transfer.status !== TransferStatus.READY_TO_SHIP) {
          throw new ConflictException(
            `Cannot ship transfer in ${transfer.status} state`,
          );
        }

        if (!transfer.shipment) {
          throw new BadRequestException(
            'Shipment must be created before shipping',
          );
        }

        if (dto.items.length === 0) {
          throw new BadRequestException(
            'At least one transfer item is required',
          );
        }

        if (dto.items.length !== transfer.items.length) {
          throw new BadRequestException(
            'All transfer items must be included when shipping',
          );
        }

        const transferItemMap = new Map(
          transfer.items.map((item) => [item.id, item]),
        );

        const submittedItemIds = new Set<string>();

        for (const inputItem of dto.items) {
          if (submittedItemIds.has(inputItem.transferItemId)) {
            throw new BadRequestException(
              `Duplicate transfer item ${inputItem.transferItemId}`,
            );
          }

          submittedItemIds.add(inputItem.transferItemId);

          const transferItem = transferItemMap.get(inputItem.transferItemId);

          if (!transferItem) {
            throw new BadRequestException(
              `Transfer item ${inputItem.transferItemId} does not belong to this transfer`,
            );
          }

          const shippedQty = new Prisma.Decimal(inputItem.shippedQty);

          if (shippedQty.lte(0)) {
            throw new BadRequestException(
              `Shipped quantity must be greater than zero for ingredient ${transferItem.ingredientId}`,
            );
          }

          if (
            !transferItem.approvedQty ||
            shippedQty.gt(transferItem.approvedQty)
          ) {
            throw new BadRequestException(
              `Shipped quantity cannot exceed approved quantity for ingredient ${transferItem.ingredientId}`,
            );
          }
        }

        // ------------------------------------------------
        // DEDUCT WAREHOUSE STOCK
        // ------------------------------------------------

        for (const inputItem of dto.items) {
          const transferItem = transferItemMap.get(inputItem.transferItemId)!;

          const shippedQty = new Prisma.Decimal(inputItem.shippedQty);

          const updatedStock = await tx.warehouseStock.updateMany({
            where: {
              warehouseId: transfer.fromWarehouseId,

              ingredientId: transferItem.ingredientId,

              quantityOnHand: {
                gte: shippedQty,
              },
            },

            data: {
              quantityOnHand: {
                decrement: shippedQty,
              },
            },
          });

          if (updatedStock.count !== 1) {
            throw new BadRequestException(
              `Insufficient warehouse stock for ingredient ${transferItem.ingredientId}`,
            );
          }

          // ------------------------------------------------
          // ADD TO TRANSIT
          // ------------------------------------------------

          await tx.inventoryTransit.upsert({
            where: {
              transferId_ingredientId: {
                transferId,
                ingredientId: transferItem.ingredientId,
              },
            },

            create: {
              transferId,

              ingredientId: transferItem.ingredientId,

              quantity: shippedQty,
            },

            update: {
              quantity: {
                increment: shippedQty,
              },
            },
          });

          // ------------------------------------------------
          // AUDIT
          // ------------------------------------------------

          await tx.stockMovement.create({
            data: {
              locationType: 'WAREHOUSE',

              locationId: transfer.fromWarehouseId,

              ingredientId: transferItem.ingredientId,

              movementType: 'TRANSFER_OUT',

              quantityChange: shippedQty.negated(),

              referenceId: transfer.id,
            },
          });

          // ------------------------------------------------
          // SAVE SHIPPED QUANTITY
          // ------------------------------------------------

          await tx.stockTransferItem.update({
            where: {
              id: transferItem.id,
            },

            data: {
              shippedQty,
            },
          });
        }

        const now = new Date();

        // ------------------------------------------------
        // SHIPMENT DISPATCHED
        // ------------------------------------------------

        await tx.shipment.update({
          where: {
            transferId,
          },

          data: {
            dispatchedAt: now,
          },
        });

        // ------------------------------------------------
        // TRANSFER -> SHIPPED
        // ------------------------------------------------

        const updatedTransfer = await tx.stockTransfer.update({
          where: {
            id: transferId,
          },

          data: {
            status: TransferStatus.SHIPPED,

            shippedBy,

            shippedAt: now,
          },

          include: {
            items: true,
            shipment: true,
          },
        });

        return updatedTransfer;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  // ======================================================
  // IN TRANSIT
  // ======================================================

  // ------------------------------------------------------
  // SHIPPED -> IN_TRANSIT
  // ------------------------------------------------------

  async markInTransit(transferId: string) {
    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({
        where: {
          id: transferId,
        },
      });

      if (!transfer) {
        throw new NotFoundException('Stock transfer not found');
      }

      if (transfer.status !== TransferStatus.SHIPPED) {
        throw new ConflictException(
          `Cannot mark transfer in transit from ${transfer.status} state`,
        );
      }

      const updated = await tx.stockTransfer.updateMany({
        where: {
          id: transferId,
          status: TransferStatus.SHIPPED,
        },

        data: {
          status: TransferStatus.IN_TRANSIT,
        },
      });

      if (updated.count !== 1) {
        throw new ConflictException('Transfer has already been processed');
      }

      return tx.stockTransfer.findUnique({
        where: {
          id: transferId,
        },

        include: {
          items: true,
          shipment: true,
        },
      });
    });
  }

  // ======================================================
  // RECEIVE
  // ======================================================

  // ------------------------------------------------------
  // SHIPPED / IN_TRANSIT
  //          ->
  // COMPLETED / DISPUTED
  //
  // Example:
  //
  // shipped = 4
  // received = 3
  //
  // restaurant    +3
  // transit       -3
  // discrepancy    1
  // status      DISPUTED
  // ------------------------------------------------------

  async receive(
    transferId: string,
    dto: ReceiveTransferDto,
    receivedBy: string,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const transfer = await tx.stockTransfer.findUnique({
          where: {
            id: transferId,
          },

          include: {
            items: true,
            shipment: true,
          },
        });

        if (!transfer) {
          throw new NotFoundException('Stock transfer not found');
        }

        if (
          transfer.status !== TransferStatus.SHIPPED &&
          transfer.status !== TransferStatus.IN_TRANSIT
        ) {
          throw new ConflictException(
            `Cannot receive transfer in ${transfer.status} state`,
          );
        }

        if (transfer.items.length === 0) {
          throw new BadRequestException('Transfer has no items');
        }

        if (dto.items.length !== transfer.items.length) {
          throw new BadRequestException(
            'All transfer items must be included when receiving',
          );
        }

        const transferItemMap = new Map(
          transfer.items.map((item) => [item.id, item]),
        );

        const submittedItemIds = new Set<string>();

        // ------------------------------------------------
        // VALIDATION FIRST
        // ------------------------------------------------

        for (const inputItem of dto.items) {
          if (submittedItemIds.has(inputItem.transferItemId)) {
            throw new BadRequestException(
              `Duplicate transfer item ${inputItem.transferItemId}`,
            );
          }

          submittedItemIds.add(inputItem.transferItemId);

          const transferItem = transferItemMap.get(inputItem.transferItemId);

          if (!transferItem) {
            throw new BadRequestException(
              `Transfer item ${inputItem.transferItemId} does not belong to this transfer`,
            );
          }

          if (transferItem.shippedQty === null) {
            throw new BadRequestException(
              `Item ${transferItem.id} has not been shipped`,
            );
          }

          const receivedQty = new Prisma.Decimal(inputItem.receivedQty);

          // Zero is allowed because an item can be
          // completely missing.
          if (receivedQty.lt(0)) {
            throw new BadRequestException(
              `Received quantity cannot be negative for ingredient ${transferItem.ingredientId}`,
            );
          }

          if (receivedQty.gt(transferItem.shippedQty)) {
            throw new BadRequestException(
              `Received quantity cannot exceed shipped quantity for ingredient ${transferItem.ingredientId}`,
            );
          }
        }

        let hasDiscrepancy = false;

        // ------------------------------------------------
        // PROCESS EACH ITEM
        // ------------------------------------------------

        for (const inputItem of dto.items) {
          const transferItem = transferItemMap.get(inputItem.transferItemId)!;

          const receivedQty = new Prisma.Decimal(inputItem.receivedQty);

          const shippedQty = transferItem.shippedQty!;

          const discrepancyQty = shippedQty.minus(receivedQty);

          // ------------------------------------------------
          // RESTAURANT STOCK
          //
          // Don't create meaningless zero-stock
          // records for completely missing items.
          // ------------------------------------------------

          if (receivedQty.gt(0)) {
            await tx.restaurantStock.upsert({
              where: {
                restaurantId_ingredientId: {
                  restaurantId: transfer.toRestaurantId,

                  ingredientId: transferItem.ingredientId,
                },
              },

              create: {
                restaurantId: transfer.toRestaurantId,

                ingredientId: transferItem.ingredientId,

                quantityOnHand: receivedQty,
              },

              update: {
                quantityOnHand: {
                  increment: receivedQty,
                },
              },
            });

            // --------------------------------------------
            // TRANSFER IN AUDIT
            // --------------------------------------------

            await tx.stockMovement.create({
              data: {
                locationType: 'RESTAURANT',

                locationId: transfer.toRestaurantId,

                ingredientId: transferItem.ingredientId,

                movementType: 'TRANSFER_IN',

                quantityChange: receivedQty,

                referenceId: transfer.id,
              },
            });
          }

          // ------------------------------------------------
          // TRANSIT INVENTORY
          //
          // Only the physically received quantity leaves
          // transit.
          // ------------------------------------------------

          if (receivedQty.gt(0)) {
            const transitUpdated = await tx.inventoryTransit.updateMany({
              where: {
                transferId: transfer.id,

                ingredientId: transferItem.ingredientId,

                quantity: {
                  gte: receivedQty,
                },
              },

              data: {
                quantity: {
                  decrement: receivedQty,
                },
              },
            });

            if (transitUpdated.count !== 1) {
              throw new BadRequestException(
                `Insufficient transit inventory for ingredient ${transferItem.ingredientId}`,
              );
            }
          }

          // ------------------------------------------------
          // SAVE RECEIVED QUANTITY
          // ------------------------------------------------

          await tx.stockTransferItem.update({
            where: {
              id: transferItem.id,
            },

            data: {
              receivedQty,
            },
          });

          // ------------------------------------------------
          // SHORT RECEIPT
          // ------------------------------------------------

          if (discrepancyQty.gt(0)) {
            hasDiscrepancy = true;

            await tx.transferDiscrepancy.create({
              data: {
                transferId: transfer.id,

                transferItemId: transferItem.id,

                type: 'SHORT_RECEIPT',

                expectedQty: shippedQty,

                actualQty: receivedQty,

                reason:
                  inputItem.reason ??
                  `Short receipt: shipped ${shippedQty.toString()}, received ${receivedQty.toString()}`,

                reportedBy: receivedBy,
              },
            });
          }
        }

        const now = new Date();

        // ------------------------------------------------
        // SHIPMENT DELIVERED
        // ------------------------------------------------

        if (transfer.shipment) {
          await tx.shipment.update({
            where: {
              transferId: transfer.id,
            },

            data: {
              deliveredAt: now,
            },
          });
        }

        // ------------------------------------------------
        // FINAL STATUS
        // ------------------------------------------------

        const finalStatus = hasDiscrepancy
          ? TransferStatus.DISPUTED
          : TransferStatus.COMPLETED;

        // ------------------------------------------------
        // UPDATE TRANSFER
        // ------------------------------------------------

        const completedTransfer = await tx.stockTransfer.update({
          where: {
            id: transfer.id,
          },

          data: {
            status: finalStatus,

            receivedBy,

            receivedAt: now,

            completedAt: hasDiscrepancy ? null : now,
          },

          include: {
            items: true,
            shipment: true,
            discrepancies: true,
          },
        });

        // ------------------------------------------------
        // IF COMPLETED DIRECTLY
        // FULFILL STOCK REQUEST
        // ------------------------------------------------

        if (
          finalStatus === TransferStatus.COMPLETED &&
          transfer.stockRequestId
        ) {
          await this.fulfillStockRequestIfComplete(
            tx,
            transfer.stockRequestId,
            now,
          );
        }

        return completedTransfer;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  // ======================================================
  // RESOLVE DISCREPANCY
  // ======================================================

  // ------------------------------------------------------
  // DISPUTED -> COMPLETED
  //
  // Any quantity still remaining in transit because of the
  // short receipt is settled here.
  //
  // Example:
  //
  // shipped = 4
  // received = 3
  //
  // after receive:
  //
  // transit = 1
  //
  // after resolution:
  //
  // transit = 0
  //
  // TRANSIT ADJUSTMENT = -1
  // ------------------------------------------------------

  async resolveDiscrepancy(
    transferId: string,
    dto: ResolveDiscrepancyDto,
    resolvedBy: string,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const transfer = await tx.stockTransfer.findUnique({
          where: {
            id: transferId,
          },

          include: {
            discrepancies: true,
            items: true,
          },
        });

        if (!transfer) {
          throw new NotFoundException('Stock transfer not found');
        }

        if (transfer.status !== TransferStatus.DISPUTED) {
          throw new ConflictException(
            `Cannot resolve discrepancy while transfer is ${transfer.status}`,
          );
        }

        if (!dto.resolution?.trim()) {
          throw new BadRequestException('Resolution is required');
        }

        if (transfer.discrepancies.length === 0) {
          throw new BadRequestException(
            'No discrepancy exists for this transfer',
          );
        }

        const unresolvedDiscrepancies = transfer.discrepancies.filter(
          (discrepancy) => discrepancy.resolvedAt === null,
        );

        if (unresolvedDiscrepancies.length === 0) {
          throw new ConflictException(
            'All discrepancies for this transfer are already resolved',
          );
        }

        const now = new Date();

        // ------------------------------------------------
        // RESOLVE DISCREPANCIES
        // ------------------------------------------------

        await tx.transferDiscrepancy.updateMany({
          where: {
            transferId: transfer.id,
            resolvedAt: null,
          },

          data: {
            resolvedBy,

            resolution: dto.resolution.trim(),

            resolvedAt: now,
          },
        });

        // ------------------------------------------------
        // SETTLE REMAINING TRANSIT STOCK
        //
        // Any quantity still in transit after the restaurant
        // has confirmed receipt is no longer physically
        // in transit.
        //
        // The current schema has no separate "loss" or
        // "damaged" inventory table, so we record this as
        // an immutable TRANSIT ADJUSTMENT.
        // ------------------------------------------------

        for (const item of transfer.items) {
          const transit = await tx.inventoryTransit.findUnique({
            where: {
              transferId_ingredientId: {
                transferId: transfer.id,

                ingredientId: item.ingredientId,
              },
            },
          });

          if (transit && transit.quantity.gt(0)) {
            const remainingQty = transit.quantity;

            await tx.inventoryTransit.update({
              where: {
                id: transit.id,
              },

              data: {
                quantity: 0,
              },
            });

            await tx.stockMovement.create({
              data: {
                locationType: 'TRANSIT',

                locationId: transfer.id,

                ingredientId: item.ingredientId,

                movementType: 'ADJUSTMENT',

                quantityChange: remainingQty.negated(),

                referenceId: transfer.id,
              },
            });
          }
        }

        // ------------------------------------------------
        // TRANSFER -> COMPLETED
        // ------------------------------------------------

        const completedTransfer = await tx.stockTransfer.update({
          where: {
            id: transfer.id,
          },

          data: {
            status: TransferStatus.COMPLETED,

            completedAt: now,
          },

          include: {
            items: true,
            shipment: true,
            discrepancies: true,
          },
        });

        // ------------------------------------------------
        // STOCK REQUEST
        // ------------------------------------------------

        if (transfer.stockRequestId) {
          await this.fulfillStockRequestIfComplete(
            tx,
            transfer.stockRequestId,
            now,
          );
        }

        return completedTransfer;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  // ======================================================
  // INTERNAL HELPERS
  // ======================================================

  // ------------------------------------------------------
  // STOCK REQUEST -> FULFILLED
  //
  // A request is fulfilled only when there are no other
  // active transfers belonging to it.
  // ------------------------------------------------------

  private async fulfillStockRequestIfComplete(
    tx: Prisma.TransactionClient,
    stockRequestId: string,
    now: Date,
  ) {
    const activeTransferCount = await tx.stockTransfer.count({
      where: {
        stockRequestId,

        status: {
          in: [
            TransferStatus.REQUESTED,
            TransferStatus.APPROVED,
            TransferStatus.PICKING,
            TransferStatus.READY_TO_SHIP,
            TransferStatus.SHIPPED,
            TransferStatus.IN_TRANSIT,
            TransferStatus.DISPUTED,
          ],
        },
      },
    });

    if (activeTransferCount > 0) {
      return;
    }

    await tx.stockRequest.updateMany({
      where: {
        id: stockRequestId,

        status: StockRequestStatus.APPROVED,
      },

      data: {
        status: StockRequestStatus.FULFILLED,

        fulfilledAt: now,
      },
    });
  }
}
