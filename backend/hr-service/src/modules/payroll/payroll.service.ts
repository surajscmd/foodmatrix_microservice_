import type { RestaurantFilter } from '../../auth/hr-access.js';
import type { HrRestaurant } from '../../auth/auth.types.js';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PayrollStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import type { CreatePayrollRunDto } from './dto/create-payroll-run.dto.js';
import type {
  PayrollDeductionsDto,
  PayrollVersionDto,
  RecordPayrollPaymentDto,
  ReopenPayrollDto,
} from './dto/payroll-actions.dto.js';
import { PayrollCalculationService } from './payroll-calculation.service.js';
import {
  addDays,
  dateInRestaurant,
  inclusiveDays,
  restaurantDayStart,
} from './hr-dates.js';

const withPayslips = {
  payslips: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      staff: {
        select: { firstName: true, lastName: true, employeeCode: true },
      },
    },
  },
};

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: PayrollCalculationService,
  ) {}

  async create(
    dto: CreatePayrollRunDto & { processedById: string },
    restaurant: HrRestaurant,
  ) {
    const { restaurantId, processedById } = dto;
    const start = this.parseDate(dto.periodStartDate);
    const end = this.parseDate(dto.periodEndDate);
    if (start > end)
      throw new BadRequestException(
        'Start date must be on or before the end date',
      );
    if (inclusiveDays(start, end) > 366)
      throw new BadRequestException('A pay period cannot exceed 366 days');
    if (end >= dateInRestaurant(new Date(), restaurant.timezone)) {
      throw new BadRequestException('Choose a pay period that has ended');
    }
    const data = await this.transaction(async (tx) => {
      const existing = await tx.payrollRun.findFirst({
        where: {
          restaurantId,
          periodStartDate: { lte: end },
          periodEndDate: { gte: start },
        },
      });
      if (existing)
        throw new ConflictException(
          'A payroll run already covers part of this period',
        );
      return tx.payrollRun.create({
        data: {
          restaurantId,
          processedById,
          restaurantName: restaurant.name,
          timezone: restaurant.timezone,
          currency: restaurant.currency,
          periodStartDate: start,
          periodEndDate: end,
        },
        include: withPayslips,
      });
    });
    return { message: 'Payroll run created', data };
  }

  async findAll(
    restaurantId?: RestaurantFilter,
    startValue?: string,
    endValue?: string,
  ) {
    const start = startValue ? this.parseDate(startValue) : undefined;
    const end = endValue ? this.parseDate(endValue) : undefined;
    if (start && end && start > end)
      throw new BadRequestException(
        'Start date must be on or before the end date',
      );
    const data = await this.prisma.payrollRun.findMany({
      where: {
        restaurantId,
        periodStartDate: end ? { lte: end } : undefined,
        periodEndDate: start ? { gte: start } : undefined,
      },
      orderBy: { periodStartDate: 'desc' },
      include: withPayslips,
    });
    return { message: 'Payroll runs fetched successfully', data };
  }

  async findOne(id: string) {
    const data = await this.prisma.payrollRun.findUnique({
      where: { id },
      include: withPayslips,
    });
    if (!data) throw new NotFoundException('Payroll run not found');
    return { message: 'Payroll run fetched successfully', data };
  }

  async process(id: string, restaurant: HrRestaurant) {
    const data = await this.transaction(async (tx) => {
      const run = await tx.payrollRun.findUnique({
        where: { id },
        include: withPayslips,
      });
      if (!run) throw new NotFoundException('Payroll run not found');
      if (run.status !== 'DRAFT' || run.payslips.length) {
        throw new ConflictException('This payroll run was already calculated');
      }
      const { restaurantId, periodStartDate, periodEndDate } = run;
      const timeZone = run.timezone ?? restaurant.timezone;
      const start = restaurantDayStart(periodStartDate, timeZone);
      const end = restaurantDayStart(addDays(periodEndDate, 1), timeZone);
      if (end > new Date())
        throw new BadRequestException(
          'The pay period must end before calculation',
        );
      const shiftWindow = {
        restaurantId,
        voidedAt: null,
        clockInAt: { gte: start, lt: end },
      };
      const openShift = await tx.shift.findFirst({
        where: { ...shiftWindow, clockOutAt: null },
        select: { staff: { select: { firstName: true, lastName: true } } },
      });
      if (openShift) {
        throw new ConflictException(
          `Close the open shift for ${openShift.staff.firstName} ${openShift.staff.lastName} before calculating payroll`,
        );
      }
      const overlap = await tx.payrollRun.findFirst({
        where: {
          id: { not: id },
          restaurantId,
          periodStartDate: { lte: periodEndDate },
          periodEndDate: { gte: periodStartDate },
          payslips: { some: {} },
        },
      });
      if (overlap)
        throw new ConflictException(
          'Another calculated payroll run overlaps this period',
        );

      const assignmentWindow = {
        restaurantId,
        startsOn: { lte: periodEndDate },
        OR: [{ endsBefore: null }, { endsBefore: { gt: periodStartDate } }],
      };
      const employees = await tx.staff.findMany({
        where: {
          createdAt: { lt: end },
          OR: [
            { assignments: { some: assignmentWindow } },
            { shifts: { some: { ...shiftWindow, isProcessedForPay: false } } },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          terminatedAt: true,
          assignments: {
            where: assignmentWindow,
            select: { startsOn: true, endsBefore: true },
          },
        },
      });
      let gross = new Prisma.Decimal(0);
      let taxes = new Prisma.Decimal(0);
      let net = new Prisma.Decimal(0);
      let count = 0;

      for (const employee of employees) {
        const { shiftIds, ...pay } =
          await this.calculator.calculateStaffPayroll(tx, {
            employee,
            restaurantId,
            periodStartDate,
            periodEndDate,
            start,
            end,
            timeZone,
          });
        if (
          !shiftIds.length &&
          pay.grossPay.isZero() &&
          pay.paidLeaveHours.isZero()
        )
          continue;
        await tx.payslip.create({
          data: {
            payrollRunId: id,
            staffId: employee.id,
            paymentMethod: 'DIRECT_DEPOSIT',
            ...pay,
          },
        });
        if (shiftIds.length) {
          const claimed = await tx.shift.updateMany({
            where: {
              id: { in: shiftIds },
              isProcessedForPay: false,
              payrollRunId: null,
            },
            data: { isProcessedForPay: true, payrollRunId: id },
          });
          if (claimed.count !== shiftIds.length)
            throw new ConflictException(
              'Attendance changed while calculating payroll',
            );
        }
        gross = gross.add(pay.grossPay);
        taxes = taxes.add(pay.taxDeductions);
        net = net.add(pay.netPay);
        count++;
      }
      if (!count)
        throw new BadRequestException(
          'No payable wages or attendance were found for this period',
        );

      return tx.payrollRun.update({
        where: { id },
        data: {
          totalGrossPay: gross,
          totalTaxes: taxes,
          totalNetPay: net,
          restaurantName: run.restaurantName ?? restaurant.name,
          timezone: timeZone,
          currency: run.currency ?? restaurant.currency,
        },
        include: withPayslips,
      });
    });
    return {
      message: 'Payroll calculated. Review the payslips before approving.',
      data,
    };
  }

  approve(id: string, dto: PayrollVersionDto) {
    return this.transition(
      id,
      PayrollStatus.DRAFT,
      PayrollStatus.APPROVED,
      'Payroll approved',
      dto,
    );
  }

  pay(id: string, dto: RecordPayrollPaymentDto, actorId: string) {
    return this.transition(
      id,
      PayrollStatus.APPROVED,
      PayrollStatus.PAID,
      'Payment recorded',
      dto,
      { method: dto.method, reference: dto.reference, actorId },
    );
  }

  async reopen(id: string, dto: ReopenPayrollDto, actorId: string) {
    const data = await this.transaction(async (tx) => {
      const run = await tx.payrollRun.findUnique({
        where: { id },
        include: withPayslips,
      });
      this.checkVersion(run, dto);
      if (
        run.status === 'PAID' ||
        !run.payslips.length ||
        run.payslips.some((slip) => slip.status !== run.status)
      ) {
        throw new ConflictException(
          'Only calculated, unpaid payroll can be reopened',
        );
      }

      const legacyPunch = await tx.shift.findFirst({
        where: {
          restaurantId: run.restaurantId,
          staffId: { in: run.payslips.map(({ staffId }) => staffId) },
          isProcessedForPay: true,
          payrollRunId: null,
          // Legacy runs do not record the timezone used when their punches were claimed.
          clockInAt: {
            gte: addDays(run.periodStartDate, -1),
            lt: addDays(run.periodEndDate, 2),
          },
        },
        select: { id: true },
      });
      if (legacyPunch) {
        throw new ConflictException(
          'This run contains older attendance without a payroll link. It cannot be reopened safely.',
        );
      }

      await tx.shift.updateMany({
        where: { payrollRunId: id },
        data: { payrollRunId: null, isProcessedForPay: false },
      });
      await tx.payslip.deleteMany({ where: { payrollRunId: id } });
      return tx.payrollRun.update({
        where: { id },
        data: {
          status: 'DRAFT',
          totalGrossPay: 0,
          totalTaxes: 0,
          totalNetPay: 0,
          reopenedAt: new Date(),
          reopenedById: actorId,
          reopenReason: dto.reason,
        },
        include: withPayslips,
      });
    });
    return {
      message: 'Payroll reopened. Make corrections, then calculate it again.',
      data,
    };
  }

  async saveDeductions(
    id: string,
    payslipId: string,
    dto: PayrollDeductionsDto,
  ) {
    const data = await this.transaction(async (tx) => {
      const run = await tx.payrollRun.findUnique({
        where: { id },
        include: withPayslips,
      });
      this.checkVersion(run, dto);
      if (run.status !== 'DRAFT')
        throw new ConflictException(
          'Deductions can only be changed before approval',
        );
      const slip = run.payslips.find(({ id }) => id === payslipId);
      if (!slip || slip.status !== 'DRAFT')
        throw new NotFoundException('Draft payslip not found for this run');
      const tax = new Prisma.Decimal(dto.taxDeductions);
      const other = new Prisma.Decimal(dto.otherDeductions);
      const net = slip.grossPay.sub(tax).sub(other);
      if (net.lt(0))
        throw new BadRequestException(
          'Total deductions cannot exceed gross pay',
        );
      await tx.payslip.update({
        where: { id: payslipId },
        data: { taxDeductions: tax, otherDeductions: other, netPay: net },
      });
      const totals = await tx.payslip.aggregate({
        where: { payrollRunId: id },
        _sum: { taxDeductions: true, netPay: true },
      });
      return tx.payrollRun.update({
        where: { id },
        data: {
          totalTaxes: totals._sum.taxDeductions ?? 0,
          totalNetPay: totals._sum.netPay ?? 0,
        },
        include: withPayslips,
      });
    });
    return { message: 'Payslip deductions saved', data };
  }

  async removeDraft(id: string) {
    await this.transaction(async (tx) => {
      const deleted = await tx.payrollRun.deleteMany({
        where: { id, status: 'DRAFT', payslips: { none: {} } },
      });
      if (!deleted.count)
        throw new ConflictException(
          'Only a draft without payslips can be discarded',
        );
    });
    return { message: 'Payroll draft discarded' };
  }

  private async transition(
    id: string,
    from: PayrollStatus,
    to: PayrollStatus,
    message: string,
    version: PayrollVersionDto,
    payment?: Pick<RecordPayrollPaymentDto, 'method' | 'reference'> & {
      actorId: string;
    },
  ) {
    const data = await this.transaction(async (tx) => {
      const run = await tx.payrollRun.findUnique({
        where: { id },
        include: withPayslips,
      });
      this.checkVersion(run, version);
      if (
        run.status !== from ||
        !run.payslips.length ||
        run.payslips.some((slip) => slip.status !== from)
      ) {
        throw new ConflictException(
          'This payroll run is not ready for that action',
        );
      }
      await tx.payslip.updateMany({
        where: { payrollRunId: id },
        data: { status: to, ...(payment && { paymentMethod: payment.method }) },
      });
      return tx.payrollRun.update({
        where: { id },
        data: {
          status: to,
          ...(payment && {
            paidAt: new Date(),
            paidById: payment.actorId,
            paymentReference: payment.reference,
          }),
        },
        include: withPayslips,
      });
    });
    return { message, data };
  }

  private checkVersion<T extends { updatedAt: Date }>(
    run: T | null,
    version: PayrollVersionDto,
  ): asserts run is T {
    if (!run) throw new NotFoundException('Payroll run not found');
    if (
      run.updatedAt.getTime() !== new Date(version.expectedUpdatedAt).getTime()
    ) {
      throw new ConflictException(
        'Payroll changed. Reopen the run to review the latest amounts.',
      );
    }
  }

  private parseDate(value: string) {
    const date = new Date(value);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      throw new BadRequestException('Enter a valid date in YYYY-MM-DD format');
    }
    return date;
  }

  private transaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma
      .$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 60_000,
      })
      .catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034'
        ) {
          throw new ConflictException(
            'Payroll changed while saving. Refresh and try again.',
          );
        }
        throw error;
      });
  }
}
