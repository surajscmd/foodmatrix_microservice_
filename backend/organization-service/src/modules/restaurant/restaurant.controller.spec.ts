import { expect, it, jest } from '@jest/globals';
import type { RestaurantService } from './restaurant.service.js';

jest.unstable_mockModule('../../auth/auth.guard.js', () => ({
  AuthGuard: class {},
  Roles: () => () => undefined,
}));
const { RestaurantController } = await import('./restaurant.controller.js');

it('limits Operations reads to the assigned restaurant and rejects an unassigned restaurant admin', async () => {
  const findAll = jest.fn<RestaurantService['findAll']>().mockResolvedValue([]);
  const controller = new RestaurantController({
    findAll,
  } as unknown as RestaurantService);
  const user = {
    id: 'caller',
    role: 'OPERATIONS' as const,
    franchiseId: 'franchise',
    managedRestaurantId: 'location',
  };
  await controller.findAll({ user } as never);
  expect(findAll).toHaveBeenCalledWith({
    franchiseId: 'franchise',
    id: 'location',
  });
  await expect(
    controller.findAll({
      user: { ...user, role: 'RESTAURANT_ADMIN', managedRestaurantId: null },
    } as never),
  ).rejects.toThrow('No restaurant is assigned');
  expect(findAll).toHaveBeenCalledTimes(1);
});
