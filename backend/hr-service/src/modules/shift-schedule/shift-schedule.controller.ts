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

import { ShiftScheduleService } from './shift-schedule.service.js';

import { CreateShiftScheduleDto } from './dto/create-shift-schedule.dto.js';
import { UpdateShiftScheduleDto } from './dto/update-shift-schedule.dto.js';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import {
  HrUser,
  restaurantDetails,
  restaurantScope,
} from '../../auth/hr-access.js';
import type { AuthenticatedUser } from '../../auth/auth.types.js';

@Controller('shift-schedules')
@UseGuards(JwtAuthGuard)
export class ShiftScheduleController {
  constructor(private readonly shiftScheduleService: ShiftScheduleService) {}

  /**
   * Create a new shift schedule for a staff member.
   */
  @Post()
  async create(
    @HrUser() user: AuthenticatedUser,
    @Body() dto: CreateShiftScheduleDto,
  ) {
    restaurantScope(user, dto.restaurantId);
    return this.shiftScheduleService.create(
      dto,
      restaurantDetails(user, dto.restaurantId).timezone,
    );
  }

  /**
   * Get shift schedules.
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
    return this.shiftScheduleService.findAll(
      restaurantScope(user, restaurantId, true),
      staffId,
      startDate,
      endDate,
    );
  }

  /**
   * Get a single shift schedule by ID.
   */
  @Get(':id')
  async findOne(
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const result = await this.shiftScheduleService.findOne(id);
    restaurantScope(user, result.data.restaurantId, true);
    return result;
  }

  /**
   * Update an existing shift schedule.
   */
  @Patch(':id')
  async update(
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShiftScheduleDto,
  ) {
    const { data } = await this.findOne(user, id);
    restaurantScope(user, data.restaurantId);
    if (dto.restaurantId) restaurantScope(user, dto.restaurantId);
    return this.shiftScheduleService.update(
      id,
      dto,
      restaurantDetails(user, dto.restaurantId ?? data.restaurantId).timezone,
      data.restaurantId,
    );
  }

  /**
   * Delete a shift schedule.
   */
  @Delete(':id')
  async remove(
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const { data } = await this.findOne(user, id);
    restaurantScope(user, data.restaurantId);
    return this.shiftScheduleService.remove(id, data.restaurantId);
  }
}

// | Method     | URL                                                              | Purpose                                            | Query / Body                                                                         |
// | ---------- | ---------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------ |
// | **POST**   | `/shift-schedules`                                               | Create a new shift schedule for a staff member     | Body: `restaurantId`, `staffId`, `shiftTemplateId`, `scheduledStart`, `scheduledEnd` |
// | **GET**    | `/shift-schedules`                                               | Get all shift schedules                            | Optional: `restaurantId`, `staffId`                                                  |
// | **GET**    | `/shift-schedules?restaurantId={restaurantId}`                   | Get schedules for a restaurant                     | `restaurantId`                                                                       |
// | **GET**    | `/shift-schedules?staffId={staffId}`                             | Get schedules for one staff member                 | `staffId`                                                                            |
// | **GET**    | `/shift-schedules?restaurantId={restaurantId}&staffId={staffId}` | Get a staff member's schedules within a restaurant | `restaurantId`, `staffId`                                                            |
// | **GET**    | `/shift-schedules/{scheduleId}`                                  | Get one schedule                                   | `scheduleId`                                                                         |
// | **PATCH**  | `/shift-schedules/{scheduleId}`                                  | Update a schedule                                  | Body: fields to update                                                               |
// | **DELETE** | `/shift-schedules/{scheduleId}`                                  | Delete a schedule                                  | `scheduleId`                                                                         |
