import { Test } from '@nestjs/testing';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';

describe('CustomerController', () => {
  it('forwards the customer pagination values as numbers', async () => {
    const findAll = jest.fn();
    const module = await Test.createTestingModule({
      controllers: [CustomerController],
      providers: [{ provide: CustomerService, useValue: { findAll } }],
    }).compile();

    await module.get(CustomerController).findAll('2', '25');
    expect(findAll).toHaveBeenCalledWith(2, 25);
  });
});
