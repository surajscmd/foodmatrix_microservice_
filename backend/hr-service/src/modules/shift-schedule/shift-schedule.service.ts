import type { RestaurantFilter } from '../../auth/hr-access.js';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  Prisma,
  ShiftScheduleStatus,
  ShiftTemplateStatus,
} from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

import { CreateShiftScheduleDto } from './dto/create-shift-schedule.dto.js';
import { UpdateShiftScheduleDto } from './dto/update-shift-schedule.dto.js';
import { dateInRestaurant } from '../payroll/hr-dates.js';

@Injectable()
export class ShiftScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // CREATE
  // ============================================================

  /**
   * Create a new shift schedule.
   *
   * Validates:
   * - Date range
   * - Staff belongs to the restaurant
   * - Staff is not deleted
   * - Shift template belongs to the restaurant
   * - Shift template is active
   * - Staff does not have another overlapping shift
   */
  async create(dto: CreateShiftScheduleDto, timeZone?: string) {
    return this.scheduleTransaction(async (tx) => {
      const {
        restaurantId,
        staffId,
        shiftTemplateId,
        scheduledStart,
        scheduledEnd,
      } = dto;

      const start = new Date(scheduledStart);
      const end = new Date(scheduledEnd);

      // Validate the schedule time range.
      this.validateScheduleDates(start, end);

      // ----------------------------------------------------------
      // Validate staff
      // ----------------------------------------------------------

      const staff = await tx.staff.findFirst({
        where: {
          id: staffId,
          restaurantId,
          deletedAt: null,
          status: { not: 'TERMINATED' },
        },
        select: {
          id: true,
        },
      });

      if (!staff) {
        throw new NotFoundException('Staff not found for this restaurant');
      }
      await this.ensureNoApprovedLeave(
        tx,
        staffId,
        restaurantId,
        start,
        end,
        timeZone,
      );

      // ----------------------------------------------------------
      // Validate shift template
      // ----------------------------------------------------------

      const template = await tx.shiftTemplate.findFirst({
        where: {
          id: shiftTemplateId,
          restaurantId,
          status: ShiftTemplateStatus.ACTIVE,
        },
        select: {
          id: true,
        },
      });

      if (!template) {
        throw new NotFoundException(
          'Shift template not found for this restaurant',
        );
      }

      // ----------------------------------------------------------
      // Check overlapping schedule
      // ----------------------------------------------------------

      const overlapping = await tx.shiftSchedule.findFirst({
        where: {
          staffId,

          // Cancelled schedules do not block new schedules.
          status: {
            not: ShiftScheduleStatus.CANCELLED,
          },

          // Existing shift starts before the new shift ends.
          scheduledStart: {
            lt: end,
          },

          // Existing shift ends after the new shift starts.
          scheduledEnd: {
            gt: start,
          },
        },

        select: {
          id: true,
        },
      });

      if (overlapping) {
        throw new ConflictException('Staff already has an overlapping shift');
      }

      // ----------------------------------------------------------
      // Create schedule
      // ----------------------------------------------------------

      const schedule = await tx.shiftSchedule.create({
        data: {
          restaurantId,
          staffId,
          shiftTemplateId,
          scheduledStart: start,
          scheduledEnd: end,
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

          shiftTemplate: {
            include: {
              segments: {
                orderBy: {
                  sequence: 'asc',
                },
              },
            },
          },
        },
      });

      return {
        message: 'Shift scheduled successfully',
        data: schedule,
      };
    });
  }

  // ============================================================
  // FIND ALL
  // ============================================================

  /**
   * Get all shift schedules.
   *
   * Optional filters:
   * - restaurantId
   * - staffId
   */
  async findAll(
    restaurantId?: RestaurantFilter,
    staffId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const schedules = await this.prisma.shiftSchedule.findMany({
      where: {
        ...(restaurantId ? { restaurantId } : {}),
        ...(staffId ? { staffId } : {}),

        ...(startDate || endDate
          ? {
              AND: [
                ...(startDate
                  ? [
                      {
                        scheduledEnd: {
                          gte: new Date(startDate),
                        },
                      },
                    ]
                  : []),

                ...(endDate
                  ? [
                      {
                        scheduledStart: {
                          lte: new Date(endDate),
                        },
                      },
                    ]
                  : []),
              ],
            }
          : {}),
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

        shiftTemplate: {
          include: {
            segments: {
              orderBy: {
                sequence: 'asc',
              },
            },
          },
        },
      },

      orderBy: {
        scheduledStart: 'asc',
      },
    });

    return {
      message: 'Shift schedules fetched successfully',
      data: schedules,
    };
  }

  // ============================================================
  // FIND ONE
  // ============================================================

  /**
   * Get a single shift schedule by ID.
   */
  async findOne(id: string) {
    const schedule = await this.prisma.shiftSchedule.findUnique({
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
          },
        },

        shiftTemplate: {
          include: {
            segments: {
              orderBy: {
                sequence: 'asc',
              },
            },
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Shift schedule not found');
    }

    return {
      message: 'Shift schedule fetched successfully',
      data: schedule,
    };
  }

  // ============================================================
  // UPDATE
  // ============================================================

  /**
   * Update an existing shift schedule.
   *
   * PATCH requests are resolved against the existing record,
   * then the complete resulting schedule is validated.
   */
  async update(
    id: string,
    dto: UpdateShiftScheduleDto,
    timeZone: string,
    expectedRestaurantId: string,
  ) {
    return this.scheduleTransaction(async (tx) => {
      const existing = await tx.shiftSchedule.findUnique({
        where: {
          id,
          restaurantId: expectedRestaurantId,
        },
      });

      if (!existing) {
        throw new NotFoundException('Shift schedule not found');
      }

      // Resolve the final values for the updated schedule.
      await this.ensureEditable(tx, existing);
      const restaurantId = dto.restaurantId ?? existing.restaurantId;

      const staffId = dto.staffId ?? existing.staffId;

      const shiftTemplateId = dto.shiftTemplateId ?? existing.shiftTemplateId;

      const start = dto.scheduledStart
        ? new Date(dto.scheduledStart)
        : existing.scheduledStart;

      const end = dto.scheduledEnd
        ? new Date(dto.scheduledEnd)
        : existing.scheduledEnd;

      // Validate the resulting date range.
      this.validateScheduleDates(start, end);

      // ----------------------------------------------------------
      // Validate staff
      // ----------------------------------------------------------

      const staff = await tx.staff.findFirst({
        where: {
          id: staffId,
          restaurantId,
          deletedAt: null,
          status: { not: 'TERMINATED' },
        },
        select: {
          id: true,
        },
      });

      if (!staff) {
        throw new NotFoundException('Staff not found for this restaurant');
      }
      await this.ensureNoApprovedLeave(
        tx,
        staffId,
        restaurantId,
        start,
        end,
        timeZone,
      );

      // ----------------------------------------------------------
      // Validate shift template
      // ----------------------------------------------------------

      const template = await tx.shiftTemplate.findFirst({
        where: {
          id: shiftTemplateId,
          restaurantId,
          ...(shiftTemplateId !== existing.shiftTemplateId
            ? { status: ShiftTemplateStatus.ACTIVE }
            : {}),
        },
        select: {
          id: true,
        },
      });

      if (!template) {
        throw new NotFoundException(
          'Shift template not found for this restaurant',
        );
      }

      // ----------------------------------------------------------
      // Check overlapping schedule
      // ----------------------------------------------------------

      const overlapping = await tx.shiftSchedule.findFirst({
        where: {
          // Do not compare the schedule against itself.
          id: {
            not: id,
          },

          staffId,

          // Cancelled schedules do not block scheduling.
          status: {
            not: ShiftScheduleStatus.CANCELLED,
          },

          scheduledStart: {
            lt: end,
          },

          scheduledEnd: {
            gt: start,
          },
        },

        select: {
          id: true,
        },
      });

      if (overlapping) {
        throw new ConflictException('Staff already has an overlapping shift');
      }

      // ----------------------------------------------------------
      // Update schedule
      // ----------------------------------------------------------

      const schedule = await tx.shiftSchedule
        .update({
          where: {
            id,
            status: ShiftScheduleStatus.SCHEDULED,
            updatedAt: existing.updatedAt,
          },

          data: {
            restaurantId,
            staffId,
            shiftTemplateId,
            scheduledStart: start,
            scheduledEnd: end,
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

            shiftTemplate: {
              include: {
                segments: {
                  orderBy: {
                    sequence: 'asc',
                  },
                },
              },
            },
          },
        })
        .catch((error: unknown) => {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2025'
          ) {
            throw new ConflictException(
              'The shift changed. Refresh the roster and try again.',
            );
          }
          throw error;
        });

      return {
        message: 'Shift schedule updated successfully',
        data: schedule,
      };
    });
  }

  // ============================================================
  // DELETE
  // ============================================================

  /**
   * Delete a shift schedule.
   */
  async remove(id: string, expectedRestaurantId: string) {
    return this.scheduleTransaction(async (tx) => {
      const existing = await tx.shiftSchedule.findUnique({
        where: {
          id,
          restaurantId: expectedRestaurantId,
        },
      });

      if (!existing) {
        throw new NotFoundException('Shift schedule not found');
      }

      await this.ensureEditable(tx, existing);
      const removed = await tx.shiftSchedule.deleteMany({
        where: {
          id,
          status: ShiftScheduleStatus.SCHEDULED,
          updatedAt: existing.updatedAt,
        },
      });
      if (!removed.count)
        throw new ConflictException(
          'The shift changed. Refresh the roster and try again.',
        );

      return {
        message: 'Shift schedule deleted successfully',
      };
    });
  }

  private scheduleTransaction<T>(
    work: (tx: Prisma.TransactionClient) => Promise<T>,
  ) {
    return this.prisma
      .$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      })
      .catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          ['P2003', 'P2034'].includes(error.code)
        ) {
          throw new ConflictException(
            'The roster or attendance changed. Refresh and try again.',
          );
        }
        throw error;
      });
  }

  private async ensureEditable(
    tx: Prisma.TransactionClient,
    schedule: {
      id: string;
      status: ShiftScheduleStatus;
      staffId: string;
      restaurantId: string;
      scheduledStart: Date;
      scheduledEnd: Date;
    },
  ) {
    if (schedule.status !== ShiftScheduleStatus.SCHEDULED) {
      throw new ConflictException(
        'Only scheduled shifts can be edited or removed',
      );
    }
    const punch = await tx.shift.findFirst({
      where: {
        voidedAt: null,
        OR: [
          { shiftScheduleId: schedule.id },
          {
            shiftScheduleId: null,
            staffId: schedule.staffId,
            restaurantId: schedule.restaurantId,
            clockInAt: { lt: schedule.scheduledEnd },
            OR: [
              { clockOutAt: null },
              { clockOutAt: { gt: schedule.scheduledStart } },
            ],
          },
        ],
      },
      select: { id: true },
    });
    if (punch)
      throw new ConflictException(
        'This shift has attendance and cannot be edited or removed',
      );
  }

  private async ensureNoApprovedLeave(
    tx: Prisma.TransactionClient,
    staffId: string,
    restaurantId: string,
    start: Date,
    end: Date,
    timeZone?: string,
  ) {
    const leave = await tx.leave.findFirst({
      where: {
        staffId,
        restaurantId,
        status: 'APPROVED',
        startDate: {
          lte: dateInRestaurant(new Date(end.getTime() - 1), timeZone),
        },
        endDate: { gte: dateInRestaurant(start, timeZone) },
      },
      select: { id: true },
    });
    if (leave)
      throw new ConflictException(
        'This shift overlaps approved leave for the staff member',
      );
  }

  // ============================================================
  // VALIDATION
  // ============================================================

  /**
   * Validate scheduled start and end dates.
   */
  private validateScheduleDates(start: Date, end: Date): void {
    // Reject invalid Date values.
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid scheduled start or end date');
    }

    // A schedule must have a positive duration.
    if (start >= end) {
      throw new BadRequestException(
        'Scheduled start must be before scheduled end',
      );
    }
  }
}
