import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { TransferStatus } from '@prisma/client';

import { StockTransferService } from './stock-transfer.service.js';

import { CreateShipmentDto } from './dto/create-shipment.dto.js';
import { ShipTransferDto } from './dto/ship-transfer.dto.js';
import { ReceiveTransferDto } from './dto/receive-transfer.dto.js';
import { ResolveDiscrepancyDto } from './dto/resolve-discrepancy.dto.js';

@Controller('stock-transfers')
export class StockTransferController {
  constructor(private readonly stockTransferService: StockTransferService) {}

  // ======================================================
  // ======================================================
  // WAREHOUSE APIs
  // ======================================================
  // ======================================================

  // ------------------------------------------------------
  // GET OUTGOING TRANSFERS FOR WAREHOUSE
  //
  // Warehouse Admin / Warehouse Staff
  //
  // Shows transfers going FROM this warehouse TO
  // restaurants.
  //
  // GET /stock-transfers/warehouse/:warehouseId
  //
  // Optional:
  // ?status=APPROVED
  // ------------------------------------------------------
  @Get('warehouse/:warehouseId')
  async findByWarehouse(
    @Param('warehouseId') warehouseId: string,
    @Query('status') status?: TransferStatus,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const data = await this.stockTransferService.findByWarehouse(
      warehouseId,
      status,
      Number(page),
      Number(limit),
    );

    return {
      message: 'Warehouse outgoing transfers fetched successfully',
      data,
    };
  }

  // ------------------------------------------------------
  // START PICKING
  //
  // Warehouse employee starts physically picking
  // ingredients for this transfer.
  //
  // APPROVED -> PICKING
  //
  // POST /stock-transfers/:id/start-picking
  // ------------------------------------------------------

  @Post(':id/start-picking')
  async startPicking(@Param('id') id: string) {
    // TODO:
    // Replace with authenticated warehouse user ID
    // from JWT.
    const warehouseUserId = 'SYSTEM-WAREHOUSE-USER';

    const data = await this.stockTransferService.startPicking(
      id,
      warehouseUserId,
    );

    return {
      message: 'Stock transfer picking started successfully',
      data,
    };
  }

  // ------------------------------------------------------
  // MARK READY TO SHIP
  //
  // Warehouse has finished picking and packing.
  //
  // PICKING -> READY_TO_SHIP
  //
  // POST /stock-transfers/:id/ready-to-ship
  // ------------------------------------------------------

  @Post(':id/ready-to-ship')
  async readyToShip(@Param('id') id: string) {
    const data = await this.stockTransferService.readyToShip(id);

    return {
      message: 'Stock transfer is ready to ship',
      data,
    };
  }

  // ------------------------------------------------------
  // CREATE SHIPMENT
  //
  // Warehouse enters physical logistics information:
  //
  // - Carrier
  // - Tracking number
  // - Dispatcher
  // - Driver
  // - Vehicle
  // - ETA
  //
  // POST /stock-transfers/:id/shipment
  // ------------------------------------------------------

  @Post(':id/shipment')
  async createShipment(
    @Param('id') id: string,
    @Body() dto: CreateShipmentDto,
  ) {
    const data = await this.stockTransferService.createShipment(id, dto);

    return {
      message: 'Shipment created successfully',
      data,
    };
  }

  // ------------------------------------------------------
  // SHIP TRANSFER
  //
  // Warehouse physically dispatches the stock.
  //
  // READY_TO_SHIP -> SHIPPED
  //
  // Inside the service transaction:
  //
  // WarehouseStock     -
  // InventoryTransit   +
  // StockMovement      TRANSFER_OUT
  // TransferItem       shippedQty
  // Shipment           dispatchedAt
  // Transfer           SHIPPED
  //
  // POST /stock-transfers/:id/ship
  // ------------------------------------------------------

  @Post(':id/ship')
  async ship(@Param('id') id: string, @Body() dto: ShipTransferDto) {
    // TODO:
    // Replace with authenticated warehouse user ID
    // from JWT.
    const shippedBy = 'SYSTEM-WAREHOUSE-USER';

    const data = await this.stockTransferService.ship(id, dto, shippedBy);

    return {
      message: 'Stock transfer shipped successfully',
      data,
    };
  }
  // ------------------------------------------------------
  // MARK IN TRANSIT
  //
  // Shipment has left the warehouse and is currently
  // travelling to the restaurant.
  //
  // SHIPPED -> IN_TRANSIT
  //
  // POST /stock-transfers/:id/in-transit
  // ------------------------------------------------------

