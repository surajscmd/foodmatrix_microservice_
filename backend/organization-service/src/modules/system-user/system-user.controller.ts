import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateSystemUserDto } from './dto/create-system-user.dto.js';
import { UpdateSystemUserDto } from './dto/update-system-user.dto.js';
import { UpdateSystemUserStatusDto } from './dto/update-system-user-status.dto.js';

import { SystemUserService } from './system-user.service.js';

@Controller({ path: 'system-users', version: '1' })
export class SystemUserController {
  constructor(private readonly systemUserService: SystemUserService) {}

  // ==========================================================
  // CREATE
  // ==========================================================

  @Post()
  async create(@Body() CreateSystemUser: CreateSystemUserDto) {
    const systemUser = await this.systemUserService.create(CreateSystemUser);
    return {
      message: 'Franchise created successfully',
      data: systemUser,
    };
  }

  // ==========================================================
  // GET ALL
  // ==========================================================

  @Get()
  async findAll() {
    const systemUsers = await this.systemUserService.findAll();
    return {
      message: 'System users retrieved successfully',
      data: systemUsers,
    };
  }

  // ==========================================================
  // GET ONE
  // ==========================================================

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const systemUser = await this.systemUserService.findOne(id);
    return {
      message: 'System user retrieved successfully',
      data: systemUser,
    };
  }

  // ==========================================================
  // UPDATE
  // ==========================================================

  @Patch(':id')
  async update(@Param('id') id: string, @Body() payload: UpdateSystemUserDto) {
    const systemUser = await this.systemUserService.update(id, payload);
    return {
      message: 'System user updated successfully',
      data: systemUser,
    };
  }

  // ==========================================================
  // UPDATE STATUS
  // ==========================================================

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() payload: UpdateSystemUserStatusDto,
  ) {
    const systemUser = await this.systemUserService.updateStatus(id, payload);
    return {
      message: 'System user status updated successfully',
      data: systemUser,
    };
  }

  // ==========================================================
  // DELETE
  // ==========================================================

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const systemUser = await this.systemUserService.remove(id);
    return {
      message: 'System user deleted successfully',
      data: systemUser,
    };
  }
}
