import { expect, it, jest } from '@jest/globals';
import type { Prisma } from '@prisma/client';
import { SystemUserService } from './system-user.service.js';
import type { PrismaService } from '../../lib/prisma/prisma.service.js';

it('deactivates scoped accounts and deletes their sessions inside the same transaction', async () => {
  const updateMany = jest
    .fn<
      (args: Prisma.SystemUserUpdateManyArgs) => Promise<Prisma.BatchPayload>
    >()
    .mockResolvedValue({ count: 1 });
  const deleteMany = jest
    .fn<(args: Prisma.SessionDeleteManyArgs) => Promise<Prisma.BatchPayload>>()
    .mockResolvedValue({ count: 2 });
  const target = { id: 'target', authUserId: 'login', isActive: false };
  const tx = {
    systemUser: {
      updateMany,
      findUniqueOrThrow: () => Promise.resolve(target),
    },
    session: { deleteMany },
  };
  const service = new SystemUserService({
    $transaction: (work: (client: typeof tx) => Promise<unknown>) => work(tx),
  } as unknown as PrismaService);
  const actor = {
    id: 'caller',
    role: 'FRANCHISE_ADMIN' as const,
    franchiseId: 'franchise',
    managedRestaurantId: null,
  };

  await expect(service.setActive(actor, 'target', false)).resolves.toEqual(
    target,
  );
  expect(updateMany).toHaveBeenCalledWith({
    where: {
      id: 'target',
      authUserId: { not: 'caller' },
      franchiseId: 'franchise',
      role: { in: ['RESTAURANT_ADMIN', 'STAFF', 'OPERATIONS'] },
    },
    data: { isActive: false },
  });
  expect(deleteMany).toHaveBeenCalledWith({ where: { userId: 'login' } });
  updateMany.mockResolvedValueOnce({ count: 0 });
  await expect(service.setActive(actor, 'other', false)).rejects.toThrow(
    'Manageable system login not found',
  );
  expect(deleteMany).toHaveBeenCalledTimes(1);
});
