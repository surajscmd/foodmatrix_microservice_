import { expect, it, jest } from '@jest/globals';
import { FranchiseService } from './franchise.service.js';
import type { PrismaService } from '../../lib/prisma/prisma.service.js';

it('reads the requested franchise and returns 404 when it is absent', async () => {
  const findUnique = jest.fn(({ where }: { where: { id: string } }) =>
    Promise.resolve(where.id === 'assigned' ? { id: where.id } : null),
  );
  const service = new FranchiseService({
    franchise: { findUnique },
  } as unknown as PrismaService);
  await expect(service.find('assigned')).resolves.toEqual({ id: 'assigned' });
  await expect(service.find('absent')).rejects.toThrow('Franchise not found');
  expect(findUnique).toHaveBeenCalledWith({ where: { id: 'assigned' } });
});
