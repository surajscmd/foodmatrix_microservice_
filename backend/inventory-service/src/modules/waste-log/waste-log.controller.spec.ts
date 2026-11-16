import { beforeEach, describe, expect, it } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { WasteLogController } from './waste-log.controller.js';
import { WasteLogService } from './waste-log.service.js';

describe('WasteLogController', () => {
  let controller: WasteLogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WasteLogController],
      providers: [{ provide: WasteLogService, useValue: {} }],
    }).compile();

    controller = module.get<WasteLogController>(WasteLogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
