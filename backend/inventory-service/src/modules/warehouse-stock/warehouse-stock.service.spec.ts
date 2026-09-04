import { Test, TestingModule } from '@nestjs/testing';
import { WarehouseStockService } from './warehouse-stock.service';

describe('WarehouseStockService', () => {
  let service: WarehouseStockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WarehouseStockService],
    }).compile();

    service = module.get<WarehouseStockService>(WarehouseStockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
