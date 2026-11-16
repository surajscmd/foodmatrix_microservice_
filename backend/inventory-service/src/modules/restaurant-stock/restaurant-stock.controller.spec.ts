import { beforeEach, describe, expect, it } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantStockController } from './restaurant-stock.controller.js';
import { RestaurantStockService } from './restaurant-stock.service.js';

describe('RestaurantStockController', () => {
  let controller: RestaurantStockController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RestaurantStockController],
      providers: [{ provide: RestaurantStockService, useValue: {} }],
    }).compile();

    controller = module.get<RestaurantStockController>(
      RestaurantStockController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
