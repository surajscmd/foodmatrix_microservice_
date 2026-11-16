import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { CatalogGatewayService } from '../../utils/caltalog-gateway.service.js';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { StockMovementService } from './stock-movement.service.js';

describe('StockMovementService', () => {
  let service: StockMovementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockMovementService,
        { provide: PrismaService, useValue: {} },
        { provide: CatalogGatewayService, useValue: {} },
      ],
    }).compile();

    service = module.get<StockMovementService>(StockMovementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
