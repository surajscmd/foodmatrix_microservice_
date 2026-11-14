import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { StockRequestStatus } from '@prisma/client';

import { StockRequestService } from './stock-request.service.js';
import { StockRequestIdentityService } from './stock-request-identity.service.js';

import { CreateStockRequestDto } from './dto/create-stock-request.dto.js';
import { ApproveStockRequestDto } from './dto/approve-stock-request.dto.js';
import { RejectStockRequestDto } from './dto/reject-stock-request.dto.js';
import { UpdateStockRequestDto } from './dto/update-stock-request.dto.js';

@Controller('stock-requests')
export class StockRequestController {
  constructor(
    private readonly stockRequestService: StockRequestService,
    private readonly identity: StockRequestIdentityService,
  ) {}

  private async requestOwner(
    id: string,
    cookie?: string,
    restaurantId?: string,
  ) {
    const owner = await this.stockRequestService.findOwner(id);
    if (restaurantId && owner.restaurantId !== restaurantId) {
      throw new ForbiddenException(
        'This request belongs to a different restaurant.',
      );
    }
    const { userId } = await this.identity.restaurantActor(
      cookie,
      owner.restaurantId,
    );
    // Existing requests used a shared actor. Only the assigned restaurant manager may manage them.
    return owner.requestedBy === 'SYSTEM-RESTAURANT-MANAGER'
      ? owner.requestedBy
      : userId;
  }

  // ======================================================
  // ======================================================
  // RESTAURANT MANAGER APIs
  // ======================================================
  // ======================================================

  // ------------------------------------------------------
  // CREATE STOCK REQUEST
  //
  // Restaurant Manager requests stock from the warehouse.
  //
  // POST /stock-requests
  //
  // Example:
  // {
  //   "restaurantId": "...",
  //   "warehouseId": "...",
  //   "reason": "Low stock",
  //   "items": [
  //     {
  //       "ingredientId": "...",
  //       "requestedQty": 40
  //     }
  //   ]
  // }
  //
  // Status after creation:
  // REQUESTED
  // ------------------------------------------------------

  @Post()
  async create(
    @Body() dto: CreateStockRequestDto,
    @Headers('cookie') cookie?: string,
  ) {
    const { userId, warehouseId } = await this.identity.restaurantActor(
      cookie,
      dto.restaurantId,
    );
    const data = await this.stockRequestService.create(
      { ...dto, warehouseId },
      userId,
    );

    return {
      message: 'Stock request created successfully',
      data,
    };
  }

  // ------------------------------------------------------
  // GET RESTAURANT STOCK REQUESTS
  //
  // Restaurant Manager can see requests belonging
  // to their restaurant.
  //
  // GET /stock-requests/restaurant/:restaurantId
  //
  // Optional:
  // ?status=REQUESTED
  // ------------------------------------------------------

  @Get('restaurant/:restaurantId')
  async findByRestaurant(
    @Param('restaurantId') restaurantId: string,
    @Query('status') status?: StockRequestStatus,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const data = await this.stockRequestService.findByRestaurant(
      restaurantId,
      status,
      Number(page),
      Number(limit),
    );

    return {
      message: 'Restaurant stock requests fetched successfully',
      data,
    };
  }

  // ------------------------------------------------------
  // CANCEL STOCK REQUEST
  //
  // Restaurant Manager can cancel only their own
  // REQUESTED request.
  //
  // POST /stock-requests/:id/cancel
  // ------------------------------------------------------

  @Post(':id/cancel')
  async cancel(@Param('id') id: string, @Headers('cookie') cookie?: string) {
    const userId = await this.requestOwner(id, cookie);

    const data = await this.stockRequestService.cancel(id, userId);

    return {
      message: 'Stock request cancelled successfully',
      data,
    };
  }
  // ======================================================
  // UPDATE STOCK REQUEST
  //
  // RESTAURANT MANAGER
  //
  // Only REQUESTED requests can be edited.
  //
  // PATCH /stock-requests/:id
  // ======================================================

  @Patch(':id')
  async update(
    @Param('id') requestId: string,
    @Body() dto: UpdateStockRequestDto,
    @Headers('cookie') cookie?: string,
  ) {
    const data = await this.stockRequestService.update(
      requestId,
      dto,
      await this.requestOwner(requestId, cookie),
    );

    return {
      message: 'Stock request updated successfully.',
      data,
    };
  }
  // ======================================================
  // DELETE STOCK REQUEST
  //
  // RESTAURANT MANAGER
  //
  // Only REQUESTED requests can be deleted.
  //
  // DELETE /stock-requests/:id/restaurant/:restaurantId?userId=...
  // DELETE /stock-requests/b3a76333-f1ee-4c0b-af95-fecc4c616678/restaurant/7f3c2a91-6d84-4e17-9b52-1a6f8c3d2047?userId=SYSTEM-RESTAURANT-MANAGER
  // ======================================================

  @Delete(':id/restaurant/:restaurantId')
  async deleteByRestaurant(
    @Param('id') requestId: string,
    @Param('restaurantId') restaurantId: string,
    @Headers('cookie') cookie?: string,
  ) {
    return this.stockRequestService.deleteByRestaurant(
      requestId,
      restaurantId,
      await this.requestOwner(requestId, cookie, restaurantId),
    );
  }

  // ======================================================
  // ======================================================
  // WAREHOUSE ADMIN APIs
  // ======================================================
  // ======================================================

