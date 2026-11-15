import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { WageService } from './wage.service.js';

import { CreateWageDto } from './dto/create-wage.dto.js';
import { UpdateWageDto } from './dto/update-wage.dto.js';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import {
  HrUser,
  restaurantDetails,
  restaurantScope,
} from '../../auth/hr-access.js';
import type { AuthenticatedUser } from '../../auth/auth.types.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';

@Controller('wages')
@UseGuards(JwtAuthGuard)
export class WageController {
  constructor(
    private readonly wageService: WageService,
    private readonly prisma: PrismaService,
  ) {}

  private async checkStaff(user: AuthenticatedUser, id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      select: { restaurantId: true },
    });
    if (!staff) throw new NotFoundException('Staff not found');
    restaurantScope(user, staff.restaurantId);
    return staff.restaurantId;
  }

  // ======================================================
  // CREATE
  // ======================================================

  @Post()
  async create(@HrUser() user: AuthenticatedUser, @Body() dto: CreateWageDto) {
    this.requireHistoryEditor(user);
    await this.checkStaff(user, dto.staffId);
    const data = await this.wageService.create({
      ...dto,
      approvedById: user.systemUserId ?? user.id,
    });

    return {
      message: 'Wage history created successfully',
      data,
    };
  }

  @Post('changes')
  async scheduleChange(
    @HrUser() user: AuthenticatedUser,
    @Body() dto: CreateWageDto,
  ) {
    const restaurantId = await this.checkStaff(user, dto.staffId);
    const data = await this.wageService.scheduleChange(
      { ...dto, approvedById: user.systemUserId ?? user.id },
      restaurantDetails(user, restaurantId).timezone,
    );
    return { message: 'Wage change saved', data };
  }

  @Delete('changes/:id')
  async cancelChange(
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const wage = await this.wageService.findOne(id);
    const restaurantId = await this.checkStaff(user, wage.staffId);
    await this.wageService.cancelChange(
      id,
      restaurantDetails(user, restaurantId).timezone,
    );
    return { message: 'Scheduled wage change cancelled' };
  }

  // ======================================================
  // FIND ALL
  // ======================================================

  @Get()
  async findAll(
    @HrUser() user: AuthenticatedUser,
    @Query('staffId') staffId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const data = await this.wageService.findAll(
      staffId,
      Number(page),
      Number(limit),
      restaurantScope(user),
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
    @HrUser() user: AuthenticatedUser,
    @Param('staffId', ParseUUIDPipe)
    staffId: string,
  ) {
    const restaurantId = await this.checkStaff(user, staffId);
    const data = await this.wageService.getCurrentWage(
      staffId,
      restaurantDetails(user, restaurantId).timezone,
    );

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
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    const data = await this.wageService.findOne(id);
    await this.checkStaff(user, data.staffId);

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
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe)
    id: string,
    @Body() dto: UpdateWageDto,
  ) {
    this.requireHistoryEditor(user);
    await this.checkStaff(user, (await this.wageService.findOne(id)).staffId);
    if (dto.staffId) await this.checkStaff(user, dto.staffId);
    const data = await this.wageService.update(id, {
      ...dto,
      approvedById: user.systemUserId ?? user.id,
    });

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
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    this.requireHistoryEditor(user);
    await this.checkStaff(user, (await this.wageService.findOne(id)).staffId);
    const data = await this.wageService.remove(id);

    return {
      message: 'Wage history deleted successfully',
      data,
    };
  }

  private requireHistoryEditor(user: AuthenticatedUser) {
    if (user.role === 'RESTAURANT_ADMIN') {
      throw new ForbiddenException(
        'Use scheduled wage changes to preserve existing wage history',
      );
    }
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
