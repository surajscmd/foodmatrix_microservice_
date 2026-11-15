import type { Prisma } from '@prisma/client';
import type { PrismaService } from '../../lib/prisma/prisma.service.js';
import { ShiftScheduleService } from './shift-schedule.service.js';

it('blocks a shift on approved leave using the restaurant calendar day', async () => {
  const findLeave = jest
    .fn<Promise<unknown>, [Prisma.LeaveFindFirstArgs]>()
    .mockResolvedValue({ id: 'leave' });
  const create = jest.fn();
  const tx = {
    staff: { findFirst: jest.fn().mockResolvedValue({ id: 'staff' }) },
    leave: { findFirst: findLeave },
    shiftSchedule: { create },
  };
  const prisma = {
    $transaction: (work: (client: typeof tx) => Promise<unknown>) => work(tx),
  } as unknown as PrismaService;

  await expect(
    new ShiftScheduleService(prisma).create(
      {
        restaurantId: 'restaurant',
        staffId: 'staff',
        shiftTemplateId: 'template',
        scheduledStart: '2026-11-15T19:00:00.000Z',
        scheduledEnd: '2026-11-16T02:00:00.000Z',
      },
      'Asia/Kolkata',
    ),
  ).rejects.toThrow('overlaps approved leave');
  const day = new Date('2026-11-16T00:00:00.000Z');
  expect(findLeave.mock.calls[0]?.[0]).toMatchObject({
    where: { startDate: { lte: day }, endDate: { gte: day } },
  });
  expect(create).not.toHaveBeenCalled();
});
