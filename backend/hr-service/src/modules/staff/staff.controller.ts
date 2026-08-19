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
import { CreateWageHistoryDto } from './dto/create-wage-history.dto.js';

@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  async create(@Body() createStaffDto: CreateStaffDto) {
    const staffAdditon = await this.staffService.create(createStaffDto);
    return {
      message: 'Staff added successfully',
      data: staffAdditon,
    };
  }

  @Get()
  async findAll(@Query('restaurantId') restaurantId?: string) {
    const staff = await this.staffService.findAll(restaurantId);
    return {
      message: 'Staffs fetched successfully',
      data: staff,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const staff = await this.staffService.findOne(id);
    return {
      message: 'Staff  fetched By Id successfully',
      data: staff,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStaffDto: UpdateStaffDto,
  ) {
    const staff = await this.staffService.update(id, updateStaffDto);
    return {
      message: 'Staff updated successfully',
      data: staff,
    };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStaffStatusDto: UpdateStaffStatusDto,
  ) {
    const staff = await this.staffService.updateStatus(
      id,
      updateStaffStatusDto.status,
    );
    return {
      message: 'Staff status updated successfully',
      data: staff,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const staff = await this.staffService.remove(id);
    return {
      message: 'Staff removed successfully',
      data: staff,
    };
  }
  // --- WAGE HISTORY MANAGEMENT ---
  @Post(':id/wage')
  async updateWage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateWageHistoryDto,
  ) {
    const wageHistory = await this.staffService.updateWage(id, dto);
    return {
      message: 'Wage history updated successfully',
      data: wageHistory,
    };
  }

  @Get(':id/wage')
  async getWageHistory(@Param('id', ParseUUIDPipe) id: string) {
    const wageHistory = await this.staffService.getWageHistory(id);
    return {
      message: 'Wage history fetched successfully',
      data: wageHistory,
    };
  }
}
