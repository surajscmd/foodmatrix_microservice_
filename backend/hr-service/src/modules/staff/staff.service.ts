import {
  restaurantDetails,
  restaurantScope,
  type RestaurantFilter,
} from '../../auth/hr-access.js';
import type { AuthenticatedUser } from '../../auth/auth.types.js';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EmployeeStatus, PayType, Prisma } from '@prisma/client';

import { hash } from 'bcrypt';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

import { CreateStaffDto } from './dto/create-staff.dto.js';
import { UpdateStaffDto } from './dto/update-staff.dto.js';
import { addDays, dateInRestaurant } from '../payroll/hr-dates.js';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  // ======================================================
  // SAFE STAFF SELECT
  // Never expose pinHash
  // ======================================================

  private readonly safeStaffSelect: Prisma.StaffSelect = {
    id: true,
    restaurantId: true,
    employeeCode: true,
    firstName: true,
    lastName: true,
    role: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    terminatedAt: true,

    wageHistories: {
      where: {
        effectiveEndDate: null,
      },
      orderBy: {
        effectiveStartDate: 'desc',
      },
      take: 1,
    },
  };

  // ======================================================
  // CREATE STAFF
  // Creates initial wage record
  // ======================================================

  async create(dto: CreateStaffDto, timeZone?: string) {
    const {
      restaurantId,
      employeeCode,
      firstName,
      lastName,
      role,
      pin,
      payType = PayType.HOURLY,
      hourlyWage,
      overtimeRate,
      salaryAmount,
      approvedById,
    } = dto;

    // ----------------------------------------------------
    // VALIDATE PAY TYPE
    // ----------------------------------------------------

    this.validatePayType(payType, hourlyWage, salaryAmount);
    if (payType === PayType.SALARY && overtimeRate !== undefined) {
      throw new BadRequestException('Overtime rate applies to hourly pay');
    }

    // ----------------------------------------------------
    // DUPLICATE EMPLOYEE CODE
    // ----------------------------------------------------

    const existingStaff = await this.prisma.staff.findUnique({
      where: {
        restaurantId_employeeCode: {
          restaurantId,
          employeeCode,
        },
      },
    });

    if (existingStaff) {
      throw new ConflictException(
        'Employee code already exists for this restaurant',
      );
    }

    // ----------------------------------------------------
    // HASH PIN
    // ----------------------------------------------------

    const pinHash = await hash(pin, 10);

    // ----------------------------------------------------
    // CREATE STAFF + INITIAL WAGE
    //
    // Nested Prisma create is atomic.
    // ----------------------------------------------------

    const startsOn = dateInRestaurant(new Date(), timeZone);
    const staff = await this.prisma.staff
      .create({
        data: {
          restaurantId,
          employeeCode,
          firstName,
          lastName,
          role,
          pinHash,

          assignments: { create: { restaurantId, startsOn } },
          wageHistories: {
            create: {
              payType,
              hourlyWage:
                hourlyWage !== undefined
                  ? new Prisma.Decimal(hourlyWage)
                  : null,

              overtimeRate:
                overtimeRate !== undefined
                  ? new Prisma.Decimal(overtimeRate)
                  : null,

              salaryAmount:
                salaryAmount !== undefined
                  ? new Prisma.Decimal(salaryAmount)
                  : null,

              effectiveStartDate: startsOn,
              approvedById,
            },
          },
        },

        select: this.safeStaffSelect,
      })
      .catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException(
            'Employee code already exists for this restaurant',
          );
        }
        throw error;
      });

    return staff;
  }

  // ======================================================
  // GET ALL STAFF
  // ======================================================

  async findAll(
    restaurantId?: RestaurantFilter,
    page = 1,
    limit = 10,
    search?: string,
    status?: EmployeeStatus,
    includeWages = true,
  ) {
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      throw new BadRequestException('Invalid staff pagination');
    }
    if (status && !Object.values(EmployeeStatus).includes(status)) {
      throw new BadRequestException('Invalid staff status');
    }
    const skip = (page - 1) * limit;

    const where: Prisma.StaffWhereInput = {
      deletedAt: null,
      status,
      AND: search
        ?.trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 8)
        .map((word) => ({
          OR: [
            { firstName: { contains: word, mode: 'insensitive' } },
            { lastName: { contains: word, mode: 'insensitive' } },
            { employeeCode: { contains: word, mode: 'insensitive' } },
            { role: { contains: word, mode: 'insensitive' } },
          ],
        })),
    };

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    const [staff, total] = await this.prisma.$transaction([
      this.prisma.staff.findMany({
        where,

        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],

        skip,
        take: limit,

        select: {
          ...this.safeStaffSelect,
          wageHistories: includeWages
            ? this.safeStaffSelect.wageHistories
            : false,
        },
      }),

      this.prisma.staff.count({
        where,
      }),
    ]);

    return {
      data: staff,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ======================================================
  // GET ONE
  // ======================================================

  async findOne(id: string) {
    const staff = await this.prisma.staff.findFirst({
      where: {
        id,
        deletedAt: null,
      },

      select: this.safeStaffSelect,
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    return staff;
  }

  // ======================================================
  // UPDATE STAFF
  // Does NOT modify wage
  // ======================================================

  async update(id: string, dto: UpdateStaffDto, user: AuthenticatedUser) {
    const { pin, restaurantId, ...details } = dto;
    const pinHash = pin === undefined ? undefined : await hash(pin, 10);
    return this.staffTransaction(async (tx) => {
      const staff = await this.scopedStaff(tx, id, user);
      const destination = restaurantId ?? staff.restaurantId;
      if (destination !== staff.restaurantId) {
        restaurantScope(user, destination);
        restaurantDetails(user, destination);
        await this.transfer(
          tx,
          staff,
          destination,
          restaurantDetails(user, staff.restaurantId).timezone,
        );
      }
      return tx.staff.update({
        where: { id },
        data: { ...details, pinHash, restaurantId: destination },
        select: this.safeStaffSelect,
      });
    });
  }

  async updateStatus(
    id: string,
    status: EmployeeStatus,
    user: AuthenticatedUser,
  ) {
    return this.staffTransaction(async (tx) => {
      const staff = await this.scopedStaff(tx, id, user);
      const now = new Date();
      const timezone = restaurantDetails(user, staff.restaurantId).timezone;
      const day = dateInRestaurant(now, timezone);
      if (status === EmployeeStatus.TERMINATED && !staff.terminatedAt) {
        await this.closeAssignment(tx, id, addDays(day, 1));
      }
      if (status !== EmployeeStatus.TERMINATED && staff.terminatedAt) {
        const priorEnd = addDays(
          dateInRestaurant(staff.terminatedAt, timezone),
          1,
        );
        await this.closeAssignment(tx, id, priorEnd);
        const previous = await tx.staffAssignment.findFirst({
          where: {
            staffId: id,
            restaurantId: staff.restaurantId,
            endsBefore: { gte: day },
          },
          orderBy: { startsOn: 'desc' },
        });
        if (previous) {
          await tx.staffAssignment.update({
            where: { id: previous.id },
            data: { endsBefore: null },
          });
        } else {
          await tx.staffAssignment.create({
            data: {
              staffId: id,
              restaurantId: staff.restaurantId,
              startsOn: day,
            },
          });
        }
      }
      return tx.staff.update({
        where: { id },
        data: {
          status,
          terminatedAt:
            status === EmployeeStatus.TERMINATED
              ? (staff.terminatedAt ?? now)
              : null,
        },
        select: this.safeStaffSelect,
      });
    });
  }

  async remove(id: string, user: AuthenticatedUser) {
    return this.staffTransaction(async (tx) => {
      const staff = await this.scopedStaff(tx, id, user);
      const now = new Date();
      const terminatedAt = staff.terminatedAt ?? now;
      const timezone = restaurantDetails(user, staff.restaurantId).timezone;
      await this.closeAssignment(
        tx,
        id,
        addDays(dateInRestaurant(terminatedAt, timezone), 1),
      );
      return tx.staff.update({
        where: { id },
        data: {
          deletedAt: now,
          terminatedAt,
          status: EmployeeStatus.TERMINATED,
        },
        select: this.safeStaffSelect,
      });
    });
  }

  private async scopedStaff(
    tx: Prisma.TransactionClient,
    id: string,
    user: AuthenticatedUser,
  ) {
    const staff = await tx.staff.findUnique({ where: { id, deletedAt: null } });
    if (!staff) throw new NotFoundException('Staff not found');
    restaurantScope(user, staff.restaurantId);
    return staff;
  }

  private async transfer(
    tx: Prisma.TransactionClient,
    staff: { id: string; restaurantId: string; status: EmployeeStatus },
    destination: string,
    timezone: string,
  ) {
    if (staff.status === EmployeeStatus.TERMINATED) {
      throw new ConflictException(
        'Reactivate the employee before transferring them',
      );
    }
    const now = new Date();
    const startsOn = dateInRestaurant(now, timezone);
    const openPunch = await tx.shift.findFirst({
      where: { staffId: staff.id, clockOutAt: null, voidedAt: null },
      select: { id: true },
    });
    if (openPunch)
      throw new ConflictException(
        'Close the employee’s open punch before transferring them',
      );
    const schedule = await tx.shiftSchedule.findFirst({
      where: {
        staffId: staff.id,
        restaurantId: staff.restaurantId,
        status: 'SCHEDULED',
        scheduledEnd: { gt: now },
      },
      select: { id: true },
    });
    if (schedule)
      throw new ConflictException(
        'Remove upcoming shifts at the current restaurant before transferring this employee',
      );
    const leave = await tx.leave.findFirst({
      where: {
        staffId: staff.id,
        restaurantId: staff.restaurantId,
        status: { in: ['PENDING', 'APPROVED'] },
        endDate: { gte: startsOn },
      },
      select: { id: true },
    });
    if (leave)
      throw new ConflictException(
        'Resolve current or upcoming leave before transferring this employee',
      );
    const payroll = await tx.payrollRun.findFirst({
      where: {
        restaurantId: { in: [staff.restaurantId, destination] },
        periodStartDate: { lte: startsOn },
        periodEndDate: { gte: startsOn },
        payslips: { some: {} },
      },
      select: { id: true },
    });
    if (payroll)
      throw new ConflictException(
        'The transfer date is already included in calculated payroll',
      );

    await this.closeAssignment(tx, staff.id, startsOn);
    await tx.staffAssignment.create({
      data: { staffId: staff.id, restaurantId: destination, startsOn },
    });
  }

  private async closeAssignment(
    tx: Prisma.TransactionClient,
    staffId: string,
    day: Date,
  ) {
    const current = await tx.staffAssignment.findFirst({
      where: { staffId, endsBefore: null },
    });
    if (!current) return;
    await tx.staffAssignment.update({
      where: { id: current.id },
      data: { endsBefore: current.startsOn > day ? current.startsOn : day },
    });
  }

  private staffTransaction<T>(
    work: (tx: Prisma.TransactionClient) => Promise<T>,
  ) {
    return this.prisma
      .$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      })
      .catch((error: unknown) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002')
            throw new ConflictException(
              'Employee code is already in use, or the employee assignment changed',
            );
          if (error.code === 'P2034')
            throw new ConflictException(
              'Staff records changed. Refresh and try again.',
            );
        }
        throw error;
      });
  }

  private validatePayType(
    payType: PayType,
    hourlyWage?: number,
    salaryAmount?: number,
  ): void {
    if (payType === PayType.HOURLY) {
      if (hourlyWage === undefined) {
        throw new BadRequestException(
          'hourlyWage is required for HOURLY pay type',
        );
      }

      if (salaryAmount !== undefined) {
        throw new BadRequestException(
          'salaryAmount must not be provided for HOURLY pay type',
        );
      }

      return;
    }

    if (payType === PayType.SALARY) {
      if (salaryAmount === undefined) {
        throw new BadRequestException(
          'salaryAmount is required for SALARY pay type',
        );
      }

      if (hourlyWage !== undefined) {
        throw new BadRequestException(
          'hourlyWage must not be provided for SALARY pay type',
        );
      }
    }
  }
}