  @Post(':id/in-transit')
  async markInTransit(@Param('id') id: string) {
    const data = await this.stockTransferService.markInTransit(id);

    return {
      message: 'Stock transfer marked as in transit',
      data,
    };
  }

  // ======================================================
  // ======================================================
  // RESTAURANT APIs
  // ======================================================
  // ======================================================

  // ------------------------------------------------------
  // GET INCOMING TRANSFERS FOR RESTAURANT
  //
  // Restaurant Manager
  //
  // Shows transfers coming FROM warehouse TO this
  // restaurant.
  //
  // GET /stock-transfers/restaurant/:restaurantId
  //
  // Optional:
  // ?status=SHIPPED
  // ------------------------------------------------------

  @Get('restaurant/:restaurantId')
  async findByRestaurant(
    @Param('restaurantId') restaurantId: string,
    @Query('status') status?: TransferStatus,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const data = await this.stockTransferService.findByRestaurant(
      restaurantId,
      status,
      Number(page),
      Number(limit),
    );

    return {
      message: 'Restaurant incoming transfers fetched successfully',
      data,
    };
  }

  // ------------------------------------------------------
  // RECEIVE TRANSFER
  //
  // Restaurant Manager checks the physical shipment
  // and submits ACTUAL received quantities.
  //
  // Example:
  //
  // shippedQty  = 35 kg
  // receivedQty = 33 kg
  //
  // Backend automatically calculates:
  //
  // discrepancy = 35 - 33 = 2 kg
  //
  // No warehouse stock deduction happens here.
  //
  // RestaurantStock increases by actual receivedQty.
  // InventoryTransit decreases by actual receivedQty.
  // TRANSFER_IN movement is created.
  //
  // If there is a discrepancy:
  //     Transfer -> DISPUTED
  //
  // If everything matches:
  //     Transfer -> COMPLETED
  //
  // POST /stock-transfers/:id/receive
  // ------------------------------------------------------

  @Post(':id/receive')
  async receive(@Param('id') id: string, @Body() dto: ReceiveTransferDto) {
    // TODO:
    // Replace with authenticated restaurant manager ID
    // from JWT.
    const receivedBy = 'SYSTEM-RESTAURANT-MANAGER';

    const data = await this.stockTransferService.receive(id, dto, receivedBy);

    return {
      message: 'Stock transfer received successfully',
      data,
    };
  }
  // ======================================================
  // ======================================================
  // COMMON / SHARED APIs
  // ======================================================
  // ======================================================

  // ------------------------------------------------------
  // GET SINGLE TRANSFER
  //
  // Used by:
  // - Warehouse
  // - Restaurant
  //
  // Authorization must be checked so a user cannot
  // access another warehouse/restaurant's transfer.
  //
  // GET /stock-transfers/:id
  // ------------------------------------------------------

  @Get(':id')
  async findById(@Param('id') id: string) {
    const data = await this.stockTransferService.findById(id);

    return {
      message: 'Stock transfer fetched successfully',
      data,
    };
  }
  // ------------------------------------------------------
  // RESOLVE DISCREPANCY
  //
  // Warehouse Admin reviews and resolves a disputed
  // stock transfer.
  //
  // DISPUTED -> COMPLETED
  //
  // POST /stock-transfers/:id/resolve-discrepancy
  // ------------------------------------------------------

  @Post(':id/resolve-discrepancy')
  async resolveDiscrepancy(
    @Param('id') id: string,
    @Body() dto: ResolveDiscrepancyDto,
  ) {
    // TODO:
    // Replace with authenticated warehouse admin ID
    // from JWT.
    const resolvedBy = 'SYSTEM-WAREHOUSE-ADMIN';

    const data = await this.stockTransferService.resolveDiscrepancy(
      id,
      dto,
      resolvedBy,
    );

    return {
      message: 'Stock transfer discrepancy resolved successfully',
      data,
    };
  }
}

// GET    /stock-transfers/warehouse/:warehouseId
// GET    /stock-transfers/restaurant/:restaurantId
// GET    /stock-transfers/:id

// POST   /stock-transfers/:id/start-picking
// POST   /stock-transfers/:id/ready-to-ship
// POST   /stock-transfers/:id/shipment
// POST   /stock-transfers/:id/ship
// POST   /stock-transfers/:id/in-transit
// POST   /stock-transfers/:id/receive
// POST   /stock-transfers/:id/resolve-discrepancy
