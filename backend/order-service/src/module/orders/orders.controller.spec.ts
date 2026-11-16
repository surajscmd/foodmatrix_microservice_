import { OrderItemsService } from './order-items.service';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './orders.controller';
import { OrderService } from './orders.service';

describe('OrderController', () => {
  let controller: OrderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        { provide: OrderService, useValue: {} },
        { provide: OrderItemsService, useValue: {} },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
