import { beforeEach, describe, expect, it } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { StockRequestController } from './stock-request.controller.js';
import { StockRequestService } from './stock-request.service.js';

describe('StockRequestController', () => {
  let controller: StockRequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockRequestController],
      providers: [{ provide: StockRequestService, useValue: {} }],
    }).compile();

    controller = module.get<StockRequestController>(StockRequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
