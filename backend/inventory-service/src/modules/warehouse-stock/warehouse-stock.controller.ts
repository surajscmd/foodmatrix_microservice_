import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { WarehouseStockService } from './warehouse-stock.service.js';

import { ReceiveWarehouseStockDto } from './dto/receive-warehouse-stock.dto.js';
import { AdjustWarehouseStockDto } from './dto/adjust-warehouse-stock.dto.js';

@Controller('warehouse-stock')
export class WarehouseStockController {
  constructor(private readonly warehouseStockService: WarehouseStockService) {}

  // ======================================================
  // ======================================================
  // WAREHOUSE APIs
  // ======================================================
  // ======================================================

  // ------------------------------------------------------
  // RECEIVE STOCK
  //
  // Warehouse receives stock from a supplier/purchase.
  //
  // Example:
  //
  // POST /warehouse-stock/receive
  //
  // Body:
  // {
  //   "warehouseId": "...",
  //   "ingredientId": "...",
  //   "quantity": 100,
  //   "referenceId": "PURCHASE-001"
  // }
  //
  // Result:
  //
  // WarehouseStock +100
  // StockMovement PURCHASE +100
  // ------------------------------------------------------

  @Post('receive')
  receiveStock(
    @Body()
    dto: ReceiveWarehouseStockDto,
  ) {
    return this.warehouseStockService.receiveStock(dto);
  }

  // ------------------------------------------------------
  // GET ALL STOCK IN WAREHOUSE
  //
  // GET /warehouse-stock/warehouse/:warehouseId
  // ------------------------------------------------------

  @Get('warehouse/:warehouseId')
  findByWarehouse(
    @Param('warehouseId')
    warehouseId: string,
  ) {
    return this.warehouseStockService.findByWarehouse(warehouseId);
  }

  // ------------------------------------------------------
  // GET STOCK FOR SPECIFIC INGREDIENT
  //
  // GET /warehouse-stock/warehouse/:warehouseId/ingredient/:ingredientId
  // ------------------------------------------------------

  @Get('warehouse/:warehouseId/ingredient/:ingredientId')
  findByWarehouseAndIngredient(
    @Param('warehouseId')
    warehouseId: string,

    @Param('ingredientId')
    ingredientId: string,
  ) {
    return this.warehouseStockService.findByWarehouseAndIngredient(
      warehouseId,
      ingredientId,
    );
  }
  // ======================================================
  // ADJUST WAREHOUSE STOCK
  //
  // POST /warehouse-stock/:warehouseId/:ingredientId/adjust
  // ======================================================

  @Post(':warehouseId/:ingredientId/adjust')
  adjustStock(
    @Param('warehouseId') warehouseId: string,
    @Param('ingredientId') ingredientId: string,
    @Body() dto: AdjustWarehouseStockDto,
  ) {
    return this.warehouseStockService.adjustStock(
      warehouseId,
      ingredientId,
      dto,
    );
  }
}
