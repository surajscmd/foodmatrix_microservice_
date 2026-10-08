import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { LeaveStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

import { CreateLeaveDto } from './dto/create-leave.dto.js';
import { UpdateLeaveDto } from './dto/update-leave.dto.js';
import { KafkaProducerService } from '../kafka/kafka-producer.service.js';

@Injectable()
export class LeaveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  // =========================================================
  // CREATE
  // =========================================================

  /**
   * Create a new leave request.
   *
   * Validation:
   * - Staff must exist and must not be deleted.
   * - Start date must not be after end date.
   * - Staff cannot have overlapping pending/approved leave.
   */
  // =========================================================
  // CREATE
  // =========================================================

  /**
   * Create a new leave request.
   *
   * Validation:
   * - Staff must exist and must not be deleted.
   * - Start date must not be after end date.
   * - Staff cannot have overlapping pending/approved leave.
   *
   * After the leave is successfully created, a Kafka event
   * is published for the Notification Service.
   */
  async create(dto: CreateLeaveDto) {
    const { staffId, type, isPaidLeave, startDate, endDate, reason } = dto;

    // -------------------------------------------------------
    // Validate dates
    // -------------------------------------------------------

    const start = this.parseDate(startDate);

    const end = this.parseDate(endDate);

    this.validateDateRange(start, end);

    // -------------------------------------------------------
    // Validate staff
    // -------------------------------------------------------

    /*
     * Leave does not have restaurantId in the current schema,
     * so the restaurant is obtained from the staff record.
     */
    const staff = await this.prisma.staff.findFirst({
      where: {
        id: staffId,
        deletedAt: null,
      },

      select: {
        id: true,
        restaurantId: true,
      },
    });

    if (!staff) {
      throw new NotFoundException('Active staff member not found');
    }

    // -------------------------------------------------------
    // Check overlapping leave
    // -------------------------------------------------------

    const overlappingLeave = await this.prisma.leave.findFirst({
      where: {
        staffId,

        status: {
          in: [LeaveStatus.PENDING, LeaveStatus.APPROVED],
        },

        startDate: {
          lte: end,
        },

        endDate: {
          gte: start,
        },
      },

      select: {
        id: true,
      },
    });

    if (overlappingLeave) {
      throw new ConflictException(
        'Staff already has a leave during this period',
      );
    }

    // -------------------------------------------------------
    // Calculate leave duration
    // -------------------------------------------------------

    const totalDays = this.calculateTotalDays(start, end);

    // -------------------------------------------------------
    // Create leave
    // -------------------------------------------------------

    const leave = await this.prisma.leave.create({
      data: {
        staffId,
        type,
        isPaidLeave,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
      },

      include: {
        staff: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    // -------------------------------------------------------
    // Publish Kafka event
    // -------------------------------------------------------

    /*
     * Publish only after the database operation succeeds.
     *
     * This event is consumed by the Notification Service.
     */
    await this.kafkaProducer.publish('hr.leave-applied', {
      leaveId: leave.id,
      staffId: leave.staffId,
      restaurantId: staff.restaurantId,

      type: leave.type,
      isPaidLeave: leave.isPaidLeave,

      startDate: leave.startDate.toISOString(),

      endDate: leave.endDate.toISOString(),

      totalDays: leave.totalDays?.toString() ?? '0',
    });

    return {
      message: 'Leave request created successfully',
      data: leave,
    };
  }

  // =========================================================
  // FIND ALL
  // =========================================================

  /**
   * Get leave requests with optional filters.
   */
  async findAll(
    restaurantId?: string,
    staffId?: string,
    status?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const parsedStatus = this.parseLeaveStatus(status);

    const where: Prisma.LeaveWhereInput = {
      ...(staffId ? { staffId } : {}),

      ...(parsedStatus
        ? {
            status: parsedStatus,
          }
        : {}),

      ...(restaurantId
        ? {
            staff: {
              restaurantId,
            },
          }
        : {}),

      /*
       * Return leave records that overlap the requested period.
       *
       * Leave:
       *   startDate <= requestedEnd
       *   AND
       *   endDate >= requestedStart
       */
      ...(startDate || endDate
        ? {
            ...(endDate
              ? {
                  startDate: {
                    lte: this.parseDate(endDate),
                  },
                }
              : {}),

            ...(startDate
              ? {
                  endDate: {
                    gte: this.parseDate(startDate),
                  },
                }
              : {}),
          }
        : {}),
    };

    const leaves = await this.prisma.leave.findMany({
      where,

      include: {
        staff: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            role: true,
            restaurantId: true,
          },
        },
      },

      orderBy: {
        startDate: 'desc',
      },
    });

    return {
      message: 'Leaves fetched successfully',
      data: leaves,
    };
  }

  // =========================================================
  // FIND ONE
  // =========================================================

  /**
   * Get a single leave request by ID.
   */
  async findOne(id: string) {
    const leave = await this.prisma.leave.findUnique({
      where: {
        id,
      },

      include: {
        staff: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            role: true,
            restaurantId: true,
          },
        },
      },
    });

    if (!leave) {
      throw new NotFoundException('Leave not found');
    }

    return {
      message: 'Leave fetched successfully',
      data: leave,
    };
  }

  // =========================================================
  // UPDATE
  // =========================================================

  /**
   * Update a pending leave request.
   *
   * When dates or staff are changed, the complete
   * resulting request is validated again.
   */
  async update(id: string, dto: UpdateLeaveDto) {
    const existing = await this.prisma.leave.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Leave not found');
    }

    // Only pending requests can be modified.
    if (existing.status !== LeaveStatus.PENDING) {
      throw new ConflictException('Only pending leave requests can be updated');
    }

    const staffId = dto.staffId ?? existing.staffId;

    const startDate = dto.startDate
      ? this.parseDate(dto.startDate)
      : existing.startDate;

    const endDate = dto.endDate
      ? this.parseDate(dto.endDate)
      : existing.endDate;

    this.validateDateRange(startDate, endDate);

    // -------------------------------------------------------
    // Validate staff
    // -------------------------------------------------------

    const staff = await this.prisma.staff.findFirst({
      where: {
        id: staffId,
        deletedAt: null,
      },

      select: {
        id: true,
      },
    });

    if (!staff) {
      throw new NotFoundException('Active staff member not found');
    }

    // -------------------------------------------------------
    // Check overlapping leave
    // -------------------------------------------------------

    const overlappingLeave = await this.prisma.leave.findFirst({
      where: {
        id: {
          not: id,
        },

        staffId,

        status: {
          in: [LeaveStatus.PENDING, LeaveStatus.APPROVED],
        },

        startDate: {
          lte: endDate,
        },

        endDate: {
          gte: startDate,
        },
      },

      select: {
        id: true,
      },
    });

    if (overlappingLeave) {
      throw new ConflictException(
        'Staff already has a leave during this period',
      );
    }

    // -------------------------------------------------------
    // Calculate duration
    // -------------------------------------------------------

    const totalDays = this.calculateTotalDays(startDate, endDate);

    // -------------------------------------------------------
    // Update leave
    // -------------------------------------------------------

    const leave = await this.prisma.leave.update({
      where: {
        id,
      },

      data: {
        ...(dto.staffId !== undefined && {
          staffId: dto.staffId,
        }),

        ...(dto.type !== undefined && {
          type: dto.type,
        }),

        ...(dto.isPaidLeave !== undefined && {
          isPaidLeave: dto.isPaidLeave,
        }),

        ...(dto.startDate !== undefined && {
          startDate: startDate,
        }),

        ...(dto.endDate !== undefined && {
          endDate: endDate,
        }),

        ...(dto.reason !== undefined && {
          reason: dto.reason,
        }),

        totalDays,
      },

      include: {
        staff: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            role: true,
            restaurantId: true,
          },
        },
      },
    });

    return {
      message: 'Leave updated successfully',
      data: leave,
    };
  }

  // =========================================================
  // APPROVE
  // =========================================================

  /**
   * Approve a pending leave request.
   */
  async approve(id: string, approvedById: string) {
    const leave = await this.prisma.leave.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        staffId: true,
        status: true,
      },
    });

    if (!leave) {
      throw new NotFoundException('Leave not found');
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new ConflictException(
        'Only pending leave requests can be approved',
      );
    }

    // -------------------------------------------------------
    // Approve leave
    // -------------------------------------------------------

    const approvedLeave = await this.prisma.leave.update({
      where: {
        id,
      },

      data: {
        status: LeaveStatus.APPROVED,
        approvedById,
        approvedAt: new Date(),
      },

      include: {
        staff: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            role: true,
            restaurantId: true,
          },
        },
      },
    });

    return {
      message: 'Leave approved successfully',
      data: approvedLeave,
    };
  }

  // =========================================================
  // REJECT
  // =========================================================

  /**
   * Reject a pending leave request.
   */
  async reject(id: string) {
    const leave = await this.prisma.leave.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        status: true,
      },
    });

    if (!leave) {
      throw new NotFoundException('Leave not found');
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new ConflictException(
        'Only pending leave requests can be rejected',
      );
    }

    const rejectedLeave = await this.prisma.leave.update({
      where: {
        id,
      },

      data: {
        status: LeaveStatus.REJECTED,
      },

      include: {
        staff: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            role: true,
            restaurantId: true,
          },
        },
      },
    });

    return {
      message: 'Leave rejected successfully',
      data: rejectedLeave,
    };
  }

  // =========================================================
  // DELETE
  // =========================================================

  /**
   * Delete a pending leave request.
   */
  async remove(id: string) {
    const leave = await this.prisma.leave.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        status: true,
      },
    });

    if (!leave) {
      throw new NotFoundException('Leave not found');
    }

    // Approved/rejected requests should remain as records.
    if (leave.status !== LeaveStatus.PENDING) {
      throw new ConflictException('Only pending leave requests can be deleted');
    }

    await this.prisma.leave.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Leave deleted successfully',
    };
  }

  // =========================================================
  // HELPERS
  // =========================================================

  /**
   * Convert an incoming date string into a valid Date.
   */
  private parseDate(value: string): Date {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid date: ${value}`);
    }

    return date;
  }

  /**
   * Validate that the leave date range is valid.
   */
  private validateDateRange(startDate: Date, endDate: Date): void {
    if (startDate.getTime() > endDate.getTime()) {
      throw new BadRequestException('Start date cannot be after end date');
    }
  }

  /**
   * Calculate inclusive leave days.
   *
   * Example:
   * 10th → 10th = 1 day
   * 10th → 12th = 3 days
   */
  private calculateTotalDays(startDate: Date, endDate: Date): number {
    const start = this.startOfDay(startDate);
    const end = this.startOfDay(endDate);

    const millisecondsPerDay = 1000 * 60 * 60 * 24;

    return (
      Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay) + 1
    );
  }

  /**
   * Normalize a date to the beginning of its day
   * before calculating calendar-day differences.
   */
  private startOfDay(date: Date): Date {
    const result = new Date(date);

    result.setHours(0, 0, 0, 0);

    return result;
  }

  /**
   * Convert and validate the leave status
   * supplied through query parameters.
   */
  private parseLeaveStatus(status?: string): LeaveStatus | undefined {
    if (!status) {
      return undefined;
    }

    if (!Object.values(LeaveStatus).includes(status as LeaveStatus)) {
      throw new BadRequestException(`Invalid leave status: ${status}`);
    }

    return status as LeaveStatus;
  }
}
