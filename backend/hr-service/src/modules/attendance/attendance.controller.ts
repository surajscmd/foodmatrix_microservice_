import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';

import { AttendanceService } from './attendance.service.js';

import { ClockInDto } from './dto/clock-in.dto.js';
import { ClockOutDto } from './dto/clock-out.dto.js';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /**
   * Clock a staff member into their scheduled shift.
   */
  @Post('clock-in')
  async clockIn(@Body() dto: ClockInDto) {
    return this.attendanceService.clockIn(dto);
  }

  /**
   * Clock a staff member out of their active shift.
   */
  @Post('clock-out')
  async clockOut(@Body() dto: ClockOutDto) {
    return this.attendanceService.clockOut(dto);
  }

  /**
   * Get attendance records.
   *
   * Optional filters:
   * - restaurantId
   * - staffId
   */
  @Get()
  async findAll(
    @Query('restaurantId') restaurantId?: string,
    @Query('staffId') staffId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendanceService.findAll(
      restaurantId,
      staffId,
      startDate,
      endDate,
    );
  }

  /**
   * Get a single attendance record by ID.
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendanceService.findOne(id);
  }
}
// | Method   | URL                                                         | Purpose                                           | Body / Query                                 |
// | -------- | ----------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------- |
// | **POST** | `/attendance/clock-in`                                      | Clock a staff member into a scheduled shift       | `restaurantId`, `staffId`, `shiftScheduleId` |
// | **POST** | `/attendance/clock-out`                                     | Clock a staff member out of an active shift       | `shiftId`                                    |
// | **GET**  | `/attendance`                                               | Get all attendance records                        | Optional: `restaurantId`, `staffId`          |
// | **GET**  | `/attendance?restaurantId={restaurantId}`                   | Get attendance for a restaurant                   | `restaurantId`                               |
// | **GET**  | `/attendance?staffId={staffId}`                             | Get attendance for one staff member               | `staffId`                                    |
// | **GET**  | `/attendance?restaurantId={restaurantId}&staffId={staffId}` | Get one staff member's attendance at a restaurant | `restaurantId`, `staffId`                    |
// | **GET**  | `/attendance/{shiftId}`                                     | Get one attendance record                         | `shiftId`                                    |
