import { InventoryAccess } from '../../auth/inventory-access.js';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { WarehouseStockService } from './warehouse-stock.service.js';

import { ReceiveWarehouseStockDto } from './dto/receive-warehouse-stock.dto.js';
import { AdjustWarehouseStockDto } from './dto/adjust-warehouse-stock.dto.js';
import { BulkReceiveWarehouseStockDto } from './dto/bulk-receive-warehouse-stock.dto.js';

@Controller('warehouse-stock')
export class WarehouseStockController {
  constructor(private readonly warehouseStockService: WarehouseStockService) {}

  // ======================================================
  // RECEIVE STOCK
  //
  // POST /warehouse-stock/receive
  // ======================================================

  @Post('receive')
  @InventoryAccess('warehouse')
  async receiveStock(@Body() dto: ReceiveWarehouseStockDto) {
    const data = await this.warehouseStockService.receiveStock(dto);

    return {
      message: 'Warehouse stock received successfully',
      data,
    };
  }

  // ======================================================
  // BULK RECEIVE STOCK
  //
  // POST /warehouse-stock/receive/bulk
  // ======================================================
  @Post('receive/bulk')
  @InventoryAccess('warehouse')
  async bulkReceiveStock(@Body() dto: BulkReceiveWarehouseStockDto) {
    const data = await this.warehouseStockService.bulkReceiveStock(dto);

    return {
      message: 'Warehouse stock received in bulk successfully',
      data,
    };
  }

  // ======================================================
  // GET ALL STOCK IN WAREHOUSE
  //
  // GET /warehouse-stock/warehouse/:warehouseId
  //
  // Optional:
  // ?page=1&limit=10
  // ======================================================

  @Get('warehouse/:warehouseId')
  @InventoryAccess('warehouse')
  async findByWarehouse(
    @Param('warehouseId') warehouseId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const data = await this.warehouseStockService.findByWarehouse(
      warehouseId,
      Number(page),
      Number(limit),
    );

    return {
      message: 'Warehouse stock fetched successfully',
      ...data,
    };
  }

  // ======================================================
  // GET STOCK FOR SPECIFIC INGREDIENT
  //
  // GET /warehouse-stock/warehouse/:warehouseId/ingredient/:ingredientId
  // ======================================================

  @Get('warehouse/:warehouseId/ingredient/:ingredientId')
  @InventoryAccess('warehouse')
  async findByWarehouseAndIngredient(
    @Param('warehouseId') warehouseId: string,
    @Param('ingredientId') ingredientId: string,
  ) {
    const data = await this.warehouseStockService.findByWarehouseAndIngredient(
      warehouseId,
      ingredientId,
    );

    return {
      message: 'Warehouse stock fetched successfully',
      data,
    };
  }

  // ======================================================
  // ADJUST WAREHOUSE STOCK
  //
  // POST /warehouse-stock/:warehouseId/:ingredientId/adjust
  //
  // Positive:
  // +10 -> increase
  //
  // Negative:
  // -10 -> decrease
  // ======================================================

  @Post(':warehouseId/:ingredientId/adjust')
  @InventoryAccess('warehouse')
  async adjustStock(
    @Param('warehouseId') warehouseId: string,
    @Param('ingredientId') ingredientId: string,
    @Body() dto: AdjustWarehouseStockDto,
  ) {
    const data = await this.warehouseStockService.adjustStock(
      warehouseId,
      ingredientId,
      dto,
    );

    return {
      message: 'Warehouse stock adjusted successfully',
      data,
    };
  }
}
