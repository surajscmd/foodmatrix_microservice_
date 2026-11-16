import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { CustomerService } from './customer.service';

describe('CustomerService', () => {
  it('rejects an existing phone number without creating a customer', async () => {
    const create = jest.fn();
    const module = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: PrismaService,
          useValue: {
            customer: { create, findUnique: () => ({ id: 'existing' }) },
          },
        },
      ],
    }).compile();

    const service = module.get(CustomerService);
    await expect(service.create({ phone: '5551234567' })).rejects.toThrow(
      ConflictException,
    );
    expect(create).not.toHaveBeenCalled();
  });
});
