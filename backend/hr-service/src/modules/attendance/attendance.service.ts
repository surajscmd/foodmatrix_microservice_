import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

import { ClockInDto } from './dto/clock-in.dto.js';
import { ClockOutDto } from './dto/clock-out.dto.js';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  // ======================================================
  // CLOCK IN
  // ======================================================

  async clockIn(dto: ClockInDto) {
    const { staffId, restaurantId, shiftScheduleId } = dto;

    // --------------------------------------------------
    // 1. Verify staff
    // --------------------------------------------------

    const staff = await this.prisma.staff.findFirst({
      where: {
        id: staffId,
        restaurantId,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    if (!staff) {
      throw new NotFoundException('Active staff member not found');
    }

    // --------------------------------------------------
    // 2. Verify schedule
    // --------------------------------------------------

    const schedule = await this.prisma.shiftSchedule.findFirst({
      where: {
        id: shiftScheduleId,
        staffId,
        restaurantId,
        status: 'SCHEDULED',
      },
      include: {
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
      throw new NotFoundException('Scheduled shift not found');
    }

    // --------------------------------------------------
    // 3. Prevent duplicate active clock-in
    // --------------------------------------------------

    const activeShift = await this.prisma.shift.findFirst({
      where: {
        staffId,
        restaurantId,
        clockOutAt: null,
      },
    });

    if (activeShift) {
      throw new ConflictException('Staff member already has an active shift');
    }

    // --------------------------------------------------
    // 4. Get current wage
    // --------------------------------------------------

    const now = new Date();

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

    // --------------------------------------------------
    // 5. Create actual Shift record
    // --------------------------------------------------

    const shift = await this.prisma.shift.create({
      data: {
        staffId,
        restaurantId,

        shiftType: schedule.shiftTemplate.type,

        clockInAt: now,

        hourlyWageAtShift: wage.payType === 'HOURLY' ? wage.hourlyWage : null,

        overtimeRateAtShift:
          wage.payType === 'HOURLY' ? wage.overtimeRate : null,
      },
    });

    return {
      message: 'Staff clocked in successfully',
      data: shift,
    };
  }

  // ======================================================
  // CLOCK OUT
  // ======================================================

  async clockOut(dto: ClockOutDto) {
    const { shiftId } = dto;

    // --------------------------------------------------
    // 1. Find active shift
    // --------------------------------------------------

    const shift = await this.prisma.shift.findUnique({
      where: {
        id: shiftId,
      },
    });

    if (!shift) {
      throw new NotFoundException('Shift record not found');
    }

    if (shift.clockOutAt) {
      throw new ConflictException('Staff member has already clocked out');
    }

    // --------------------------------------------------
    // 2. Calculate worked hours
    // --------------------------------------------------

    const clockOutAt = new Date();

    const clockInAt = new Date(shift.clockInAt);

    const milliseconds = clockOutAt.getTime() - clockInAt.getTime();

    const totalHours = milliseconds / (1000 * 60 * 60);

    // --------------------------------------------------
    // 3. Calculate regular + overtime
    // --------------------------------------------------

    const regularHours = Math.min(totalHours, 8);

    const overtimeHours = Math.max(totalHours - 8, 0);

    // --------------------------------------------------
    // 4. Update shift
    // --------------------------------------------------

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
    });

    return {
      message: 'Staff clocked out successfully',
      data: updatedShift,
    };
  }

  // ======================================================
  // FIND ALL
  // ======================================================

  async findAll(restaurantId?: string, staffId?: string) {
    const where: Prisma.ShiftWhereInput = {
      ...(restaurantId && { restaurantId }),
      ...(staffId && { staffId }),
    };

    const shifts = await this.prisma.shift.findMany({
      where,

      orderBy: {
        clockInAt: 'desc',
      },

      include: {
        staff: true,
      },
    });

    return {
      message: 'Attendance records fetched successfully',
      data: shifts,
    };
  }

  // ======================================================
  // FIND ONE
  // ======================================================

  async findOne(id: string) {
    const shift = await this.prisma.shift.findUnique({
      where: {
        id,
      },

      include: {
        staff: true,
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
