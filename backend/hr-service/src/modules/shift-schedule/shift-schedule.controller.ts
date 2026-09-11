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

import { ShiftScheduleService } from './shift-schedule.service.js';

import { CreateShiftScheduleDto } from './dto/create-shift-schedule.dto.js';
import { UpdateShiftScheduleDto } from './dto/update-shift-schedule.dto.js';

@Controller('shift-schedules')
export class ShiftScheduleController {
  constructor(private readonly shiftScheduleService: ShiftScheduleService) {}

  /**
   * Create a new shift schedule for a staff member.
   */
  @Post()
  async create(@Body() dto: CreateShiftScheduleDto) {
    return this.shiftScheduleService.create(dto);
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
    @Query('restaurantId') restaurantId?: string,
    @Query('staffId') staffId?: string,
  ) {
    return this.shiftScheduleService.findAll(restaurantId, staffId);
  }

  /**
   * Get a single shift schedule by ID.
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.shiftScheduleService.findOne(id);
  }

  /**
   * Update an existing shift schedule.
   */
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShiftScheduleDto,
  ) {
    return this.shiftScheduleService.update(id, dto);
  }

  /**
   * Delete a shift schedule.
   */
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.shiftScheduleService.remove(id);
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
