import { Injectable } from '@nestjs/common';

import { LeaveStatus, PayType, Prisma } from '@prisma/client';

@Injectable()
export class PayrollCalculationService {
  /**
   * Calculate payroll for one staff member for a payroll period.
   *
   * The calculation uses:
   * - Completed shifts within the payroll period
   * - Wage configuration applicable to the payroll period
   * - Approved paid leave
   *
   * Salary employees are treated as monthly salaried employees.
   */
  async calculateStaffPayroll(
    tx: Prisma.TransactionClient,
    input: {
      staffId: string;
      restaurantId: string;
      periodStartDate: Date;
      periodEndDate: Date;
    },
  ) {
    const { staffId, restaurantId, periodStartDate, periodEndDate } = input;

    // Normalize payroll boundaries because PayrollRun uses @db.Date.
    const periodStart = this.startOfDay(periodStartDate);

    const periodEnd = this.endOfDay(periodEndDate);

    // ============================================================
    // GET SHIFTS
    // ============================================================

    /*
     * Only completed and unprocessed shifts are included.
     *
     * isProcessedForPay prevents the same attendance record
     * from being included in another payroll run.
     */
    const shifts = await tx.shift.findMany({
      where: {
        staffId,
        restaurantId,

        // Shift must be completed.
        clockOutAt: {
          not: null,
        },

        // Shift must not already belong to payroll.
        isProcessedForPay: false,

        // Shift must fall inside the payroll period.
        clockInAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },

      orderBy: {
        clockInAt: 'asc',
      },

      select: {
        id: true,
        regularHours: true,
        overtimeHours: true,
        hourlyWageAtShift: true,
        overtimeRateAtShift: true,
      },
    });

    // ============================================================
    // CALCULATE HOURS
    // ============================================================

    let regularHours = 0;
    let overtimeHours = 0;

    let regularPay = 0;
    let overtimePay = 0;

    for (const shift of shifts) {
      const regular = Number(shift.regularHours ?? 0);

      const overtime = Number(shift.overtimeHours ?? 0);

      const hourlyWage = Number(shift.hourlyWageAtShift ?? 0);

      const overtimeRate = Number(
        shift.overtimeRateAtShift ?? shift.hourlyWageAtShift ?? 0,
      );

      regularHours += regular;
      overtimeHours += overtime;

      /*
       * Salary employees do not have an hourly wage
       * snapshot, so shift-based regular/overtime pay
       * is only calculated when hourly wage exists.
       */
      if (shift.hourlyWageAtShift !== null) {
        regularPay += regular * hourlyWage;

        overtimePay += overtime * overtimeRate;
      }
    }

    // ============================================================
    // GET APPLICABLE WAGE
    // ============================================================

    /*
     * Used for:
     * - Salary calculation
     * - Paid leave calculation
     *
     * Hourly shift pay continues to use the wage snapshot
     * stored on each Shift.
     */
    const wage = await tx.wageHistory.findFirst({
      where: {
        staffId,

        effectiveStartDate: {
          lte: periodEnd,
        },

        OR: [
          {
            effectiveEndDate: null,
          },
          {
            effectiveEndDate: {
              gte: periodStart,
            },
          },
        ],
      },

      orderBy: {
        effectiveStartDate: 'desc',
      },
    });

    if (!wage) {
      throw new Error(
        `No applicable wage configuration found for staff ${staffId}`,
      );
    }

    // ============================================================
    // SALARY PAY
    // ============================================================

    let salaryPay = 0;

    if (wage.payType === PayType.SALARY) {
      salaryPay = this.calculateSalaryForPeriod(
        wage.salaryAmount,
        periodStart,
        periodEnd,
      );
    }

    // ============================================================
    // PAID LEAVE
    // ============================================================

    const paidLeave = await tx.leave.findMany({
      where: {
        staffId,

        status: LeaveStatus.APPROVED,

        isPaidLeave: true,

        /*
         * Leave overlaps the payroll period when:
         *
         * leave.start <= payroll.end
         * AND
         * leave.end >= payroll.start
         */
        startDate: {
          lte: periodEnd,
        },

        endDate: {
          gte: periodStart,
        },
      },

      select: {
        startDate: true,
        endDate: true,
      },
    });

    let paidLeaveDays = 0;

    for (const leave of paidLeave) {
      paidLeaveDays += this.calculateOverlappingLeaveDays(
        leave.startDate,
        leave.endDate,
        periodStart,
        periodEnd,
      );
    }

    /*
     * Standard workday = 8 hours.
     */
    const paidLeaveHours = paidLeaveDays * 8;

    // ============================================================
    // PAID LEAVE PAY
    // ============================================================

    let paidLeavePay = 0;

    if (wage.payType === PayType.HOURLY) {
      const leaveHourlyRate = Number(wage.hourlyWage ?? 0);

      paidLeavePay = paidLeaveHours * leaveHourlyRate;
    }

    /*
     * Salary employees are already paid through salaryPay,
     * so paid leave is recorded as hours only.
     */

    // ============================================================
    // PAY CALCULATION
    // ============================================================

    const grossPay = regularPay + overtimePay + salaryPay + paidLeavePay;

    // ============================================================
    // DEDUCTIONS
    // ============================================================

    /*
     * Tax and other deduction rules are not present in the
     * current schema, so these remain zero.
     */
    const taxDeductions = 0;

    const otherDeductions = 0;

    const netPay = grossPay - taxDeductions - otherDeductions;

    // ============================================================
    // RETURN CALCULATION
    // ============================================================

    return {
      /*
       * These are the exact shifts used for this calculation.
       *
       * PayrollService will mark these IDs as processed after
       * the payslip is successfully created.
       */
      shiftIds: shifts.map((shift) => shift.id),

      regularHours: this.round(regularHours),

      overtimeHours: this.round(overtimeHours),

      paidLeaveHours: this.round(paidLeaveHours),

      regularPay: this.round(regularPay),

      overtimePay: this.round(overtimePay),

      grossPay: this.round(grossPay),

      taxDeductions: this.round(taxDeductions),

      otherDeductions: this.round(otherDeductions),

      netPay: this.round(netPay),
    };
  }

