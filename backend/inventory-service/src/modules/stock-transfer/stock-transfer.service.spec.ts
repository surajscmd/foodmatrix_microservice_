import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { CatalogGatewayService } from '../../utils/caltalog-gateway.service.js';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { StockTransferService } from './stock-transfer.service.js';

describe('StockTransferService', () => {
  let service: StockTransferService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockTransferService,
        { provide: PrismaService, useValue: {} },
        { provide: CatalogGatewayService, useValue: {} },
      ],
    }).compile();

    service = module.get<StockTransferService>(StockTransferService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
