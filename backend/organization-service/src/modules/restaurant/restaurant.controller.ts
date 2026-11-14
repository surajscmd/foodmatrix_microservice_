import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { SystemUserRole } from '@prisma/client';

import {
  AuthGuard,
  AuthenticatedRequest,
  Roles,
} from '../../auth/auth.guard.js';

import { CreateRestaurantDto } from './dto/create-restaurant.dto.js';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto.js';
import { RestaurantService } from './restaurant.service.js';

@Controller('restaurants')
@UseGuards(AuthGuard)
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Post()
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.FRANCHISE_ADMIN)
  async create(@Body() dto: CreateRestaurantDto) {
    const data = await this.restaurantService.create(dto);

    return {
      message: 'Restaurant created successfully',
      data,
    };
  }

  @Get()
  @Roles(
    SystemUserRole.SUPER_ADMIN,
    SystemUserRole.FRANCHISE_ADMIN,
    SystemUserRole.RESTAURANT_ADMIN,
  )
  async findAll(@Req() req: AuthenticatedRequest) {
    const user = req.user!;

    const restaurantId =
      user.role === SystemUserRole.RESTAURANT_ADMIN
        ? (user.managedRestaurantId ?? undefined)
        : undefined;

    const data = await this.restaurantService.findAll(restaurantId);

    return {
      message: 'Restaurants fetched successfully',
      data,
    };
  }

  @Get(':id')
  @Roles(
    SystemUserRole.SUPER_ADMIN,
    SystemUserRole.FRANCHISE_ADMIN,
    SystemUserRole.RESTAURANT_ADMIN,
    SystemUserRole.STAFF,
  )
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const user = req.user!;

    if (
      (user.role === SystemUserRole.RESTAURANT_ADMIN ||
        user.role === SystemUserRole.STAFF) &&
      user.managedRestaurantId !== id
    ) {
      throw new ForbiddenException('You do not have access to this restaurant');
    }

    return {
      message: 'Restaurant fetched successfully',
      data: await this.restaurantService.findOne(id),
    };
  }
  @Patch(':id')
  @Roles(
    SystemUserRole.SUPER_ADMIN,
    SystemUserRole.FRANCHISE_ADMIN,
    SystemUserRole.RESTAURANT_ADMIN,
  )
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRestaurantDto,
  ) {
    const user = req.user!;

    if (
      user.role === SystemUserRole.RESTAURANT_ADMIN &&
      user.managedRestaurantId !== id
    ) {
      throw new ForbiddenException('You do not have access to this restaurant');
    }

    const data = await this.restaurantService.update(id, dto);

    return {
      message: 'Restaurant updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Roles(SystemUserRole.SUPER_ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.restaurantService.remove(id);

    return {
      message: 'Restaurant deleted successfully',
      data,
    };
  }
}
