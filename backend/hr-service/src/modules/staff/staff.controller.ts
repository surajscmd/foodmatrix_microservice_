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
} from '@nestjs/common';

import { StaffService } from './staff.service.js';

import { CreateStaffDto } from './dto/create-staff.dto.js';
import { UpdateStaffDto } from './dto/update-staff.dto.js';
import { UpdateStaffStatusDto } from './dto/update-staff-status.dto.js';

@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  // ======================================================
  // CREATE
  // ======================================================

  @Post()
  async create(@Body() dto: CreateStaffDto) {
    const data = await this.staffService.create(dto);

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
    @Query('restaurantId') restaurantId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const data = await this.staffService.findAll(
      restaurantId,
      Number(page),
      Number(limit),
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
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.staffService.findOne(id);

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
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStaffDto,
  ) {
    const data = await this.staffService.update(id, dto);

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
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStaffStatusDto,
  ) {
    const data = await this.staffService.updateStatus(id, dto.status);

    return {
      message: 'Staff status updated successfully',
      data,
    };
  }

  // ======================================================
  // SOFT DELETE
  // ======================================================

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.staffService.remove(id);

    return {
      message: 'Staff removed successfully',
      data,
    };
  }
}
