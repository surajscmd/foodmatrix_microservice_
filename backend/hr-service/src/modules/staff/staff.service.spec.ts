import { EmployeeStatus, type Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../auth/auth.types.js';
import type { PrismaService } from '../../lib/prisma/prisma.service.js';
import { StaffService } from './staff.service.js';

const restaurant = {
  id: 'assigned',
  name: 'Assigned',
  timezone: 'UTC',
  currency: 'INR',
};
const manager: AuthenticatedUser = {
  id: 'manager',
  role: 'RESTAURANT_ADMIN',
  franchiseId: 'franchise',
  managedRestaurantId: restaurant.id,
  restaurants: [restaurant],
};

it('keeps the original termination date when a termination is retried', async () => {
  const terminatedAt = new Date('2026-11-15T11:00:00.000Z');
  const update = jest
    .fn<Promise<unknown>, [Prisma.StaffUpdateArgs]>()
    .mockResolvedValue({ terminatedAt });
  const closeAssignment = jest.fn();
  const tx = {
    staff: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ restaurantId: restaurant.id, terminatedAt }),
      update,
    },
    staffAssignment: { updateMany: closeAssignment },
  };
  const prisma = {
    $transaction: (work: (client: typeof tx) => Promise<unknown>) => work(tx),
  } as unknown as PrismaService;
  await new StaffService(prisma).updateStatus(
    'staff',
    EmployeeStatus.TERMINATED,
    manager,
  );
  expect(update.mock.calls[0]?.[0]).toMatchObject({ data: { terminatedAt } });
  expect(closeAssignment).not.toHaveBeenCalled();
});

it('rejects staff writes from a manager at another restaurant', async () => {
  const update = jest.fn();
  const tx = {
    staff: {
      findUnique: jest.fn().mockResolvedValue({ restaurantId: 'other' }),
      update,
    },
  };
  const prisma = {
    $transaction: (work: (client: typeof tx) => Promise<unknown>) => work(tx),
  } as unknown as PrismaService;
  await expect(
    new StaffService(prisma).updateStatus(
      'staff',
      EmployeeStatus.TERMINATED,
      manager,
    ),
  ).rejects.toThrow('You do not have access to these HR records');
  expect(update).not.toHaveBeenCalled();
});
