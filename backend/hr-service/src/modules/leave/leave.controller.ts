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

import { LeaveService } from './leave.service.js';

import { CreateLeaveDto } from './dto/create-leave.dto.js';
import { UpdateLeaveDto } from './dto/update-leave.dto.js';

@Controller('leaves')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  /**
   * Create a new leave request.
   */
  @Post()
  async create(@Body() dto: CreateLeaveDto) {
    return this.leaveService.create(dto);
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
    @Query('restaurantId') restaurantId?: string,
    @Query('staffId') staffId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.leaveService.findAll(
      restaurantId,
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
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.leaveService.findOne(id);
  }

  /**
   * Update a pending leave request.
   */
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeaveDto,
  ) {
    return this.leaveService.update(id, dto);
  }

  /**
   * Approve a pending leave request.
   */
  @Patch(':id/approve')
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('approvedById', ParseUUIDPipe) approvedById: string,
  ) {
    return this.leaveService.approve(id, approvedById);
  }

  /**
   * Reject a pending leave request.
   */
  @Patch(':id/reject')
  async reject(@Param('id', ParseUUIDPipe) id: string) {
    return this.leaveService.reject(id);
  }

  /**
   * Delete a pending leave request.
   */
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.leaveService.remove(id);
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
