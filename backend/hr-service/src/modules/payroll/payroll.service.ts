import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { CreatePayrollRunDto } from './dto/create-payroll-run.dto.js';
import { PayrollCalculationService } from './payroll-calculation.service.js';

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payrollCalculationService: PayrollCalculationService,
  ) {}

  // ============================================================
  // CREATE PAYROLL RUN
  // ============================================================

  async create(dto: CreatePayrollRunDto) {
    const { restaurantId, periodStartDate, periodEndDate, processedById } = dto;

    const startDate = new Date(periodStartDate);
    const endDate = new Date(periodEndDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid payroll period dates');
    }

    if (startDate > endDate) {
      throw new BadRequestException(
        'Period start date cannot be after period end date',
      );
    }

    const existing = await this.prisma.payrollRun.findFirst({
      where: {
        restaurantId,
        periodStartDate: startDate,
        periodEndDate: endDate,
      },
    });

    if (existing) {
      throw new ConflictException('Payroll run already exists for this period');
    }

    const payrollRun = await this.prisma.payrollRun.create({
      data: {
        restaurantId,
        periodStartDate: startDate,
        periodEndDate: endDate,
        processedById,

        status: 'DRAFT',

        totalGrossPay: 0,
        totalTaxes: 0,
        totalNetPay: 0,
      },
    });

    return {
      message: 'Payroll run created successfully',
      data: payrollRun,
    };
  }

  // ============================================================
  // GET ALL PAYROLL RUNS
  // ============================================================

  async findAll(restaurantId?: string) {
    const payrollRuns = await this.prisma.payrollRun.findMany({
      where: restaurantId
        ? {
            restaurantId,
          }
        : undefined,

      orderBy: {
        periodStartDate: 'desc',
      },

      include: {
        payslips: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    return {
      message: 'Payroll runs fetched successfully',
      data: payrollRuns,
    };
  }

  // ============================================================
  // GET SINGLE PAYROLL RUN
  // ============================================================

  async findOne(id: string) {
    const payrollRun = await this.prisma.payrollRun.findUnique({
      where: {
        id,
      },

      include: {
        payslips: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    return {
      message: 'Payroll run fetched successfully',
      data: payrollRun,
    };
  }

  // ============================================================
  // PROCESS PAYROLL RUN
  // ============================================================

  async process(id: string) {
    const payrollRun = await this.prisma.payrollRun.findUnique({
      where: {
        id,
      },
    });

    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    if (payrollRun.status !== 'DRAFT') {
      throw new ConflictException('Only DRAFT payroll runs can be processed');
    }

    // Prevent processing twice
    const existingPayslips = await this.prisma.payslip.count({
      where: {
        payrollRunId: id,
      },
    });

    if (existingPayslips > 0) {
      throw new ConflictException('Payroll has already been processed');
    }

    const staffList = await this.prisma.staff.findMany({
      where: {
        restaurantId: payrollRun.restaurantId,
        status: {
          not: 'TERMINATED',
        },
      },
    });

    if (staffList.length === 0) {
      throw new BadRequestException(
        'No active staff found for this restaurant',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      let totalGrossPay = 0;
      let totalTaxes = 0;
      let totalNetPay = 0;

      for (const staff of staffList) {
        const calculation =
          await this.payrollCalculationService.calculateStaffPayroll(tx, {
            staffId: staff.id,
            restaurantId: payrollRun.restaurantId,
            periodStartDate: payrollRun.periodStartDate,
            periodEndDate: payrollRun.periodEndDate,
          });

        totalGrossPay += calculation.grossPay;
        totalTaxes += calculation.taxDeductions;
        totalNetPay += calculation.netPay;

        await tx.payslip.create({
          data: {
            payrollRunId: payrollRun.id,
            staffId: staff.id,

            regularHours: calculation.regularHours,
            overtimeHours: calculation.overtimeHours,
            paidLeaveHours: calculation.paidLeaveHours,

            regularPay: calculation.regularPay,
            overtimePay: calculation.overtimePay,

            grossPay: calculation.grossPay,

            taxDeductions: calculation.taxDeductions,
            otherDeductions: calculation.otherDeductions,

            netPay: calculation.netPay,

            paymentMethod: 'DIRECT_DEPOSIT',
            status: 'DRAFT',
          },
        });
      }

      return tx.payrollRun.update({
        where: {
          id: payrollRun.id,
        },

        data: {
          totalGrossPay,
          totalTaxes,
          totalNetPay,
        },

        include: {
          payslips: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });
    });

    return {
      message: 'Payroll processed successfully',
      data: result,
    };
  }

  // ============================================================
  // APPROVE PAYROLL RUN
  // ============================================================

  async approve(id: string) {
    const payrollRun = await this.prisma.payrollRun.findUnique({
      where: {
        id,
      },
    });

    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    if (payrollRun.status !== 'DRAFT') {
      throw new ConflictException('Only DRAFT payroll runs can be approved');
    }

    const payslipCount = await this.prisma.payslip.count({
      where: {
        payrollRunId: id,
      },
    });

    if (payslipCount === 0) {
      throw new ConflictException(
        'Payroll cannot be approved because no payslips exist',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.payslip.updateMany({
        where: {
          payrollRunId: id,
        },

        data: {
          status: 'APPROVED',
        },
      });

      return tx.payrollRun.update({
        where: {
          id,
        },

        data: {
          status: 'APPROVED',
        },

        include: {
          payslips: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });
    });

    return {
      message: 'Payroll run approved successfully',
      data: result,
    };
  }

  // ============================================================
  // PAY PAYROLL
  // ============================================================

  async pay(id: string) {
    const payrollRun = await this.prisma.payrollRun.findUnique({
      where: {
        id,
      },
    });

    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    if (payrollRun.status !== 'APPROVED') {
      throw new ConflictException('Only APPROVED payroll runs can be paid');
    }

    const payslipCount = await this.prisma.payslip.count({
      where: {
        payrollRunId: id,
        status: 'APPROVED',
      },
    });

    if (payslipCount === 0) {
      throw new ConflictException(
        'No approved payslips found for this payroll',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.payslip.updateMany({
        where: {
          payrollRunId: id,
          status: 'APPROVED',
        },

        data: {
          status: 'PAID',
        },
      });

      return tx.payrollRun.update({
        where: {
          id,
        },

        data: {
          status: 'PAID',
        },

        include: {
          payslips: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });
    });

    return {
      message: 'Payroll run paid successfully',
      data: result,
    };
  }
}
