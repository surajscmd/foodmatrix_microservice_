import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PayType, Prisma } from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

import { CreateWageDto } from './dto/create-wage.dto.js';
import { UpdateWageDto } from './dto/update-wage.dto.js';

@Injectable()
export class WageService {
  constructor(private readonly prisma: PrismaService) {}

  // ======================================================
  // STAFF SELECT
  // ======================================================

  private readonly staffSelect: Prisma.StaffSelect = {
    id: true,
    employeeCode: true,
    firstName: true,
    lastName: true,
    role: true,
    restaurantId: true,
  };

  // ======================================================
  // CREATE WAGE
  // ======================================================

  async create(dto: CreateWageDto) {
    const staff = await this.prisma.staff.findFirst({
      where: {
        id: dto.staffId,
        deletedAt: null,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    this.validatePayType(dto.payType, dto.hourlyWage, dto.salaryAmount);

    const startDate = new Date(dto.effectiveStartDate);

    const endDate = dto.effectiveEndDate
      ? new Date(dto.effectiveEndDate)
      : null;

    this.validateDates(startDate, endDate);

    const overlapping = await this.prisma.wageHistory.findFirst({
      where: {
        staffId: dto.staffId,

        effectiveStartDate: {
          lte: endDate ?? new Date('9999-12-31'),
        },

        OR: [
          {
            effectiveEndDate: null,
          },
          {
            effectiveEndDate: {
              gte: startDate,
            },
          },
        ],
      },
    });

    if (overlapping) {
      throw new ConflictException(
        'Wage period overlaps with an existing wage history',
      );
    }

    return this.prisma.wageHistory.create({
      data: {
        staffId: dto.staffId,

        payType: dto.payType,

        hourlyWage:
          dto.hourlyWage !== undefined
            ? new Prisma.Decimal(dto.hourlyWage)
            : null,

        overtimeRate:
          dto.overtimeRate !== undefined
            ? new Prisma.Decimal(dto.overtimeRate)
            : null,

        salaryAmount:
          dto.salaryAmount !== undefined
            ? new Prisma.Decimal(dto.salaryAmount)
            : null,

        effectiveStartDate: startDate,
        effectiveEndDate: endDate,

        approvedById: dto.approvedById,
      },

      include: {
        staff: {
          select: this.staffSelect,
        },
      },
    });
  }

  // ======================================================
  // FIND ALL
  // ======================================================

  async findAll(staffId?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const where: Prisma.WageHistoryWhereInput = {};

    if (staffId) {
      where.staffId = staffId;
    }

    const [wages, total] = await this.prisma.$transaction([
      this.prisma.wageHistory.findMany({
        where,

        include: {
          staff: {
            select: this.staffSelect,
          },
        },

        orderBy: {
          effectiveStartDate: 'desc',
        },

        skip,
        take: limit,
      }),

      this.prisma.wageHistory.count({
        where,
      }),
    ]);

    return {
      data: wages,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ======================================================
  // FIND ONE
  // ======================================================

  async findOne(id: string) {
    const wage = await this.prisma.wageHistory.findUnique({
      where: {
        id,
      },

      include: {
        staff: {
          select: this.staffSelect,
        },
      },
    });

    if (!wage) {
      throw new NotFoundException('Wage history not found');
    }

    return wage;
  }

  // ======================================================
  // CURRENT WAGE
  // ======================================================

  async getCurrentWage(staffId: string) {
    const staff = await this.prisma.staff.findFirst({
      where: {
        id: staffId,
        deletedAt: null,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    const today = new Date();

    const wage = await this.prisma.wageHistory.findFirst({
      where: {
        staffId,

        effectiveStartDate: {
          lte: today,
        },

        OR: [
          {
            effectiveEndDate: null,
          },
          {
            effectiveEndDate: {
              gte: today,
            },
          },
        ],
      },

      orderBy: {
        effectiveStartDate: 'desc',
      },
    });

    if (!wage) {
      throw new NotFoundException('No active wage found for this staff member');
    }

    return wage;
  }

  // ======================================================
  // UPDATE WAGE
  // ======================================================

  async update(id: string, dto: UpdateWageDto) {
    const existing = await this.prisma.wageHistory.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Wage history not found');
    }

    const staffId = dto.staffId ?? existing.staffId;

    const staff = await this.prisma.staff.findFirst({
      where: {
        id: staffId,
        deletedAt: null,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    const payType = dto.payType ?? existing.payType;

    const hourlyWage =
      dto.hourlyWage !== undefined
        ? dto.hourlyWage
        : existing.hourlyWage !== null
          ? Number(existing.hourlyWage)
          : undefined;

    const salaryAmount =
      dto.salaryAmount !== undefined
        ? dto.salaryAmount
        : existing.salaryAmount !== null
          ? Number(existing.salaryAmount)
          : undefined;

    this.validatePayType(payType, hourlyWage, salaryAmount);

    const startDate =
      dto.effectiveStartDate !== undefined
        ? new Date(dto.effectiveStartDate)
        : existing.effectiveStartDate;

    const endDate =
      dto.effectiveEndDate !== undefined
        ? dto.effectiveEndDate
          ? new Date(dto.effectiveEndDate)
          : null
        : existing.effectiveEndDate;

    this.validateDates(startDate, endDate);

    const overlapping = await this.prisma.wageHistory.findFirst({
      where: {
        id: {
          not: id,
        },

        staffId,

        effectiveStartDate: {
          lte: endDate ?? new Date('9999-12-31'),
        },

        OR: [
          {
            effectiveEndDate: null,
          },
          {
            effectiveEndDate: {
              gte: startDate,
            },
          },
        ],
      },
    });

    if (overlapping) {
      throw new ConflictException(
        'Wage period overlaps with another wage history',
      );
    }

    return this.prisma.wageHistory.update({
      where: {
        id,
      },

      data: {
        staffId,

        payType,

        hourlyWage:
          dto.hourlyWage !== undefined
            ? new Prisma.Decimal(dto.hourlyWage)
            : existing.hourlyWage,

        overtimeRate:
          dto.overtimeRate !== undefined
            ? new Prisma.Decimal(dto.overtimeRate)
            : existing.overtimeRate,

        salaryAmount:
          dto.salaryAmount !== undefined
            ? new Prisma.Decimal(dto.salaryAmount)
            : existing.salaryAmount,

        effectiveStartDate: startDate,
        effectiveEndDate: endDate,

        ...(dto.approvedById !== undefined && {
          approvedById: dto.approvedById,
        }),
      },

      include: {
        staff: {
          select: this.staffSelect,
        },
      },
    });
  }

  // ======================================================
  // DELETE
  // ======================================================

  async remove(id: string) {
    const wage = await this.prisma.wageHistory.findUnique({
      where: {
        id,
      },
    });

    if (!wage) {
      throw new NotFoundException('Wage history not found');
    }

    await this.prisma.wageHistory.delete({
      where: {
        id,
      },
    });

    return wage;
  }

  // ======================================================
  // DATE VALIDATION
  // ======================================================

  private validateDates(startDate: Date, endDate: Date | null): void {
    if (Number.isNaN(startDate.getTime())) {
      throw new BadRequestException('Invalid effective start date');
    }

    if (endDate && Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid effective end date');
    }

    if (endDate && startDate > endDate) {
      throw new ConflictException(
        'Effective start date cannot be after effective end date',
      );
    }
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
          'Hourly wage is required for HOURLY pay type',
        );
      }

      if (salaryAmount !== undefined) {
        throw new BadRequestException(
          'Salary amount must not be provided for HOURLY pay type',
        );
      }

      return;
    }

    if (payType === PayType.SALARY) {
      if (salaryAmount === undefined) {
        throw new BadRequestException(
          'Salary amount is required for SALARY pay type',
        );
      }

      if (hourlyWage !== undefined) {
        throw new BadRequestException(
          'Hourly wage must not be provided for SALARY pay type',
        );
      }
    }
  }
}
