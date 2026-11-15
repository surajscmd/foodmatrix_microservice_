import { PayType, type Prisma } from '@prisma/client';
import type { PrismaService } from '../../lib/prisma/prisma.service.js';
import { WageService } from './wage.service.js';

const change = {
  staffId: 'staff',
  payType: PayType.HOURLY,
  hourlyWage: 500,
  overtimeRate: 750,
  effectiveStartDate: '2026-11-16',
};

beforeEach(() => jest.useFakeTimers({ now: new Date('2026-11-09T12:00:00Z') }));
afterEach(() => jest.useRealTimers());

it('ends the current rate on the day before the new rate takes effect', async () => {
  const update = jest.fn().mockResolvedValue({});
  const create = jest
    .fn<Promise<unknown>, [Prisma.WageHistoryCreateArgs]>()
    .mockResolvedValue({ id: 'new-wage' });
  const tx = {
    staff: {
      findFirst: jest.fn().mockResolvedValue({ restaurantId: 'restaurant' }),
    },
    wageHistory: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'old-wage',
        effectiveStartDate: new Date('2026-11-01'),
        effectiveEndDate: null,
      }),
      update,
      create,
    },
  };
  const prisma = {
    $transaction: (work: (client: typeof tx) => Promise<unknown>) => work(tx),
  } as unknown as PrismaService;
  await new WageService(prisma).scheduleChange(change, 'Asia/Kolkata');

  expect(update).toHaveBeenCalledWith({
    where: { id: 'old-wage' },
    data: { effectiveEndDate: new Date('2026-11-15') },
  });
  expect(create.mock.calls[0]?.[0]).toMatchObject({
    data: { hourlyWage: 500, effectiveStartDate: new Date('2026-11-16') },
  });
});

it('rejects planning a new rate effective today in the restaurant time zone', async () => {
  jest.setSystemTime(new Date('2026-11-15T21:00:00Z'));
  const transaction = jest.fn();
  const prisma = { $transaction: transaction } as unknown as PrismaService;
  await expect(
    new WageService(prisma).scheduleChange(change, 'Asia/Kolkata'),
  ).rejects.toThrow('Choose an effective date after today');
  expect(transaction).not.toHaveBeenCalled();
});
