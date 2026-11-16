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
import { AuthGuard, Roles } from '../../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../../auth/auth.guard.js';
import {
  requiredFranchise,
  restaurantScope,
} from '../../auth/organization-scope.js';
import { CreateRestaurantDto } from './dto/create-restaurant.dto.js';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto.js';
import { RestaurantService } from './restaurant.service.js';

@Controller('restaurants')
@UseGuards(AuthGuard)
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Post()
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.FRANCHISE_ADMIN)
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateRestaurantDto,
  ) {
    const data = await this.restaurantService.create({
      ...dto,
      franchiseId: requiredFranchise(req.user!, dto.franchiseId),
    });
    return { message: 'Restaurant created successfully', data };
  }

  @Get()
  @Roles(
    SystemUserRole.SUPER_ADMIN,
    SystemUserRole.FRANCHISE_ADMIN,
    SystemUserRole.RESTAURANT_ADMIN,
    SystemUserRole.OPERATIONS,
  )
  async findAll(@Req() req: AuthenticatedRequest) {
    const data = await this.restaurantService.findAll(
      restaurantScope(req.user!),
    );
    return { message: 'Restaurants fetched successfully', data };
  }

  @Get(':id')
  @Roles(
    SystemUserRole.SUPER_ADMIN,
    SystemUserRole.FRANCHISE_ADMIN,
    SystemUserRole.RESTAURANT_ADMIN,
    SystemUserRole.STAFF,
    SystemUserRole.OPERATIONS,
  )
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const data = await this.restaurantService.findOne(
      id,
      restaurantScope(req.user!),
    );
    return { message: 'Restaurant fetched successfully', data };
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
    if (
      dto.status !== undefined &&
      req.user!.role === SystemUserRole.RESTAURANT_ADMIN
    ) {
      throw new ForbiddenException(
        'Only central administrators can change restaurant status',
      );
    }
    const data = await this.restaurantService.update(
      id,
      dto,
      restaurantScope(req.user!),
    );
    return { message: 'Restaurant updated successfully', data };
  }

  @Delete(':id')
  @Roles(SystemUserRole.SUPER_ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.restaurantService.remove(id);
    return { message: 'Restaurant deactivated successfully', data };
  }
}
