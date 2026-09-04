import { Controller, Get, Param, Query } from '@nestjs/common';

import { StockMovementService } from './stock-movement.service.js';

import { GetStockMovementsDto } from './dto/get-stock-movements.dto.js';

@Controller('stock-movements')
export class StockMovementController {
  constructor(private readonly stockMovementService: StockMovementService) {}

  // ======================================================
  // GET ALL STOCK MOVEMENTS
  //
  // GET /stock-movements
  //
  // Optional:
  // ?page=1
  // ?limit=10
  // ?ingredientId=...
  // ?movementType=WASTE
  // ?fromDate=2026-09-01T00:00:00.000Z
  // ?toDate=2026-09-04T23:59:59.999Z
  // ======================================================

  @Get()
  async findAll(@Query() dto: GetStockMovementsDto) {
    const data = await this.stockMovementService.findAll(dto);

    return {
      message: 'Stock movements fetched successfully',
      data,
    };
  }

  // ======================================================
  // GET RESTAURANT STOCK MOVEMENTS
  //
  // GET /stock-movements/restaurant/:restaurantId
  // ======================================================

  @Get('restaurant/:restaurantId')
  async findByRestaurant(
    @Param('restaurantId') restaurantId: string,
    @Query() dto: GetStockMovementsDto,
  ) {
    const data = await this.stockMovementService.findByRestaurant(
      restaurantId,
      dto,
    );

    return {
      message: 'Restaurant stock movements fetched successfully',
      data,
    };
  }

  // ======================================================
  // GET WAREHOUSE STOCK MOVEMENTS
  //
  // GET /stock-movements/warehouse/:warehouseId
  // ======================================================

  @Get('warehouse/:warehouseId')
  async findByWarehouse(
    @Param('warehouseId') warehouseId: string,
    @Query() dto: GetStockMovementsDto,
  ) {
    const data = await this.stockMovementService.findByWarehouse(
      warehouseId,
      dto,
    );

    return {
      message: 'Warehouse stock movements fetched successfully',
      data,
    };
  }
}
