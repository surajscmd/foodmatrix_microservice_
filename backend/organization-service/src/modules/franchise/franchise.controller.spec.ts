import { expect, it, jest } from '@jest/globals';
import type { FranchiseService } from './franchise.service.js';

jest.unstable_mockModule('../../auth/auth.guard.js', () => ({
  AuthGuard: class {},
  Roles: () => () => undefined,
}));
const { FranchiseController } = await import('./franchise.controller.js');

it('rejects updates to another franchise and lets super admins select one explicitly', async () => {
  const update = jest
    .fn<
      (
        ...args: Parameters<FranchiseService['update']>
      ) => Promise<{ id: string }>
    >()
    .mockResolvedValue({ id: 'other' });
  const controller = new FranchiseController({
    update,
  } as unknown as FranchiseService);
  const user = {
    id: 'caller',
    role: 'FRANCHISE_ADMIN' as const,
    franchiseId: 'assigned',
    managedRestaurantId: null,
  };
  await expect(
    controller.update({ user } as never, { name: 'New name' }, 'other'),
  ).rejects.toThrow('You do not have access');
  expect(update).not.toHaveBeenCalled();
  await controller.update(
    { user: { ...user, role: 'SUPER_ADMIN' } } as never,
    { name: 'New name' },
    'other',
  );
  expect(update).toHaveBeenCalledWith('other', { name: 'New name' });
});
