import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantStockController } from './restaurant-stock.controller';
import { RestaurantStockService } from './restaurant-stock.service';

describe('RestaurantStockController', () => {
  let controller: RestaurantStockController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RestaurantStockController],
      providers: [RestaurantStockService],
    }).compile();

    controller = module.get<RestaurantStockController>(RestaurantStockController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
