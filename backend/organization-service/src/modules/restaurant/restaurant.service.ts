import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, Restaurant } from '@prisma/client';

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

  async findAll(restaurantId?: string): Promise<Restaurant[]> {
    return this.prisma.restaurant.findMany({
      where: restaurantId
        ? {
            id: restaurantId,
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<Restaurant> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: {
        id,
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  async update(id: string, dto: UpdateRestaurantDto): Promise<Restaurant> {
    await this.findOne(id);

    try {
      return await this.prisma.restaurant.update({
        where: {
          id,
        },
        data: dto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Restaurant with this name already exists');
      }

      throw error;
    }
  }

  async remove(id: string): Promise<Restaurant> {
    await this.findOne(id);

    return this.prisma.restaurant.delete({
      where: {
        id,
      },
    });
  }
}
