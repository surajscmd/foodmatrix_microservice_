import { Prisma } from '@prisma/client';
import { PayrollCalculationService } from './payroll-calculation.service.js';
import { restaurantDayStart } from './hr-dates.js';

const date = (day: string) => new Date(`${day}T00:00:00.000Z`);
const periodStartDate = date('2026-11-01');
const periodEndDate = date('2026-11-30');
const timeZone = 'Asia/Kolkata';
const context = {
  periodStartDate,
  periodEndDate,
  timeZone,
  start: restaurantDayStart(periodStartDate, timeZone),
  end: restaurantDayStart(date('2026-12-01'), timeZone),
};
const staff = {
  id: 'staff',
  firstName: 'Test',
  lastName: 'Staff',
  terminatedAt: null,
};
const calculator = new PayrollCalculationService();

function database(payType: 'HOURLY' | 'SALARY', shifts: unknown[]) {
  const findShifts = jest
    .fn<Promise<unknown[]>, [Prisma.ShiftFindManyArgs]>()
    .mockResolvedValue(shifts);
  const tx = {
    shift: { findMany: findShifts },
    wageHistory: {
      findMany: jest.fn().mockResolvedValue([
        {
          payType,
          effectiveStartDate: periodStartDate,
          effectiveEndDate: null,
          salaryAmount: new Prisma.Decimal(30_000),
        },
      ]),
    },
    leave: { findMany: jest.fn().mockResolvedValue([]) },
  } as unknown as Prisma.TransactionClient;
  return { tx, findShifts };
}

it('allocates the monthly salary across the transfer date exactly once', async () => {
  const { tx } = database('SALARY', []);
  const transferDate = date('2026-11-16');
  const old = await calculator.calculateStaffPayroll(tx, {
    ...context,
    restaurantId: 'old',
    employee: {
      ...staff,
      assignments: [{ startsOn: periodStartDate, endsBefore: transferDate }],
    },
  });
  const current = await calculator.calculateStaffPayroll(tx, {
    ...context,
    restaurantId: 'new',
    employee: {
      ...staff,
      assignments: [{ startsOn: transferDate, endsBefore: null }],
    },
  });
  expect(old.grossPay.toNumber()).toBe(15_000);
  expect(current.grossPay.toNumber()).toBe(15_000);
});

it('pays punches from a former location even when a legacy assignment is missing', async () => {
  const { tx, findShifts } = database('HOURLY', [
    {
      id: 'old-punch',
      regularHours: new Prisma.Decimal(8),
      overtimeHours: new Prisma.Decimal(0),
      hourlyWageAtShift: new Prisma.Decimal(500),
      overtimeRateAtShift: null,
    },
  ]);
  const result = await calculator.calculateStaffPayroll(tx, {
    ...context,
    restaurantId: 'old',
    employee: { ...staff, assignments: [] },
  });
  expect(result.shiftIds).toEqual(['old-punch']);
  expect(result.grossPay.toNumber()).toBe(4000);
  expect(findShifts.mock.calls[0]?.[0]).toMatchObject({
    where: { restaurantId: 'old', voidedAt: null },
  });
});

it('ends salary on the termination day in the restaurant time zone', async () => {
  const { tx } = database('SALARY', []);
  const result = await calculator.calculateStaffPayroll(tx, {
    ...context,
    restaurantId: 'restaurant',
    employee: {
      ...staff,
      terminatedAt: new Date('2026-11-10T20:00:00Z'),
      assignments: [{ startsOn: periodStartDate, endsBefore: null }],
    },
  });
  expect(result.grossPay.toNumber()).toBe(11_000);
});