  // ------------------------------------------------------
  // GET WAREHOUSE STOCK REQUESTS
  //
  // Warehouse Admin sees requests belonging to
  // this warehouse.
  //
  // GET /stock-requests/warehouse/:warehouseId
  //
  // Optional:
  // ?status=REQUESTED
  // ------------------------------------------------------

  @Get('warehouse/:warehouseId')
  async findByWarehouse(
    @Param('warehouseId') warehouseId: string,
    @Query('status') status?: StockRequestStatus,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const data = await this.stockRequestService.findByWarehouse(
      warehouseId,
      status,
      Number(page),
      Number(limit),
    );

    return {
      message: 'Warehouse stock requests fetched successfully',
      data,
    };
  }

  // ------------------------------------------------------
  // APPROVE STOCK REQUEST
  //
  // Warehouse Admin decides how much can be supplied.
  //
  // Example:
  //
  // Restaurant requests = 40 kg
  // Warehouse approves  = 35 kg
  //
  // POST /stock-requests/:id/approve
  //
  // Important:
  // This does NOT deduct warehouse stock.
  //
  // It creates a StockTransfer.
  // ------------------------------------------------------

  @Post(':id/approve')
  async approve(
    @Param('id') id: string,

    @Body()
    dto: ApproveStockRequestDto,
    @Headers('cookie') cookie?: string,
  ) {
    const { userId, warehouseId } = await this.identity.warehouseActor(cookie);

    const data = await this.stockRequestService.approve(
      id,
      dto,
      userId,
      warehouseId,
    );

    return {
      message: 'Stock request approved successfully',
      data,
    };
  }

  // ------------------------------------------------------
  // REJECT STOCK REQUEST
  //
  // Warehouse Admin rejects the complete request.
  //
  // POST /stock-requests/:id/reject
  // ------------------------------------------------------

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,

    @Body()
    dto: RejectStockRequestDto,
    @Headers('cookie') cookie?: string,
  ) {
    const { userId, warehouseId } = await this.identity.warehouseActor(cookie);

    const data = await this.stockRequestService.reject(
      id,
      dto,
      userId,
      warehouseId,
    );

    return {
      message: 'Stock request rejected successfully',
      data,
    };
  }

  // ======================================================
  // ======================================================
  // COMMON / SHARED APIs
  // ======================================================
  // ======================================================

  // ------------------------------------------------------
  // GET ONE STOCK REQUEST
  //
  // Used by:
  // - Restaurant Manager
  // - Warehouse Admin
  //
  // Authorization should be applied before exposing
  // another restaurant's/warehouse's request.
  //
  // GET /stock-requests/:id
  // ------------------------------------------------------

  @Get(':id')
  async findById(@Param('id') id: string) {
    const data = await this.stockRequestService.findById(id);

    return {
      message: 'Stock request fetched successfully',
      data,
    };
  }

  // ------------------------------------------------------
  // GET ALL STOCK REQUESTS
  //
  // Mainly for internal/admin usage.
  //
  // GET /stock-requests
  //
  // Optional:
  // ?status=REQUESTED
  // ------------------------------------------------------
  @Get()
  async findAll(
    @Query('status')
    status?: StockRequestStatus,

    @Query('page')
    page = '1',

    @Query('limit')
    limit = '10',
  ) {
    const data = await this.stockRequestService.findAll(
      status,
      Number(page),
      Number(limit),
    );

    return {
      message: 'Stock requests fetched successfully',
      data,
    };
  }
  // ======================================================
  // CREATE STOCK REQUEST FROM LOW STOCK
  //
  // RESTAURANT MANAGER
  //
  // POST /stock-requests/restaurant/:restaurantId/from-low-stock
  // ======================================================

  @Post('restaurant/:restaurantId/from-low-stock')
  async createFromLowStock(
    @Param('restaurantId') restaurantId: string,
    @Headers('cookie') cookie?: string,
  ) {
    const { userId, warehouseId } = await this.identity.restaurantActor(
      cookie,
      restaurantId,
    );
    const data = await this.stockRequestService.createFromLowStock(
      restaurantId,
      warehouseId,
      userId,
    );

    return {
      message: 'Stock request created from low stock successfully.',
      data,
    };
  }
  // ======================================================
  // GET LOW STOCK INGREDIENTS
  //
  // RESTAURANT MANAGER
  //
  // GET /stock-requests/restaurant/:restaurantId/low-stock
  //
  // Optional:
  // ?page=1
  // ?limit=10
  // ------------------------------------------------------
  // ======================================================
  @Get('restaurant/:restaurantId/low-stock')
  async findLowStock(
    @Param('restaurantId') restaurantId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const data = await this.stockRequestService.findLowStock(
      restaurantId,
      Number(page),
      Number(limit),
    );

    return {
      message: 'Low stock ingredients fetched successfully',
      data,
    };
  }
}

// POST    /stock-requests
// GET     /stock-requests/:id
// GET     /stock-requests/restaurant/:restaurantId
// GET     /stock-requests/warehouse/:warehouseId
// GET     /stock-requests
// PATCH   /stock-requests/:id
// DELETE  /stock-requests/:id/restaurant/:restaurantId
// POST    /stock-requests/restaurant/:restaurantId/from-low-stock
// POST    /stock-requests/:id/approve
// POST    /stock-requests/:id/reject
// POST    /stock-requests/:id/cancel
