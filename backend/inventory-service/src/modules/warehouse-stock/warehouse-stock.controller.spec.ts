import { beforeEach, describe, expect, it } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { WarehouseStockController } from './warehouse-stock.controller.js';
import { WarehouseStockService } from './warehouse-stock.service.js';

describe('WarehouseStockController', () => {
  let controller: WarehouseStockController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WarehouseStockController],
      providers: [{ provide: WarehouseStockService, useValue: {} }],
    }).compile();

    controller = module.get<WarehouseStockController>(WarehouseStockController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
