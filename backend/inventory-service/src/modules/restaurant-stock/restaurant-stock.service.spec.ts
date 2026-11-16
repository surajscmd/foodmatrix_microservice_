import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { CatalogGatewayService } from '../../utils/caltalog-gateway.service.js';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantStockService } from './restaurant-stock.service.js';

describe('RestaurantStockService', () => {
  let service: RestaurantStockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantStockService,
        { provide: PrismaService, useValue: {} },
        { provide: CatalogGatewayService, useValue: {} },
      ],
    }).compile();

    service = module.get<RestaurantStockService>(RestaurantStockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
