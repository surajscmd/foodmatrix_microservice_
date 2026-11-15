import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AttendanceService } from './attendance.service.js';

import { ClockInDto } from './dto/clock-in.dto.js';
import { ClockOutDto } from './dto/clock-out.dto.js';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import {
  HrUser,
  restaurantDetails,
  restaurantScope,
} from '../../auth/hr-access.js';
import type { AuthenticatedUser } from '../../auth/auth.types.js';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /**
   * Clock a staff member into their scheduled shift.
   */
  @Post('clock-in')
  async clockIn(@HrUser() user: AuthenticatedUser, @Body() dto: ClockInDto) {
    restaurantScope(user, dto.restaurantId, true);
    return this.attendanceService.clockIn(
      dto,
      restaurantDetails(user, dto.restaurantId).timezone,
    );
  }

  /**
   * Clock a staff member out of their active shift.
   */
  @Post('clock-out')
  async clockOut(@HrUser() user: AuthenticatedUser, @Body() dto: ClockOutDto) {
    const { data } = await this.attendanceService.findOne(dto.shiftId);
    restaurantScope(user, data.restaurantId, true);
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
    @HrUser() user: AuthenticatedUser,
    @Query('restaurantId') restaurantId?: string,
    @Query('staffId') staffId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendanceService.findAll(
      restaurantScope(user, restaurantId, true),
      staffId,
      startDate,
      endDate,
    );
  }

  /**
   * Get a single attendance record by ID.
   */
  @Get(':id')
  async findOne(
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const result = await this.attendanceService.findOne(id);
    restaurantScope(user, result.data.restaurantId, true);
    return result;
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
