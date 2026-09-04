import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantStockService } from './restaurant-stock.service';

describe('RestaurantStockService', () => {
  let service: RestaurantStockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RestaurantStockService],
    }).compile();

    service = module.get<RestaurantStockService>(RestaurantStockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
