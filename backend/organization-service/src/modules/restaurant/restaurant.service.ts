import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, Restaurant, RestaurantStatus } from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

import { CreateRestaurantDto } from './dto/create-restaurant.dto.js';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto.js';

@Injectable()
export class RestaurantService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRestaurantDto): Promise<Restaurant> {
    const franchise = await this.prisma.franchise.findUnique({
      where: {
        id: dto.franchiseId,
      },
    });

    if (!franchise) {
      throw new NotFoundException('Franchise not found');
    }

    const existingRestaurant = await this.prisma.restaurant.findUnique({
      where: {
        franchiseId_name: {
          franchiseId: dto.franchiseId,
          name: dto.name,
        },
      },
    });

    if (existingRestaurant) {
      throw new ConflictException(
        'Restaurant already exists in this franchise',
      );
    }

    return this.prisma.restaurant.create({
      data: {
        name: dto.name,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        timezone: dto.timezone ?? 'UTC',
        status: dto.status,
        franchiseId: dto.franchiseId,
      },
    });
  }

  async findAll(scope: Prisma.RestaurantWhereInput): Promise<Restaurant[]> {
    return this.prisma.restaurant.findMany({
      where: scope,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, scope: Prisma.RestaurantWhereInput = {}) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { AND: [scope, { id }] },
      include: {
        franchise: {
          select: { defaultCurrency: true },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const { franchise, ...record } = restaurant;

    return {
      ...record,
      defaultCurrency: franchise.defaultCurrency,
    };
  }

  async update(
    id: string,
    dto: UpdateRestaurantDto,
    scope: Prisma.RestaurantWhereInput,
  ): Promise<Restaurant> {
    const update = {
      where: { id, AND: [scope] },
      data: dto,
    };
    try {
      if (!dto.status) return await this.prisma.restaurant.update(update);
      return await this.prisma.$transaction(
        async (tx) => {
          const restaurant = await tx.restaurant.update(update);
          if (dto.status === RestaurantStatus.INACTIVE) {
            const accounts = await tx.systemUser.findMany({
              where: { managedRestaurantId: id },
              select: { authUserId: true },
            });
            await tx.session.deleteMany({
              where: {
                userId: { in: accounts.map(({ authUserId }) => authUserId) },
              },
            });
          }
          return restaurant;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Restaurant not found');
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Restaurant with this name already exists');
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        throw new ConflictException(
          'Restaurant changed. Refresh and try again.',
        );
      }

      throw error;
    }
  }

  async remove(id: string): Promise<Restaurant> {
    return this.update(id, { status: RestaurantStatus.INACTIVE }, {});
  }
}
