import { expect, it, jest } from '@jest/globals';
import type { Prisma } from '@prisma/client';
import { RestaurantService } from './restaurant.service.js';
import type { PrismaService } from '../../lib/prisma/prisma.service.js';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto.js';
import { validateSync } from 'class-validator';

it('preserves the caller scope when a different restaurant ID is requested', async () => {
  const findFirst = jest
    .fn<(args: Prisma.RestaurantFindFirstArgs) => Promise<null>>()
    .mockResolvedValue(null);
  const service = new RestaurantService({
    restaurant: { findFirst },
  } as unknown as PrismaService);
  const scope = { id: 'assigned', franchiseId: 'franchise' };
  await expect(service.findOne('other', scope)).rejects.toThrow(
    'Restaurant not found',
  );
  expect(findFirst).toHaveBeenCalledWith(
    expect.objectContaining({ where: { AND: [scope, { id: 'other' }] } }),
  );
});

it('rejects invalid time zones', () => {
  const dto = Object.assign(new UpdateRestaurantDto(), {
    timezone: 'Asia/Unknown',
  });
  expect(validateSync(dto)).toHaveLength(1);
  dto.timezone = 'Asia/Kolkata';
  expect(validateSync(dto)).toHaveLength(0);
});
