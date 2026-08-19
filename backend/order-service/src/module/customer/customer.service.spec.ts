import { Test, TestingModule } from '@nestjs/testing';

import { CustomerService } from './customer.service';
import { PrismaService } from '../../lib/prisma/prisma.service';

describe('CustomerService', () => {
  let service: CustomerService;

  const prismaMock = {
    customer: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a customer', async () => {
      const dto = {
        phone: '9876543210',
        name: 'Suraj',
      };

      const createdCustomer = {
        id: 'customer-id',
        phone: '9876543210',
        name: 'Suraj',
      };

      prismaMock.customer.findUnique.mockResolvedValue(null);
      prismaMock.customer.create.mockResolvedValue(createdCustomer);

      const result = await service.create(dto);

      expect(result).toEqual(createdCustomer);

      expect(prismaMock.customer.findUnique).toHaveBeenCalledWith({
        where: {
          phone: dto.phone,
        },
      });

      expect(prismaMock.customer.create).toHaveBeenCalledWith({
        data: {
          phone: dto.phone,
          name: dto.name,
        },
      });
    });

    it('should throw ConflictException when phone already exists', async () => {
      const dto = {
        phone: '9876543210',
        name: 'Suraj',
      };

      prismaMock.customer.findUnique.mockResolvedValue({
        id: 'existing-id',
        phone: dto.phone,
        name: 'Existing Customer',
      });

      await expect(service.create(dto)).rejects.toThrow(
        'Customer with this phone number already exists.',
      );

      expect(prismaMock.customer.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all customers', async () => {
      const customers = [
        {
          id: 'customer-1',
          phone: '9876543210',
          name: 'Suraj',
        },
        {
          id: 'customer-2',
          phone: '9988776655',
          name: 'Rahul',
        },
      ];

      prismaMock.customer.findMany.mockResolvedValue(customers);

      const result = await service.findAll();

      expect(result).toEqual(customers);

      expect(prismaMock.customer.findMany).toHaveBeenCalledWith({
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a customer', async () => {
      const customer = {
        id: 'customer-id',
        phone: '9876543210',
        name: 'Suraj',
      };

      prismaMock.customer.findUnique.mockResolvedValue(customer);

      const result = await service.findOne(customer.id);

      expect(result).toEqual(customer);

      expect(prismaMock.customer.findUnique).toHaveBeenCalledWith({
        where: {
          id: customer.id,
        },
      });
    });

    it('should throw NotFoundException when customer does not exist', async () => {
      prismaMock.customer.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existing-id')).rejects.toThrow(
        'Customer not found.',
      );
    });
  });

  describe('update', () => {
    it('should update a customer', async () => {
      const customer = {
        id: 'customer-id',
        phone: '9876543210',
        name: 'Suraj',
      };

      const dto = {
        name: 'Suraj S',
      };

      const updatedCustomer = {
        ...customer,
        name: 'Suraj S',
      };

      prismaMock.customer.findUnique.mockResolvedValue(customer);
      prismaMock.customer.update.mockResolvedValue(updatedCustomer);

      const result = await service.update(customer.id, dto);

      expect(result).toEqual(updatedCustomer);

      expect(prismaMock.customer.update).toHaveBeenCalledWith({
        where: {
          id: customer.id,
        },
        data: dto,
      });
    });

    it('should throw ConflictException when changing to an existing phone', async () => {
      const customer = {
        id: 'customer-id',
        phone: '9876543210',
        name: 'Suraj',
      };

      const existingCustomer = {
        id: 'another-customer-id',
        phone: '9988776655',
        name: 'Rahul',
      };

      prismaMock.customer.findUnique
        .mockResolvedValueOnce(customer)
        .mockResolvedValueOnce(existingCustomer);

      await expect(
        service.update(customer.id, {
          phone: '9988776655',
        }),
      ).rejects.toThrow(
        'Another customer with this phone number already exists.',
      );

      expect(prismaMock.customer.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a customer', async () => {
      const customer = {
        id: 'customer-id',
        phone: '9876543210',
        name: 'Suraj',
      };

      prismaMock.customer.findUnique.mockResolvedValue(customer);
      prismaMock.customer.delete.mockResolvedValue(customer);

      const result = await service.remove(customer.id);

      expect(result).toEqual({
        message: 'Customer deleted successfully.',
      });

      expect(prismaMock.customer.delete).toHaveBeenCalledWith({
        where: {
          id: customer.id,
        },
      });
    });

    it('should throw NotFoundException when deleting a non-existing customer', async () => {
      prismaMock.customer.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existing-id')).rejects.toThrow(
        'Customer not found.',
      );

      expect(prismaMock.customer.delete).not.toHaveBeenCalled();
    });
  });
});
