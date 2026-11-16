import { beforeEach, describe, expect, it } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { StockTransferController } from './stock-transfer.controller.js';
import { StockTransferService } from './stock-transfer.service.js';

describe('StockTransferController', () => {
  let controller: StockTransferController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockTransferController],
      providers: [{ provide: StockTransferService, useValue: {} }],
    }).compile();

    controller = module.get<StockTransferController>(StockTransferController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
