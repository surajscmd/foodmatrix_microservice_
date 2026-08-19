import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PrismaService } from '../../lib/prisma/prisma.service';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const existingCustomer = await this.prisma.customer.findUnique({
      where: {
        phone: createCustomerDto.phone,
      },
    });

    if (existingCustomer) {
      throw new ConflictException(
        'Customer with this phone number already exists.',
      );
    }

    return this.prisma.customer.create({
      data: {
        phone: createCustomerDto.phone,
        name: createCustomerDto.name,
      },
    });
  }

  async findAll() {
    return this.prisma.customer.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: {
        id,
      },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' }, // Order their history newest to oldest
          take: 10, // Only grab their 5 most recent orders
          include: {
            items: true, // Bring in the order items too!
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    await this.findOne(id);

    if (updateCustomerDto.phone !== undefined) {
      const existingCustomer = await this.prisma.customer.findUnique({
        where: {
          phone: updateCustomerDto.phone,
        },
      });

      if (existingCustomer && existingCustomer.id !== id) {
        throw new ConflictException(
          'Another customer with this phone number already exists.',
        );
      }
    }

    return this.prisma.customer.update({
      where: {
        id,
      },
      data: updateCustomerDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.customer.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Customer deleted successfully.',
    };
  }
}
