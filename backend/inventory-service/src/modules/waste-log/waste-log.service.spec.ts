import { Test, TestingModule } from '@nestjs/testing';
import { WasteLogService } from './waste-log.service';

describe('WasteLogService', () => {
  let service: WasteLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WasteLogService],
    }).compile();

    service = module.get<WasteLogService>(WasteLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
