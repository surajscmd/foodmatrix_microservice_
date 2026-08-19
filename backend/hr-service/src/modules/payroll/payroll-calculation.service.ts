import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class PayrollCalculationService {
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

    // ============================================================
    // GET SHIFTS
    // ============================================================

    const shifts = await tx.shift.findMany({
      where: {
        staffId,
        restaurantId,

        clockInAt: {
          gte: periodStartDate,
          lte: periodEndDate,
        },
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

      regularPay += regular * hourlyWage;
      overtimePay += overtime * overtimeRate;
    }

    // ============================================================
    // PAID LEAVE
    // ============================================================

    const paidLeaveHours = 0;

    // We will connect Leave → payroll calculation later.
    // For now paid leave is zero.

    // ============================================================
    // PAY CALCULATION
    // ============================================================

    const grossPay = regularPay + overtimePay;

    // ============================================================
    // DEDUCTIONS
    // ============================================================

    const taxDeductions = 0;

    const otherDeductions = 0;

    const netPay = grossPay - taxDeductions - otherDeductions;

    // ============================================================
    // RETURN CALCULATION
    // ============================================================

    return {
      regularHours,
      overtimeHours,
      paidLeaveHours,

      regularPay,
      overtimePay,

      grossPay,

      taxDeductions,
      otherDeductions,

      netPay,
    };
  }
}