  // ============================================================
  // SALARY CALCULATION
  // ============================================================

  /**
   * Calculate monthly salary for the requested payroll period.
   */
  private calculateSalaryForPeriod(
    salaryAmount: Prisma.Decimal | null,
    periodStart: Date,
    periodEnd: Date,
  ): number {
    const monthlySalary = Number(salaryAmount ?? 0);

    if (monthlySalary <= 0) {
      return 0;
    }

    let totalSalary = 0;

    let currentMonth = new Date(periodStart);

    while (currentMonth <= periodEnd) {
      const monthStart = this.startOfMonth(currentMonth);

      const monthEnd = this.endOfMonth(currentMonth);

      const applicableStart =
        periodStart > monthStart ? periodStart : monthStart;

      const applicableEnd = periodEnd < monthEnd ? periodEnd : monthEnd;

      if (applicableStart <= applicableEnd) {
        const payableDays = this.calendarDaysInclusive(
          applicableStart,
          applicableEnd,
        );

        const daysInMonth = this.calendarDaysInclusive(monthStart, monthEnd);

        totalSalary += (monthlySalary / daysInMonth) * payableDays;
      }

      currentMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1,
      );
    }

    return totalSalary;
  }

  // ============================================================
  // PAID LEAVE DAYS
  // ============================================================

  /**
   * Calculate the leave days that overlap the payroll period.
   */
  private calculateOverlappingLeaveDays(
    leaveStart: Date,
    leaveEnd: Date,
    periodStart: Date,
    periodEnd: Date,
  ): number {
    const start = leaveStart > periodStart ? leaveStart : periodStart;

    const end = leaveEnd < periodEnd ? leaveEnd : periodEnd;

    if (start > end) {
      return 0;
    }

    return this.calendarDaysInclusive(start, end);
  }

  // ============================================================
  // DATE HELPERS
  // ============================================================

  /**
   * Normalize a date to the start of the day.
   */
  private startOfDay(date: Date): Date {
    const result = new Date(date);

    result.setHours(0, 0, 0, 0);

    return result;
  }

  /**
   * Normalize a date to the end of the day.
   */
  private endOfDay(date: Date): Date {
    const result = new Date(date);

    result.setHours(23, 59, 59, 999);

    return result;
  }

  /**
   * Get the first day of a month.
   */
  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  /**
   * Get the last day of a month.
   */
  private endOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  /**
   * Calculate inclusive calendar days.
   */
  private calendarDaysInclusive(start: Date, end: Date): number {
    const startDay = this.startOfDay(start);

    const endDay = this.startOfDay(end);

    const millisecondsPerDay = 1000 * 60 * 60 * 24;

    return (
      Math.floor((endDay.getTime() - startDay.getTime()) / millisecondsPerDay) +
      1
    );
  }

  /**
   * Round monetary and hour values to two decimals.
   */
  private round(value: number): number {
    return Number(value.toFixed(2));
  }
}
