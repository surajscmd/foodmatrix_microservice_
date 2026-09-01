import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../lib/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================
  // CREATE CUSTOMER
  // =========================================================

  async create(createCustomerDto: CreateCustomerDto) {
    const { phone, name } = createCustomerDto;

    const existingCustomer = await this.prisma.customer.findUnique({
      where: { phone },
    });

    if (existingCustomer) {
      throw new ConflictException(
        'Customer with this phone number already exists.',
      );
    }

    return this.prisma.customer.create({
      data: {
        phone,
        name,
      },
    });
  }

  // =========================================================
  // GET ALL CUSTOMERS
  // =========================================================

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.customer.count(),
    ]);

    return {
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // =========================================================
  // GET CUSTOMER BY ID
  // =========================================================

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    return customer;
  }

  // =========================================================
  // GET ALL ORDERS FOR CUSTOMER
  // =========================================================

  async findOrdersByCustomer(id: string) {
    await this.ensureCustomerExists(id);

    return this.prisma.order.findMany({
      where: {
        customerId: id,
      },

      orderBy: {
        createdAt: 'desc',
      },

      include: {
        items: {
          orderBy: {
            id: 'asc',
          },

          include: {
            modifiers: true,
          },
        },

        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  // =========================================================
  // UPDATE CUSTOMER
  // =========================================================

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    await this.ensureCustomerExists(id);

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

  // =========================================================
  // DELETE CUSTOMER
  // =========================================================

  async remove(id: string) {
    await this.ensureCustomerExists(id);

    await this.prisma.customer.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Customer deleted successfully.',
    };
  }

  // =========================================================
  // PRIVATE HELPERS
  // =========================================================

  private async ensureCustomerExists(id: string): Promise<void> {
    const customer = await this.prisma.customer.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }
  }
}
