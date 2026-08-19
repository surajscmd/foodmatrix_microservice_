import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { AttendanceService } from './attendance.service.js';
import { ClockInDto } from './dto/clock-in.dto.js';
import { ClockOutDto } from './dto/clock-out.dto.js';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  clockIn(@Body() dto: ClockInDto) {
    return this.attendanceService.clockIn(dto);
  }

  @Post('clock-out')
  clockOut(@Body() dto: ClockOutDto) {
    return this.attendanceService.clockOut(dto);
  }

  @Get()
  findAll(
    @Query('restaurantId') restaurantId?: string,
    @Query('staffId') staffId?: string,
  ) {
    return this.attendanceService.findAll(restaurantId, staffId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attendanceService.findOne(id);
  }
}
