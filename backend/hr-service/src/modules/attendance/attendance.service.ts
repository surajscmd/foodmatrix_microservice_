import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EmployeeStatus, Prisma, ShiftScheduleStatus } from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

import { ClockInDto } from './dto/clock-in.dto.js';
import { ClockOutDto } from './dto/clock-out.dto.js';
import { KafkaProducerService } from '../kafka/kafka-producer.service.js';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  // ============================================================
  // CLOCK IN
  // ============================================================

  /**
   * Clock a staff member into a scheduled shift.
   *
   * Validation:
   * - Staff must belong to the restaurant.
   * - Staff must be active.
   * - Staff must not be soft deleted.
   * - Schedule must belong to the staff member and restaurant.
   * - Schedule must not be cancelled.
   * - Staff cannot already have an active shift.
   * - Staff must have an active wage configuration.
   */
  // ============================================================
  // CLOCK IN
  // ============================================================

  /**
  
   * Kafka events:
   * - hr.employee-signed-in
   * - hr.employee-late
   */
  async clockIn(dto: ClockInDto) {
    const { staffId, restaurantId, shiftScheduleId } = dto;

    // ----------------------------------------------------------
    // Current time
    // ----------------------------------------------------------

    const now = new Date();

    // ----------------------------------------------------------
    // Validate staff
    // ----------------------------------------------------------

    const staff = await this.prisma.staff.findFirst({
      where: {
        id: staffId,
        restaurantId,
        status: EmployeeStatus.ACTIVE,
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

    // ----------------------------------------------------------
    // Validate schedule
    // ----------------------------------------------------------

    const schedule = await this.prisma.shiftSchedule.findFirst({
      where: {
        id: shiftScheduleId,
        staffId,
        restaurantId,

        // Cancelled schedules cannot be clocked into.
        status: {
          not: ShiftScheduleStatus.CANCELLED,
        },
      },

      include: {
        shiftTemplate: {
          select: {
            type: true,

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
      throw new NotFoundException(
        'Shift schedule not found for this staff member',
      );
    }

    // ----------------------------------------------------------
    // Prevent duplicate active clock-in
    // ----------------------------------------------------------

    const activeShift = await this.prisma.shift.findFirst({
      where: {
        staffId,
        restaurantId,
        clockOutAt: null,
      },

      select: {
        id: true,
      },
    });

    if (activeShift) {
      throw new ConflictException('Staff member already has an active shift');
    }

    // ----------------------------------------------------------
    // Find current wage
    // ----------------------------------------------------------

    const wage = await this.prisma.wageHistory.findFirst({
      where: {
        staffId,

        effectiveStartDate: {
          lte: now,
        },

        OR: [
          {
            effectiveEndDate: null,
          },
          {
            effectiveEndDate: {
              gte: now,
            },
          },
        ],
      },

      orderBy: {
        effectiveStartDate: 'desc',
      },
    });

    if (!wage) {
      throw new ConflictException(
        'No active wage configuration found for staff member',
      );
    }

    // ----------------------------------------------------------
    // Create actual attendance record
    // ----------------------------------------------------------

    const shift = await this.prisma.shift.create({
      data: {
        staffId,
        restaurantId,

        shiftType: schedule.shiftTemplate.type,

        clockInAt: now,

        // Salary employees do not use hourly wage fields.
        hourlyWageAtShift: wage.payType === 'HOURLY' ? wage.hourlyWage : null,

        overtimeRateAtShift:
          wage.payType === 'HOURLY' ? wage.overtimeRate : null,
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

    // ==========================================================
    // KAFKA EVENTS
    // ==========================================================

    /*
     * The database operation has succeeded at this point,
     * so the employee signed-in event can be published.
     */
    await this.kafkaProducer.publish('hr.employee-signed-in', {
      staffId,
      restaurantId,
      shiftId: shift.id,
      shiftScheduleId,
      clockInAt: now.toISOString(),
    });

    // ----------------------------------------------------------
    // Late detection
    // ----------------------------------------------------------

    /*
     * Compare actual clock-in time with the scheduled start.
     *
     * Example:
     * Scheduled: 08:00
     * Actual:    08:12
     * Result:    12 minutes late
     */
    if (now.getTime() > schedule.scheduledStart.getTime()) {
      const lateMilliseconds =
        now.getTime() - schedule.scheduledStart.getTime();

      const lateMinutes = Math.floor(lateMilliseconds / (1000 * 60));

      await this.kafkaProducer.publish('hr.employee-late', {
        staffId,
        restaurantId,
        shiftId: shift.id,
        shiftScheduleId,
        scheduledStart: schedule.scheduledStart.toISOString(),
        clockInAt: now.toISOString(),
        lateMinutes,
      });
    }

    return {
      message: 'Staff clocked in successfully',
      data: shift,
    };
  }
  // ============================================================
  // CLOCK OUT
  // ============================================================

  /**
   * Clock a staff member out of an active shift.
   *
   * Calculates:
   * - Total hours
   * - Regular hours
   * - Overtime hours
   *
   * Kafka event:
   * - hr.employee-clocked-out-early
   */
  async clockOut(dto: ClockOutDto) {
    const { shiftId } = dto;

    // ----------------------------------------------------------
    // Find active shift
    // ----------------------------------------------------------

    const shift = await this.prisma.shift.findUnique({
      where: {
        id: shiftId,
      },

      select: {
        id: true,
        staffId: true,
        restaurantId: true,
        clockInAt: true,
        clockOutAt: true,
      },
    });

    if (!shift) {
      throw new NotFoundException('Shift record not found');
    }

    // ----------------------------------------------------------
    // Prevent duplicate clock-out
    // ----------------------------------------------------------

    if (shift.clockOutAt) {
      throw new ConflictException('Staff member has already clocked out');
    }

    // ----------------------------------------------------------
    // Current clock-out time
    // ----------------------------------------------------------

    const clockOutAt = new Date();

    // ----------------------------------------------------------
    // Calculate worked hours
    // ----------------------------------------------------------

    const milliseconds = clockOutAt.getTime() - shift.clockInAt.getTime();

    const totalHours = milliseconds / (1000 * 60 * 60);

    if (totalHours <= 0) {
      throw new BadRequestException(
        'Clock-out time must be after clock-in time',
      );
    }

    // ----------------------------------------------------------
    // Calculate regular and overtime hours
    // ----------------------------------------------------------

    const regularHours = Math.min(totalHours, 8);

    const overtimeHours = Math.max(totalHours - 8, 0);

    // ----------------------------------------------------------
    // Find schedule
    // ----------------------------------------------------------

    /*
     * Shift currently does not contain shiftScheduleId.
     *
     * We therefore resolve the schedule using the employee,
     * restaurant, and clock-in time.
     */
    const schedule = await this.prisma.shiftSchedule.findFirst({
      where: {
        staffId: shift.staffId,
        restaurantId: shift.restaurantId,

        status: {
          not: ShiftScheduleStatus.CANCELLED,
        },

        /*
         * The employee's clock-in should correspond to
         * the scheduled shift window.
         */
        scheduledStart: {
          lte: shift.clockInAt,
        },

        scheduledEnd: {
          gte: shift.clockInAt,
        },
      },

      orderBy: {
        scheduledStart: 'asc',
      },

      select: {
        id: true,
        scheduledStart: true,
        scheduledEnd: true,
      },
    });

    // ----------------------------------------------------------
    // Update attendance record
    // ----------------------------------------------------------

    const updatedShift = await this.prisma.shift.update({
      where: {
        id: shiftId,
      },

      data: {
        clockOutAt,

        totalHours: new Prisma.Decimal(totalHours.toFixed(2)),

        regularHours: new Prisma.Decimal(regularHours.toFixed(2)),

        overtimeHours: new Prisma.Decimal(overtimeHours.toFixed(2)),
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

    // ==========================================================
    // EARLY CLOCK-OUT DETECTION
    // ==========================================================

    /*
     * Only publish the early clock-out event when:
     *
     * actual clock-out < scheduled end
     */
    if (schedule && clockOutAt.getTime() < schedule.scheduledEnd.getTime()) {
      const earlyMilliseconds =
        schedule.scheduledEnd.getTime() - clockOutAt.getTime();

      const earlyMinutes = Math.floor(earlyMilliseconds / (1000 * 60));

      await this.kafkaProducer.publish('hr.employee-clocked-out-early', {
        staffId: shift.staffId,
        restaurantId: shift.restaurantId,

        shiftId: shift.id,

        shiftScheduleId: schedule.id,

        scheduledEnd: schedule.scheduledEnd.toISOString(),

        clockOutAt: clockOutAt.toISOString(),

        earlyMinutes,
      });
    }

    return {
      message: 'Staff clocked out successfully',
      data: updatedShift,
    };
  }

  // ============================================================
  // FIND ALL
  // ============================================================

  /**
   * Get attendance records.
   *
   * Optional filters:
   * - restaurantId
   * - staffId
   */
  async findAll(restaurantId?: string, staffId?: string) {
    const where: Prisma.ShiftWhereInput = {
      ...(restaurantId ? { restaurantId } : {}),

      ...(staffId ? { staffId } : {}),
    };

    const shifts = await this.prisma.shift.findMany({
      where,

      orderBy: {
        clockInAt: 'desc',
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

    return {
      message: 'Attendance records fetched successfully',
      data: shifts,
    };
  }

  // ============================================================
  // FIND ONE
  // ============================================================

  /**
   * Get a single attendance record.
   */
  async findOne(id: string) {
    const shift = await this.prisma.shift.findUnique({
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
      },
    });

    if (!shift) {
      throw new NotFoundException('Attendance record not found');
    }

    return {
      message: 'Attendance record fetched successfully',
      data: shift,
    };
  }
}
