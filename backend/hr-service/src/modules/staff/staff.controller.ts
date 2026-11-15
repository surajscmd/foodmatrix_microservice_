import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { StaffService } from './staff.service.js';

import { CreateStaffDto } from './dto/create-staff.dto.js';
import { UpdateStaffDto } from './dto/update-staff.dto.js';
import { UpdateStaffStatusDto } from './dto/update-staff-status.dto.js';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import {
  HrUser,
  restaurantDetails,
  restaurantScope,
} from '../../auth/hr-access.js';
import type { AuthenticatedUser } from '../../auth/auth.types.js';
import { EmployeeStatus } from '@prisma/client';

@Controller('staff')
@UseGuards(JwtAuthGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  // ======================================================
  // CREATE
  // ======================================================

  @Post()
  async create(@HrUser() user: AuthenticatedUser, @Body() dto: CreateStaffDto) {
    restaurantScope(user, dto.restaurantId);
    const data = await this.staffService.create(
      { ...dto, approvedById: user.systemUserId ?? user.id },
      restaurantDetails(user, dto.restaurantId).timezone,
    );

    return {
      message: 'Staff created successfully',
      data,
    };
  }

  // ======================================================
  // GET ALL
  // ======================================================

  @Get()
  async findAll(
    @HrUser() user: AuthenticatedUser,
    @Query('restaurantId') requestedRestaurant?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
    @Query('status') status?: EmployeeStatus,
    @Query('directory') directory?: string,
  ) {
    const restaurantId = restaurantScope(user, requestedRestaurant, true);
    const data = await this.staffService.findAll(
      restaurantId,
      Number(page),
      Number(limit),
      search,
      status,
      user.role !== 'STAFF' && directory !== 'true',
    );

    return {
      message: 'Staff fetched successfully',
      data,
    };
  }

  // ======================================================
  // GET ONE
  // ======================================================

  @Get(':id')
  async findOne(
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const data = await this.staffService.findOne(id);
    restaurantScope(user, data.restaurantId);

    return {
      message: 'Staff fetched successfully',
      data,
    };
  }

  // ======================================================
  // UPDATE
  // ======================================================

  @Patch(':id')
  async update(
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStaffDto,
  ) {
    const data = await this.staffService.update(id, dto, user);

    return {
      message: 'Staff updated successfully',
      data,
    };
  }

  // ======================================================
  // UPDATE STATUS
  // ======================================================

  @Patch(':id/status')
  async updateStatus(
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStaffStatusDto,
  ) {
    const data = await this.staffService.updateStatus(id, dto.status, user);

    return {
      message: 'Staff status updated successfully',
      data,
    };
  }

  // ======================================================
  // SOFT DELETE
  // ======================================================

  @Delete(':id')
  async remove(
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const data = await this.staffService.remove(id, user);

    return {
      message: 'Staff removed successfully',
      data,
    };
  }
}
