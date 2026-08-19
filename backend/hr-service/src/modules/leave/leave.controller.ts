import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { LeaveService } from './leave.service.js';

import { CreateLeaveDto } from './dto/create-leave.dto.js';
import { UpdateLeaveDto } from './dto/update-leave.dto.js';

@Controller('leaves')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post()
  create(
    @Body()
    dto: CreateLeaveDto,
  ) {
    return this.leaveService.create(dto);
  }

  @Get()
  findAll(
    @Query('restaurantId')
    restaurantId?: string,

    @Query('staffId')
    staffId?: string,

    @Query('status')
    status?: string,
  ) {
    return this.leaveService.findAll(restaurantId, staffId, status);
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.leaveService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateLeaveDto,
  ) {
    return this.leaveService.update(id, dto);
  }

  @Patch(':id/approve')
  approve(
    @Param('id')
    id: string,

    @Body('approvedById')
    approvedById: string,
  ) {
    return this.leaveService.approve(id, approvedById);
  }

  @Patch(':id/reject')
  reject(
    @Param('id')
    id: string,
  ) {
    return this.leaveService.reject(id);
  }

  @Delete(':id')
  remove(
    @Param('id')
    id: string,
  ) {
    return this.leaveService.remove(id);
  }
}
