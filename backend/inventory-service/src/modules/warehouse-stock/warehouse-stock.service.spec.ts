import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { CatalogGatewayService } from '../../utils/caltalog-gateway.service.js';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { WarehouseStockService } from './warehouse-stock.service.js';

describe('WarehouseStockService', () => {
  let service: WarehouseStockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarehouseStockService,
        { provide: PrismaService, useValue: {} },
        { provide: CatalogGatewayService, useValue: {} },
      ],
    }).compile();

    service = module.get<WarehouseStockService>(WarehouseStockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
