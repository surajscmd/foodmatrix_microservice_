import { Test, TestingModule } from '@nestjs/testing';
import { WarehouseStockController } from './warehouse-stock.controller';
import { WarehouseStockService } from './warehouse-stock.service';

describe('WarehouseStockController', () => {
  let controller: WarehouseStockController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WarehouseStockController],
      providers: [WarehouseStockService],
    }).compile();

    controller = module.get<WarehouseStockController>(WarehouseStockController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
