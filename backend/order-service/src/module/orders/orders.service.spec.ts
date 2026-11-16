import { OrderItemsService } from './order-items.service';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './orders.service';

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: PrismaService, useValue: {} },
        { provide: OrderItemsService, useValue: {} },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
