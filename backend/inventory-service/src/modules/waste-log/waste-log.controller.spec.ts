import { Test, TestingModule } from '@nestjs/testing';
import { WasteLogController } from './waste-log.controller';
import { WasteLogService } from './waste-log.service';

describe('WasteLogController', () => {
  let controller: WasteLogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WasteLogController],
      providers: [WasteLogService],
    }).compile();

    controller = module.get<WasteLogController>(WasteLogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
