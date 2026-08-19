import {
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

  // =========================================================
  // CREATE
  // =========================================================

  async create(dto: CreateWageDto) {
    const {
      staffId,
      payType,
      hourlyWage,
      overtimeRate,
      salaryAmount,
      effectiveStartDate,
      effectiveEndDate,
      approvedById,
    } = dto;

    // -------------------------------------------------------
    // Check staff
    // -------------------------------------------------------

    const staff = await this.prisma.staff.findUnique({
      where: {
        id: staffId,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    // -------------------------------------------------------
    // Validate pay type
    // -------------------------------------------------------

    this.validatePayType(payType, hourlyWage, salaryAmount);

    // -------------------------------------------------------
    // Dates
    // -------------------------------------------------------

    const startDate = new Date(effectiveStartDate);

    const endDate = effectiveEndDate ? new Date(effectiveEndDate) : null;

    if (endDate && startDate > endDate) {
      throw new ConflictException(
        'Effective start date cannot be after effective end date',
      );
    }

    // -------------------------------------------------------
    // Find overlapping wage
    // -------------------------------------------------------

    const overlapping = await this.prisma.wageHistory.findFirst({
      where: {
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
        'Wage period overlaps with an existing wage history',
      );
    }

    // -------------------------------------------------------
    // Create
    // -------------------------------------------------------

    const wage = await this.prisma.wageHistory.create({
      data: {
        staffId,
        payType,

        hourlyWage:
          hourlyWage !== undefined ? new Prisma.Decimal(hourlyWage) : null,

        overtimeRate:
          overtimeRate !== undefined ? new Prisma.Decimal(overtimeRate) : null,

        salaryAmount:
          salaryAmount !== undefined ? new Prisma.Decimal(salaryAmount) : null,

        effectiveStartDate: startDate,
        effectiveEndDate: endDate,
        approvedById,
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
      message: 'Wage history created successfully',
      data: wage,
    };
  }

  // =========================================================
  // FIND ALL
  // =========================================================

  async findAll(staffId?: string) {
    const wages = await this.prisma.wageHistory.findMany({
      where: staffId
        ? {
            staffId,
          }
        : undefined,

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
        effectiveStartDate: 'desc',
      },
    });

    return {
      message: 'Wage histories fetched successfully',
      data: wages,
    };
  }

  // =========================================================
  // FIND ONE
  // =========================================================

  async findOne(id: string) {
    const wage = await this.prisma.wageHistory.findUnique({
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

    if (!wage) {
      throw new NotFoundException('Wage history not found');
    }

    return {
      message: 'Wage history fetched successfully',
      data: wage,
    };
  }

  // =========================================================
  // CURRENT WAGE
  // =========================================================

  async getCurrentWage(staffId: string) {
    const staff = await this.prisma.staff.findUnique({
      where: {
        id: staffId,
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

    return {
      message: 'Current wage fetched successfully',
      data: wage,
    };
  }

  // =========================================================
  // UPDATE
  // =========================================================

  async update(id: string, dto: UpdateWageDto) {
    const existing = await this.prisma.wageHistory.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Wage history not found');
    }

    const payType = dto.payType ?? existing.payType;

    const hourlyWage =
      dto.hourlyWage ??
      (existing.hourlyWage ? Number(existing.hourlyWage) : undefined);

    const salaryAmount =
      dto.salaryAmount ??
      (existing.salaryAmount ? Number(existing.salaryAmount) : undefined);

    this.validatePayType(payType, hourlyWage, salaryAmount);

    const startDate = dto.effectiveStartDate
      ? new Date(dto.effectiveStartDate)
      : existing.effectiveStartDate;

    const endDate =
      dto.effectiveEndDate !== undefined
        ? dto.effectiveEndDate
          ? new Date(dto.effectiveEndDate)
          : null
        : existing.effectiveEndDate;

    if (endDate && startDate > endDate) {
      throw new ConflictException(
        'Effective start date cannot be after effective end date',
      );
    }

    // -------------------------------------------------------
    // Check overlap with other records
    // -------------------------------------------------------

    const overlapping = await this.prisma.wageHistory.findFirst({
      where: {
        id: {
          not: id,
        },

        staffId: dto.staffId ?? existing.staffId,

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

    const wage = await this.prisma.wageHistory.update({
      where: {
        id,
      },

      data: {
        ...(dto.staffId !== undefined && {
          staffId: dto.staffId,
        }),

        ...(dto.payType !== undefined && {
          payType: dto.payType,
        }),

        ...(dto.hourlyWage !== undefined && {
          hourlyWage: new Prisma.Decimal(dto.hourlyWage),
        }),

        ...(dto.overtimeRate !== undefined && {
          overtimeRate: new Prisma.Decimal(dto.overtimeRate),
        }),

        ...(dto.salaryAmount !== undefined && {
          salaryAmount: new Prisma.Decimal(dto.salaryAmount),
        }),

        ...(dto.effectiveStartDate !== undefined && {
          effectiveStartDate: startDate,
        }),

        ...(dto.effectiveEndDate !== undefined && {
          effectiveEndDate: endDate,
        }),

        ...(dto.approvedById !== undefined && {
          approvedById: dto.approvedById,
        }),
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
      message: 'Wage history updated successfully',
      data: wage,
    };
  }

  // =========================================================
  // DELETE
  // =========================================================

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

    return {
      message: 'Wage history deleted successfully',
    };
  }

  // =========================================================
  // VALIDATION
  // =========================================================

  private validatePayType(
    payType: PayType,
    hourlyWage?: number,
    salaryAmount?: number,
  ) {
    if (
      payType === PayType.HOURLY &&
      (hourlyWage === undefined || hourlyWage === null)
    ) {
      throw new ConflictException(
        'Hourly wage is required for HOURLY pay type',
      );
    }

    if (
      payType === PayType.SALARY &&
      (salaryAmount === undefined || salaryAmount === null)
    ) {
      throw new ConflictException(
        'Salary amount is required for SALARY pay type',
      );
    }
  }
}
