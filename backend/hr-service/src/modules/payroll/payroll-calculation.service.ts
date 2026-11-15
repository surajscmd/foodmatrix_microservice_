import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { addDays, dateInRestaurant, inclusiveDays } from './hr-dates.js';

const zero = new Prisma.Decimal(0);

@Injectable()
export class PayrollCalculationService {
  async calculateStaffPayroll(
    tx: Prisma.TransactionClient,
    input: {
      employee: {
        id: string;
        firstName: string;
        lastName: string;
        terminatedAt: Date | null;
        assignments: { startsOn: Date; endsBefore: Date | null }[];
      };
      restaurantId: string;
      periodStartDate: Date;
      periodEndDate: Date;
      start: Date;
      end: Date;
      timeZone: string;
    },
  ) {
    const {
      employee,
      restaurantId,
      periodStartDate,
      periodEndDate,
      start,
      end,
      timeZone,
    } = input;
    const separation = employee.terminatedAt
      ? dateInRestaurant(employee.terminatedAt, timeZone)
      : null;
    const [shifts, wages, leaves] = await this.fetchRecords(
      tx,
      employee.id,
      restaurantId,
      periodStartDate,
      periodEndDate,
      start,
      end,
    );
    let regularHours = zero;
    let overtimeHours = zero;
    let regularPay = zero;
    let overtimePay = zero;
    let paidLeaveHours = zero;
    let leavePay = zero;
    let salary = zero;

    for (const shift of shifts) {
      regularHours = regularHours.add(shift.regularHours ?? zero);
      overtimeHours = overtimeHours.add(shift.overtimeHours ?? zero);
      regularPay = regularPay.add(
        (shift.hourlyWageAtShift ?? zero).mul(shift.regularHours ?? zero),
      );
      overtimePay = overtimePay.add(
        (shift.overtimeRateAtShift ?? shift.hourlyWageAtShift ?? zero).mul(
          shift.overtimeHours ?? zero,
        ),
      );
    }

    for (
      let date = periodStartDate;
      date <= periodEndDate && (!separation || date <= separation);
      date = addDays(date, 1)
    ) {
      const assignedHere = employee.assignments.some(
        ({ startsOn, endsBefore }) =>
          startsOn <= date && (!endsBefore || date < endsBefore),
      );
      if (!assignedHere) continue;
      const wage = wages.find(
        ({ effectiveStartDate, effectiveEndDate }) =>
          effectiveStartDate <= date &&
          (!effectiveEndDate || effectiveEndDate >= date),
      );
      if (!wage) {
        throw new ConflictException(
          `Missing wage for ${employee.firstName} ${employee.lastName} on ${date.toISOString().slice(0, 10)}`,
        );
      }
      const paidLeave = leaves.some(
        ({ startDate, endDate }) => startDate <= date && endDate >= date,
      );
      if (paidLeave) paidLeaveHours = paidLeaveHours.add(8);
      if (wage.payType === 'SALARY') {
        const monthStart = new Date(date);
        monthStart.setUTCDate(1);
        const nextMonth = new Date(monthStart);
        nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
        salary = salary.add(
          (wage.salaryAmount ?? zero).div(
            inclusiveDays(monthStart, addDays(nextMonth, -1)),
          ),
        );
      } else if (paidLeave) {
        leavePay = leavePay.add((wage.hourlyWage ?? zero).mul(8));
      }
    }
    regularPay = regularPay.add(salary).add(leavePay).toDecimalPlaces(2);
    overtimePay = overtimePay.toDecimalPlaces(2);
    const gross = regularPay.add(overtimePay);
    return {
      shiftIds: shifts.map(({ id }) => id),
      regularHours,
      overtimeHours,
      paidLeaveHours,
      regularPay,
      overtimePay,
      grossPay: gross,
      netPay: gross,
      taxDeductions: zero,
      otherDeductions: zero,
    };
  }

  private async fetchRecords(
    tx: Prisma.TransactionClient,
    staffId: string,
    restaurantId: string,
    periodStart: Date,
    periodEnd: Date,
    start: Date,
    end: Date,
  ) {
    const shifts = await tx.shift.findMany({
      where: {
        staffId,
        restaurantId,
        clockInAt: { gte: start, lt: end },
        clockOutAt: { not: null },
        voidedAt: null,
        isProcessedForPay: false,
        payrollRunId: null,
      },
      select: {
        id: true,
        regularHours: true,
        overtimeHours: true,
        hourlyWageAtShift: true,
        overtimeRateAtShift: true,
      },
    });
    const wages = await tx.wageHistory.findMany({
      where: {
        staffId,
        effectiveStartDate: { lte: periodEnd },
        OR: [
          { effectiveEndDate: null },
          { effectiveEndDate: { gte: periodStart } },
        ],
      },
      orderBy: { effectiveStartDate: 'desc' },
    });
    const leaves = await tx.leave.findMany({
      where: {
        staffId,
        restaurantId,
        status: 'APPROVED',
        isPaidLeave: true,
        startDate: { lte: periodEnd },
        endDate: { gte: periodStart },
      },
      select: { startDate: true, endDate: true },
    });
    return [shifts, wages, leaves] as const;
  }
}
