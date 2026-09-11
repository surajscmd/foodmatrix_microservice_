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

import { WageService } from './wage.service.js';

import { CreateWageDto } from './dto/create-wage.dto.js';
import { UpdateWageDto } from './dto/update-wage.dto.js';

@Controller('wages')
export class WageController {
  constructor(private readonly wageService: WageService) {}

  // ======================================================
  // CREATE
  // ======================================================

  @Post()
  async create(@Body() dto: CreateWageDto) {
    const data = await this.wageService.create(dto);

    return {
      message: 'Wage history created successfully',
      data,
    };
  }

  // ======================================================
  // FIND ALL
  // ======================================================

  @Get()
  async findAll(
    @Query('staffId') staffId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const data = await this.wageService.findAll(
      staffId,
      Number(page),
      Number(limit),
    );

    return {
      message: 'Wage histories fetched successfully',
      data,
    };
  }

  // ======================================================
  // CURRENT WAGE
  // ======================================================

  @Get('staff/:staffId/current')
  async getCurrentWage(
    @Param('staffId', ParseUUIDPipe)
    staffId: string,
  ) {
    const data = await this.wageService.getCurrentWage(staffId);

    return {
      message: 'Current wage fetched successfully',
      data,
    };
  }

  // ======================================================
  // FIND ONE
  // ======================================================

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    const data = await this.wageService.findOne(id);

    return {
      message: 'Wage history fetched successfully',
      data,
    };
  }

  // ======================================================
  // UPDATE
  // ======================================================

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe)
    id: string,
    @Body() dto: UpdateWageDto,
  ) {
    const data = await this.wageService.update(id, dto);

    return {
      message: 'Wage history updated successfully',
      data,
    };
  }

  // ======================================================
  // DELETE
  // ======================================================

  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    const data = await this.wageService.remove(id);

    return {
      message: 'Wage history deleted successfully',
      data,
    };
  }
}
// | Method | URL                                                                       | Purpose                                                                  |
// | ------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
// | POST   | `http://localhost:3003/staff`                                             | Creates a new staff member and their initial wage record.                |
// | GET    | `http://localhost:3003/staff?restaurantId={restaurantId}&page=1&limit=10` | Fetches paginated staff for a restaurant.                                |
// | GET    | `http://localhost:3003/staff/{staffId}`                                   | Fetches one active staff member by ID.                                   |
// | PATCH  | `http://localhost:3003/staff/{staffId}`                                   | Updates staff profile details such as name, role, employee code, or PIN. |
// | PATCH  | `http://localhost:3003/staff/{staffId}/status`                            | Changes the employee status such as ACTIVE or ON_LEAVE.                  |
// | DELETE | `http://localhost:3003/staff/{staffId}`                                   | Soft-deletes the staff member and marks them TERMINATED.                 |

// WAGE
// | Method | URL                                                             | Purpose                                                          |
// | ------ | --------------------------------------------------------------- | ---------------------------------------------------------------- |
// | POST   | `http://localhost:3003/wages`                                   | Creates a new wage-history period for a staff member.            |
// | GET    | `http://localhost:3003/wages?staffId={staffId}&page=1&limit=10` | Fetches paginated wage history, optionally for one staff member. |
// | GET    | `http://localhost:3003/wages/{wageId}`                          | Fetches one wage-history record.                                 |
// | GET    | `http://localhost:3003/wages/staff/{staffId}/current`           | Fetches the currently active wage for the staff member.          |
// | PATCH  | `http://localhost:3003/wages/{wageId}`                          | Updates a wage-history record after validating its period.       |
// | DELETE | `http://localhost:3003/wages/{wageId}`                          | Deletes a wage-history record.                                   |
// //
