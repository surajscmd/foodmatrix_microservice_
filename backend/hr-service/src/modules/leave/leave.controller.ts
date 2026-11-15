import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { LeaveService } from './leave.service.js';

import { CreateLeaveDto } from './dto/create-leave.dto.js';
import { UpdateLeaveDto } from './dto/update-leave.dto.js';
import { RevokeLeaveDto } from './dto/revoke-leave.dto.js';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { HrUser, restaurantScope } from '../../auth/hr-access.js';
import type { AuthenticatedUser } from '../../auth/auth.types.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';

@Controller('leaves')
@UseGuards(JwtAuthGuard)
export class LeaveController {
  constructor(
    private readonly leaveService: LeaveService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Create a new leave request.
   */
  @Post()
  async create(@HrUser() user: AuthenticatedUser, @Body() dto: CreateLeaveDto) {
    return this.leaveService.create(dto, user);
  }

  /**
   * Get leave requests.
   *
   * Optional filters:
   * - restaurantId
   * - staffId
   * - status
   */
  @Get()
  async findAll(
    @HrUser() user: AuthenticatedUser,
    @Query('restaurantId') restaurantId?: string,
    @Query('staffId') staffId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.leaveService.findAll(
      restaurantScope(user, restaurantId),
      staffId,
      status,
      startDate,
      endDate,
    );
  }

  /**
   * Get one leave request by ID.
   */
  @Get(':id')
  async findOne(
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const result = await this.leaveService.findOne(id);
    restaurantScope(user, result.data.restaurantId);
    return result;
  }

  /**
   * Update a pending leave request.
   */
  @Patch(':id')
  async update(
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeaveDto,
  ) {
    await this.findOne(user, id);
    if (dto.staffId) await this.checkStaff(user, dto.staffId);
    return this.leaveService.update(id, dto);
  }

  /**
   * Approve a pending leave request.
   */
  @Patch(':id/approve')
  async approve(
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.findOne(user, id);
    return this.leaveService.approve(id, user.systemUserId ?? user.id);
  }

  /**
   * Reject a pending leave request.
   */
  @Patch(':id/reject')
  async reject(
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.findOne(user, id);
    return this.leaveService.reject(id);
  }

  /**
   * Revoke pending or approved leave while preserving its history.
   */
  @Patch(':id/revoke')
  async revoke(
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RevokeLeaveDto,
  ) {
    return this.leaveService.revoke(id, dto, user);
  }

  /** Delete a pending leave request through the legacy API. */
  @Delete(':id')
  async remove(
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.findOne(user, id);
    return this.leaveService.remove(id);
  }

  private async checkStaff(user: AuthenticatedUser, id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      select: { restaurantId: true },
    });
    if (!staff) throw new NotFoundException('Staff not found');
    restaurantScope(user, staff.restaurantId);
  }
}

// | Method     | URL                                                  | Purpose                             | Body / Query                                                       |
// | ---------- | ---------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------ |
// | **POST**   | `/leaves`                                            | Create a new leave request          | `staffId`, `type`, `isPaidLeave`, `startDate`, `endDate`, `reason` |
// | **GET**    | `/leaves`                                            | Get all leave requests              | Optional: `restaurantId`, `staffId`, `status`                      |
// | **GET**    | `/leaves?restaurantId={restaurantId}`                | Get leaves for a restaurant         | `restaurantId`                                                     |
// | **GET**    | `/leaves?staffId={staffId}`                          | Get leaves for a staff member       | `staffId`                                                          |
// | **GET**    | `/leaves?status=PENDING`                             | Get pending leave requests          | `status`                                                           |
// | **GET**    | `/leaves?restaurantId={restaurantId}&status=PENDING` | Get pending leaves for a restaurant | `restaurantId`, `status`                                           |
// | **GET**    | `/leaves/{leaveId}`                                  | Get one leave request               | `leaveId`                                                          |
// | **PATCH**  | `/leaves/{leaveId}`                                  | Update a pending leave request      | Update fields                                                      |
// | **PATCH**  | `/leaves/{leaveId}/approve`                          | Approve a pending leave             | Body: `approvedById`                                               |
// | **PATCH**  | `/leaves/{leaveId}/reject`                           | Reject a pending leave              | No body                                                            |
// | **DELETE** | `/leaves/{leaveId}`                                  | Delete a pending leave              | `leaveId`                                                          |

// Leave workflow
// | Stage                    | API                         | Status                       |
// | ------------------------ | --------------------------- | ---------------------------- |
// | Employee applies         | `POST /leaves`              | `PENDING`                    |
// | Employee edits           | `PATCH /leaves/:id`         | `PENDING`                    |
// | Manager approves         | `PATCH /leaves/:id/approve` | `APPROVED`                   |
// | Manager rejects          | `PATCH /leaves/:id/reject`  | `REJECTED`                   |
// | Employee cancels/removes | `DELETE /leaves/:id`        | Deleted only while `PENDING` |
