import { LeaveStatus, type Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../auth/auth.types.js';
import type { PrismaService } from '../../lib/prisma/prisma.service.js';
import type { KafkaProducerService } from '../kafka/kafka-producer.service.js';
import { LeaveService } from './leave.service.js';

const manager: AuthenticatedUser = {
  id: 'manager',
  role: 'SUPER_ADMIN',
  franchiseId: null,
  managedRestaurantId: null,
  restaurants: [],
};

function serviceFor<T>(tx: T) {
  const prisma = {
    $transaction: (work: (client: T) => Promise<unknown>) => work(tx),
  } as unknown as PrismaService;
  const enqueue = jest
    .fn<Promise<void>, Parameters<KafkaProducerService['enqueue']>>()
    .mockResolvedValue(undefined);
  const service = new LeaveService(prisma, {
    enqueue,
  } as unknown as KafkaProducerService);
  return { service, enqueue };
}

it('stores and counts leave inclusively as calendar dates', async () => {
  const create = jest.fn(
    ({ data }: { data: Prisma.LeaveUncheckedCreateInput }) =>
      Promise.resolve({ id: 'leave', ...data }),
  );
  const { service, enqueue } = serviceFor({
    staff: {
      findFirst: jest.fn().mockResolvedValue({ restaurantId: 'restaurant' }),
    },
    leave: { findFirst: jest.fn().mockResolvedValue(null), create },
  });

  await service.create(
    {
      staffId: 'staff',
      type: 'Annual',
      isPaidLeave: true,
      startDate: '2026-03-07',
      endDate: '2026-03-09',
      reason: 'Holiday',
    },
    manager,
  );
  expect(create.mock.calls[0]?.[0].data).toMatchObject({ totalDays: 3 });
  expect(enqueue.mock.calls[0]?.[2]).toMatchObject({
    startDate: '2026-03-07T00:00:00.000Z',
    endDate: '2026-03-09T00:00:00.000Z',
    totalDays: '3',
  });
});

it('leaves a revoked request untouched when the same action is retried', async () => {
  const update = jest.fn();
  const { service, enqueue } = serviceFor({
    leave: {
      findUnique: jest.fn().mockResolvedValue({
        restaurantId: 'restaurant',
        status: LeaveStatus.REVOKED,
      }),
      update,
    },
  });
  await expect(
    service.revoke(
      'leave',
      {
        expectedStatus: 'PENDING',
        expectedUpdatedAt: '2026-03-06T12:00:00.000Z',
        reason: 'Changed plans',
      },
      manager,
    ),
  ).resolves.toEqual({ message: 'Leave has already been revoked' });
  expect(update).not.toHaveBeenCalled();
  expect(enqueue).not.toHaveBeenCalled();
});

it('preserves approved paid leave once the overlapping payroll is paid', async () => {
  const update = jest.fn();
  const updatedAt = new Date('2026-03-06T12:00:00.000Z');
  const { service, enqueue } = serviceFor({
    leave: {
      findUnique: jest.fn().mockResolvedValue({
        restaurantId: 'restaurant',
        staffId: 'staff',
        status: LeaveStatus.APPROVED,
        isPaidLeave: true,
        updatedAt,
        startDate: new Date('2026-03-07'),
        endDate: new Date('2026-03-09'),
      }),
      update,
    },
    payslip: {
      findFirst: jest
        .fn()
        .mockResolvedValue({ payrollRun: { status: 'PAID' } }),
    },
  });
  await expect(
    service.revoke(
      'leave',
      {
        expectedStatus: 'APPROVED',
        expectedUpdatedAt: updatedAt.toISOString(),
        reason: 'Changed plans',
      },
      manager,
    ),
  ).rejects.toThrow('Its payroll records are locked');
  expect(update).not.toHaveBeenCalled();
  expect(enqueue).not.toHaveBeenCalled();
});
