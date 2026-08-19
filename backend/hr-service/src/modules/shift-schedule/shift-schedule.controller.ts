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

import { ShiftScheduleService } from './shift-schedule.service.js';
import { CreateShiftScheduleDto } from './dto/create-shift-schedule.dto.js';
import { UpdateShiftScheduleDto } from './dto/update-shift-schedule.dto.js';

@Controller('shift-schedules')
export class ShiftScheduleController {
  constructor(private readonly shiftScheduleService: ShiftScheduleService) {}

  @Post()
  create(@Body() dto: CreateShiftScheduleDto) {
    return this.shiftScheduleService.create(dto);
  }

  @Get()
  findAll(
    @Query('restaurantId') restaurantId?: string,
    @Query('staffId') staffId?: string,
  ) {
    return this.shiftScheduleService.findAll(restaurantId, staffId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shiftScheduleService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateShiftScheduleDto) {
    return this.shiftScheduleService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shiftScheduleService.remove(id);
  }
}
