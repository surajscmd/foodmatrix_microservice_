import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { CatalogGatewayService } from '../../utils/caltalog-gateway.service.js';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { WasteLogService } from './waste-log.service.js';

describe('WasteLogService', () => {
  let service: WasteLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WasteLogService,
        { provide: PrismaService, useValue: {} },
        { provide: CatalogGatewayService, useValue: {} },
      ],
    }).compile();

    service = module.get<WasteLogService>(WasteLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
