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

  async create(dto: CreateStaffDto) {
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

    const staff = await this.prisma.staff.create({
      data: {
        restaurantId,
        employeeCode,
        firstName,
        lastName,
        role,
        pinHash,

        wageHistories: {
          create: {
            payType,
            hourlyWage:
              hourlyWage !== undefined ? new Prisma.Decimal(hourlyWage) : null,

            overtimeRate:
              overtimeRate !== undefined
                ? new Prisma.Decimal(overtimeRate)
                : null,

            salaryAmount:
              salaryAmount !== undefined
                ? new Prisma.Decimal(salaryAmount)
                : null,

            effectiveStartDate: new Date(),
            approvedById,
          },
        },
      },

      select: this.safeStaffSelect,
    });

    return staff;
  }

  // ======================================================
  // GET ALL STAFF
  // ======================================================

  async findAll(restaurantId?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const where: Prisma.StaffWhereInput = {
      deletedAt: null,
    };

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    const [staff, total] = await this.prisma.$transaction([
      this.prisma.staff.findMany({
        where,

        orderBy: {
          createdAt: 'desc',
        },

        skip,
        take: limit,

        select: this.safeStaffSelect,
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

  async update(id: string, dto: UpdateStaffDto) {
    const currentStaff = await this.findOne(id);

    const { pin, ...staffData } = dto;

    // ----------------------------------------------------
    // UNIQUE EMPLOYEE CODE CHECK
    // ----------------------------------------------------

    if (
      staffData.employeeCode !== undefined ||
      staffData.restaurantId !== undefined
    ) {
      const targetRestaurantId =
        staffData.restaurantId ?? currentStaff.restaurantId;

      const targetEmployeeCode =
        staffData.employeeCode ?? currentStaff.employeeCode;

      const existingStaff = await this.prisma.staff.findUnique({
        where: {
          restaurantId_employeeCode: {
            restaurantId: targetRestaurantId,
            employeeCode: targetEmployeeCode,
          },
        },
      });

      if (existingStaff && existingStaff.id !== id) {
        throw new ConflictException(
          'Employee code already exists for this restaurant',
        );
      }
    }

    // ----------------------------------------------------
    // UPDATE DATA
    // ----------------------------------------------------

    const updateData: Prisma.StaffUpdateInput = {
      ...staffData,
    };

    if (pin !== undefined) {
      updateData.pinHash = await hash(pin, 10);
    }

    // ----------------------------------------------------
    // UPDATE
    // ----------------------------------------------------

    return this.prisma.staff.update({
      where: {
        id,
      },

      data: updateData,

      select: this.safeStaffSelect,
    });
  }

  // ======================================================
  // UPDATE STATUS
  // ======================================================

  async updateStatus(id: string, status: EmployeeStatus) {
    await this.findOne(id);

    return this.prisma.staff.update({
      where: {
        id,
      },

      data: {
        status,
      },

      select: this.safeStaffSelect,
    });
  }

  // ======================================================
  // SOFT DELETE
  // ======================================================

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.staff.update({
      where: {
        id,
      },

      data: {
        deletedAt: new Date(),
        status: EmployeeStatus.TERMINATED,
      },

      select: this.safeStaffSelect,
    });
  }

  // ======================================================
  // PAY TYPE VALIDATION
  // ======================================================

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
