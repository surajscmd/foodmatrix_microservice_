import type { RestaurantFilter } from '../../auth/hr-access.js';
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
import { dateInRestaurant } from '../payroll/hr-dates.js';

const staffSummary = {
  select: {
    id: true,
    employeeCode: true,
    firstName: true,
    lastName: true,
    role: true,
  },
};

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async clockIn(dto: ClockInDto, timeZone: string) {
    const { staffId, restaurantId, shiftScheduleId } = dto;
    const now = new Date();
    const wageDate = dateInRestaurant(now, timeZone);
    return this.prisma
      .$transaction(
        async (tx) => {
          const staff = await tx.staff.findFirst({
            where: {
              id: staffId,
              restaurantId,
              status: EmployeeStatus.ACTIVE,
              deletedAt: null,
            },
            select: { id: true },
          });
          if (!staff)
            throw new NotFoundException('Active staff member not found');

          const schedule = await tx.shiftSchedule.findFirst({
            where: {
              id: shiftScheduleId,
              staffId,
              restaurantId,
              status: ShiftScheduleStatus.SCHEDULED,
            },
            select: {
              scheduledStart: true,
              scheduledEnd: true,
              shiftTemplate: { select: { type: true } },
            },
          });
          if (!schedule)
            throw new NotFoundException(
              'Active shift schedule not found for this staff member',
            );
          if (now < schedule.scheduledStart || now >= schedule.scheduledEnd) {
            throw new ConflictException(
              'Clock-in is only available during the scheduled shift',
            );
          }

          const wage = await tx.wageHistory.findFirst({
            where: {
              staffId,
              effectiveStartDate: { lte: wageDate },
              OR: [
                { effectiveEndDate: null },
                { effectiveEndDate: { gte: wageDate } },
              ],
            },
            orderBy: { effectiveStartDate: 'desc' },
          });
          if (!wage)
            throw new ConflictException(
              'No active wage configuration found for staff member',
            );

          const shift = await tx.shift.create({
            data: {
              staffId,
              restaurantId,
              shiftScheduleId,
              shiftType: schedule.shiftTemplate.type,
              clockInAt: now,
              hourlyWageAtShift:
                wage.payType === 'HOURLY' ? wage.hourlyWage : null,
              overtimeRateAtShift:
                wage.payType === 'HOURLY' ? wage.overtimeRate : null,
            },
            include: { staff: staffSummary },
          });
          const event = {
            staffId,
            restaurantId,
            shiftId: shift.id,
            shiftScheduleId,
            clockInAt: now.toISOString(),
          };
          await this.kafkaProducer.enqueue(tx, 'hr.employee-signed-in', event);
          const lateMinutes = Math.floor(
            (now.getTime() - schedule.scheduledStart.getTime()) / 60_000,
          );
          if (lateMinutes > 0) {
            await this.kafkaProducer.enqueue(tx, 'hr.employee-late', {
              ...event,
              lateMinutes,
              scheduledStart: schedule.scheduledStart.toISOString(),
            });
          }
          return { message: 'Staff clocked in successfully', data: shift };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )
      .catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException(
            'Staff member already has an active shift, or this scheduled shift already has a punch',
          );
        }
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034'
        ) {
          throw new ConflictException(
            'Attendance changed while saving. Refresh and try again.',
          );
        }
        throw error;
      });
  }

  async clockOut({ shiftId }: ClockOutDto) {
    return this.prisma.$transaction(async (tx) => {
      const shift = await tx.shift.findUnique({
        where: { id: shiftId, voidedAt: null },
        include: {
          shiftSchedule: { select: { id: true, scheduledEnd: true } },
        },
      });
      if (!shift) throw new NotFoundException('Shift record not found');
      if (shift.clockOutAt)
        throw new ConflictException('Staff member has already clocked out');

      const clockOutAt = new Date();
      const totalHours =
        (clockOutAt.getTime() - shift.clockInAt.getTime()) / 3_600_000;
      if (totalHours <= 0)
        throw new BadRequestException(
          'Clock-out time must be after clock-in time',
        );

      const updated = await tx.shift.updateMany({
        where: {
          id: shiftId,
          clockOutAt: null,
          voidedAt: null,
          isProcessedForPay: false,
        },
        data: {
          clockOutAt,
          totalHours: new Prisma.Decimal(totalHours.toFixed(2)),
          regularHours: new Prisma.Decimal(Math.min(totalHours, 8).toFixed(2)),
          overtimeHours: new Prisma.Decimal(
            Math.max(totalHours - 8, 0).toFixed(2),
          ),
        },
      });
      if (!updated.count)
        throw new ConflictException(
          'This punch has already been closed or processed',
        );
      if (shift.shiftScheduleId) {
        await tx.shiftSchedule.updateMany({
          where: {
            id: shift.shiftScheduleId,
            status: ShiftScheduleStatus.SCHEDULED,
          },
          data: { status: ShiftScheduleStatus.COMPLETED },
        });
      }

      const schedule =
        shift.shiftSchedule ??
        (await tx.shiftSchedule.findFirst({
          where: {
            staffId: shift.staffId,
            restaurantId: shift.restaurantId,
            status: { not: ShiftScheduleStatus.CANCELLED },
            scheduledStart: { lte: shift.clockInAt },
            scheduledEnd: { gte: shift.clockInAt },
          },
          orderBy: { scheduledStart: 'asc' },
          select: { id: true, scheduledEnd: true },
        }));
      if (schedule && clockOutAt < schedule.scheduledEnd) {
        await this.kafkaProducer.enqueue(tx, 'hr.employee-clocked-out-early', {
          staffId: shift.staffId,
          restaurantId: shift.restaurantId,
          shiftId,
          shiftScheduleId: schedule.id,
          scheduledEnd: schedule.scheduledEnd.toISOString(),
          clockOutAt: clockOutAt.toISOString(),
          earlyMinutes: Math.floor(
            (schedule.scheduledEnd.getTime() - clockOutAt.getTime()) / 60_000,
          ),
        });
      }
      const data = await tx.shift.findUniqueOrThrow({
        where: { id: shiftId },
        include: { staff: staffSummary },
      });
      return { message: 'Staff clocked out successfully', data };
    });
  }

  async findAll(
    restaurantId?: RestaurantFilter,
    staffId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const where: Prisma.ShiftWhereInput = {
      voidedAt: null,
      ...(restaurantId ? { restaurantId } : {}),
      ...(staffId ? { staffId } : {}),
    };

    if (startDate || endDate) {
      const clockInFilter: Prisma.DateTimeFilter = {};

      if (startDate) {
        const parsedStart = new Date(startDate);

        if (Number.isNaN(parsedStart.getTime())) {
          throw new BadRequestException('Invalid startDate');
        }

        clockInFilter.gte = parsedStart;
      }

      if (endDate) {
        const parsedEnd = new Date(endDate);

        if (Number.isNaN(parsedEnd.getTime())) {
          throw new BadRequestException('Invalid endDate');
        }

        clockInFilter.lte = parsedEnd;
      }

      where.clockInAt = clockInFilter;
    }

    const shifts = await this.prisma.shift.findMany({
      where,

      orderBy: {
        clockInAt: 'desc',
      },

      include: { staff: staffSummary },
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
      where: { id, voidedAt: null },

      include: { staff: staffSummary },
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
