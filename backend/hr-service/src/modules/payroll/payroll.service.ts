import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EmployeeStatus, PayrollStatus } from '@prisma/client';

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

  /**
   * Create a payroll run for a restaurant.
   *
   * A payroll run is initially created in DRAFT status.
   * The actual payroll calculations happen during processing.
   */
  async create(dto: CreatePayrollRunDto) {
    const { restaurantId, periodStartDate, periodEndDate, processedById } = dto;

    // ----------------------------------------------------------
    // Validate payroll period
    // ----------------------------------------------------------

    const startDate = this.parseDate(periodStartDate, 'periodStartDate');

    const endDate = this.parseDate(periodEndDate, 'periodEndDate');

    if (startDate > endDate) {
      throw new BadRequestException(
        'Period start date cannot be after period end date',
      );
    }

    // ----------------------------------------------------------
    // Prevent duplicate payroll run
    // ----------------------------------------------------------

    const existing = await this.prisma.payrollRun.findFirst({
      where: {
        restaurantId,
        periodStartDate: startDate,
        periodEndDate: endDate,
      },

      select: {
        id: true,
      },
    });

    if (existing) {
      throw new ConflictException('Payroll run already exists for this period');
    }

    // ----------------------------------------------------------
    // Create payroll run
    // ----------------------------------------------------------

    const payrollRun = await this.prisma.payrollRun.create({
      data: {
        restaurantId,
        periodStartDate: startDate,
        periodEndDate: endDate,
        processedById,

        status: PayrollStatus.DRAFT,

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
  // FIND ALL PAYROLL RUNS
  // ============================================================

  /**
   * Get payroll runs.
   *
   * Optional filter:
   * - restaurantId
   */
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
  // FIND ONE PAYROLL RUN
  // ============================================================

  /**
   * Get one payroll run with its payslips.
   */
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
  /**
   * Calculate payroll for all active staff in the restaurant.
   *
   * Each completed, unprocessed attendance shift is included
   * only once and marked as processed after its payslip has
   * been successfully created.
   */
  async process(id: string) {
    const payrollRun = await this.prisma.payrollRun.findUnique({
      where: {
        id,
      },
    });

    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    // Only DRAFT payroll runs can be processed.
    if (payrollRun.status !== PayrollStatus.DRAFT) {
      throw new ConflictException('Only DRAFT payroll runs can be processed');
    }

    // ----------------------------------------------------------
    // Prevent duplicate processing
    // ----------------------------------------------------------

    const existingPayslips = await this.prisma.payslip.count({
      where: {
        payrollRunId: id,
      },
    });

    if (existingPayslips > 0) {
      throw new ConflictException('Payroll has already been processed');
    }

    // ----------------------------------------------------------
    // Get active staff
    // ----------------------------------------------------------

    const staffList = await this.prisma.staff.findMany({
      where: {
        restaurantId: payrollRun.restaurantId,

        status: EmployeeStatus.ACTIVE,

        deletedAt: null,
      },

      select: {
        id: true,
      },
    });

    if (staffList.length === 0) {
      throw new BadRequestException(
        'No active staff found for this restaurant',
      );
    }

    // ----------------------------------------------------------
    // Process payroll atomically
    // ----------------------------------------------------------

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

        // ------------------------------------------------
        // Create payslip
        // ------------------------------------------------

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

            status: PayrollStatus.DRAFT,
          },
        });

        // ------------------------------------------------
        // Mark the exact shifts used by this calculation
        // ------------------------------------------------

        if (calculation.shiftIds.length > 0) {
          await tx.shift.updateMany({
            where: {
              id: {
                in: calculation.shiftIds,
              },

              /*
               * Keep this condition so a shift cannot
               * accidentally be marked twice.
               */
              isProcessedForPay: false,
            },

            data: {
              isProcessedForPay: true,
            },
          });
        }
      }

      // ------------------------------------------------
      // Update payroll totals
      // ------------------------------------------------

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

  /**
   * Approve a processed payroll run.
   *
   * Both the payroll run and its payslips move to APPROVED.
   */
  async approve(id: string) {
    const payrollRun = await this.prisma.payrollRun.findUnique({
      where: {
        id,
      },
    });

    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    // Only DRAFT payroll runs can move to APPROVED.
    if (payrollRun.status !== PayrollStatus.DRAFT) {
      throw new ConflictException('Only DRAFT payroll runs can be approved');
    }

    // ----------------------------------------------------------
    // Verify payslips exist
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // Approve payroll atomically
    // ----------------------------------------------------------

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.payslip.updateMany({
        where: {
          payrollRunId: id,
        },

        data: {
          status: PayrollStatus.APPROVED,
        },
      });

      return tx.payrollRun.update({
        where: {
          id,
        },

        data: {
          status: PayrollStatus.APPROVED,
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
  // PAY PAYROLL RUN
  // ============================================================

  /**
   * Mark an approved payroll run as paid.
   *
   * Only approved payslips are moved to PAID.
   */
  async pay(id: string) {
    const payrollRun = await this.prisma.payrollRun.findUnique({
      where: {
        id,
      },
    });

    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    // Only approved payroll runs can be paid.
    if (payrollRun.status !== PayrollStatus.APPROVED) {
      throw new ConflictException('Only APPROVED payroll runs can be paid');
    }

    // ----------------------------------------------------------
    // Verify approved payslips
    // ----------------------------------------------------------

    const payslipCount = await this.prisma.payslip.count({
      where: {
        payrollRunId: id,
        status: PayrollStatus.APPROVED,
      },
    });

    if (payslipCount === 0) {
      throw new ConflictException(
        'No approved payslips found for this payroll',
      );
    }

    // ----------------------------------------------------------
    // Mark payroll as paid atomically
    // ----------------------------------------------------------

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.payslip.updateMany({
        where: {
          payrollRunId: id,
          status: PayrollStatus.APPROVED,
        },

        data: {
          status: PayrollStatus.PAID,
        },
      });

      return tx.payrollRun.update({
        where: {
          id,
        },

        data: {
          status: PayrollStatus.PAID,
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

  // ============================================================
  // HELPERS
  // ============================================================

  /**
   * Convert and validate an incoming date string.
   */
  private parseDate(value: string, fieldName: string): Date {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid ${fieldName}`);
    }

    return date;
  }
}
