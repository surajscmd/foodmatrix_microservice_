import { PaymentMethod, PayrollStatus, type Prisma } from '@prisma/client';
import type { PrismaService } from '../../lib/prisma/prisma.service.js';
import { PayrollCalculationService } from './payroll-calculation.service.js';
import { PayrollService } from './payroll.service.js';

const updatedAt = new Date('2026-11-15T10:00:00Z');
const version = { expectedUpdatedAt: updatedAt.toISOString() };

function serviceFor(
  status: PayrollStatus,
  payslips: { status: PayrollStatus }[],
) {
  const updateRun = jest
    .fn<Promise<unknown>, [Prisma.PayrollRunUpdateArgs]>()
    .mockResolvedValue({ id: 'run', status: PayrollStatus.PAID });
  const updatePayslips = jest.fn().mockResolvedValue({ count: 1 });
  const tx = {
    payrollRun: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: 'run', status, payslips, updatedAt }),
      update: updateRun,
    },
    payslip: { updateMany: updatePayslips },
  };
  const prisma = {
    $transaction: (work: (client: typeof tx) => Promise<unknown>) => work(tx),
  } as unknown as PrismaService;
  return {
    service: new PayrollService(prisma, new PayrollCalculationService()),
    updateRun,
    updatePayslips,
  };
}

it('requires calculated payslips before approving payroll', async () => {
  const { service, updateRun } = serviceFor(PayrollStatus.DRAFT, []);
  await expect(service.approve('run', version)).rejects.toThrow(
    'This payroll run is not ready for that action',
  );
  expect(updateRun).not.toHaveBeenCalled();
});

it('rejects approvals based on an outdated payroll version', async () => {
  const { service, updateRun } = serviceFor(PayrollStatus.DRAFT, [
    { status: PayrollStatus.DRAFT },
  ]);
  await expect(
    service.approve('run', { expectedUpdatedAt: '2026-11-15T09:00:00Z' }),
  ).rejects.toThrow('Payroll changed');
  expect(updateRun).not.toHaveBeenCalled();
});

it('records an external payment on the approved run and its payslips', async () => {
  const { service, updateRun, updatePayslips } = serviceFor(
    PayrollStatus.APPROVED,
    [{ status: PayrollStatus.APPROVED }],
  );
  await service.pay(
    'run',
    { ...version, method: PaymentMethod.CASH, reference: 'cash-123' },
    'manager',
  );

  expect(updatePayslips).toHaveBeenCalledWith({
    where: { payrollRunId: 'run' },
    data: { status: 'PAID', paymentMethod: 'CASH' },
  });
  expect(updateRun.mock.calls[0]?.[0]).toMatchObject({
    data: { status: 'PAID', paidById: 'manager', paymentReference: 'cash-123' },
  });
});
