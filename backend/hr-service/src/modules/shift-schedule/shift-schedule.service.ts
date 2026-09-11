import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ShiftScheduleStatus, ShiftTemplateStatus } from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

import { CreateShiftScheduleDto } from './dto/create-shift-schedule.dto.js';
import { UpdateShiftScheduleDto } from './dto/update-shift-schedule.dto.js';

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
  async create(dto: CreateShiftScheduleDto) {
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

    const staff = await this.prisma.staff.findFirst({
      where: {
        id: staffId,
        restaurantId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found for this restaurant');
    }

    // ----------------------------------------------------------
    // Validate shift template
    // ----------------------------------------------------------

    const template = await this.prisma.shiftTemplate.findFirst({
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

    const overlapping = await this.prisma.shiftSchedule.findFirst({
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

    const schedule = await this.prisma.shiftSchedule.create({
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
  async findAll(restaurantId?: string, staffId?: string) {
    const schedules = await this.prisma.shiftSchedule.findMany({
      where: {
        ...(restaurantId ? { restaurantId } : {}),

        ...(staffId ? { staffId } : {}),
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
  async update(id: string, dto: UpdateShiftScheduleDto) {
    const existing = await this.prisma.shiftSchedule.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Shift schedule not found');
    }

    // Resolve the final values for the updated schedule.
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

    const staff = await this.prisma.staff.findFirst({
      where: {
        id: staffId,
        restaurantId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found for this restaurant');
    }

    // ----------------------------------------------------------
    // Validate shift template
    // ----------------------------------------------------------

    const template = await this.prisma.shiftTemplate.findFirst({
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

    const overlapping = await this.prisma.shiftSchedule.findFirst({
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

    const schedule = await this.prisma.shiftSchedule.update({
      where: {
        id,
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
    });

    return {
      message: 'Shift schedule updated successfully',
      data: schedule,
    };
  }

  // ============================================================
  // DELETE
  // ============================================================

  /**
   * Delete a shift schedule.
   */
  async remove(id: string) {
    const existing = await this.prisma.shiftSchedule.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Shift schedule not found');
    }

    await this.prisma.shiftSchedule.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Shift schedule deleted successfully',
    };
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
