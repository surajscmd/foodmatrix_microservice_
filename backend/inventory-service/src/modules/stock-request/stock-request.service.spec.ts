import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { CatalogGatewayService } from '../../utils/caltalog-gateway.service.js';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { StockRequestService } from './stock-request.service.js';

describe('StockRequestService', () => {
  let service: StockRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockRequestService,
        { provide: PrismaService, useValue: {} },
        { provide: CatalogGatewayService, useValue: {} },
      ],
    }).compile();

    service = module.get<StockRequestService>(StockRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
