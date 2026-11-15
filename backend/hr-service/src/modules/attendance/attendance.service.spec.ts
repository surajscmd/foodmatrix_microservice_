import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { PrismaService } from '../../lib/prisma/prisma.service.js';
import type { KafkaProducerService } from '../kafka/kafka-producer.service.js';
import { AttendanceService } from './attendance.service.js';

it('leaves a punch untouched if another request already closed it', async () => {
  const updateMany = jest.fn().mockResolvedValue({ count: 0 });
  const enqueue = jest.fn();
  const tx = {
    shift: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'shift',
        clockInAt: new Date(Date.now() - 60_000),
        clockOutAt: null,
      }),
      updateMany,
    },
  };
  const service = new AttendanceService(
    {
      $transaction: (work: (client: typeof tx) => Promise<unknown>) => work(tx),
    } as unknown as PrismaService,
    { enqueue } as unknown as KafkaProducerService,
  );
  await expect(service.clockOut({ shiftId: 'shift' })).rejects.toBeInstanceOf(
    ConflictException,
  );
  expect(updateMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        id: 'shift',
        clockOutAt: null,
        voidedAt: null,
        isProcessedForPay: false,
      },
    }),
  );
  expect(enqueue).not.toHaveBeenCalled();
});

it('converts the single-open-punch constraint failure into a conflict', async () => {
  const enqueue = jest.fn();
  const collision = new Prisma.PrismaClientKnownRequestError('already open', {
    code: 'P2002',
    clientVersion: 'test',
  });
  const tx = {
    staff: { findFirst: jest.fn().mockResolvedValue({ id: 'staff' }) },
    shiftSchedule: {
      findFirst: jest.fn().mockResolvedValue({
        scheduledStart: new Date(Date.now() - 60_000),
        scheduledEnd: new Date(Date.now() + 60_000),
        shiftTemplate: { type: 'MORNING' },
      }),
    },
    wageHistory: {
      findFirst: jest
        .fn()
        .mockResolvedValue({ payType: 'HOURLY', hourlyWage: 100 }),
    },
    shift: { create: jest.fn().mockRejectedValue(collision) },
  };
  const service = new AttendanceService(
    {
      $transaction: (work: (client: typeof tx) => Promise<unknown>) => work(tx),
    } as unknown as PrismaService,
    { enqueue } as unknown as KafkaProducerService,
  );
  await expect(
    service.clockIn(
      {
        restaurantId: 'restaurant',
        staffId: 'staff',
        shiftScheduleId: 'schedule',
      },
      'Asia/Kolkata',
    ),
  ).rejects.toThrow('Staff member already has an active shift');
  expect(enqueue).not.toHaveBeenCalled();
});

it.each([
  [60_000, 120_000],
  [-120_000, -60_000],
])('rejects clock-in outside the scheduled shift', async (start, end) => {
  const create = jest.fn();
  const tx = {
    staff: { findFirst: jest.fn().mockResolvedValue({ id: 'staff' }) },
    shiftSchedule: {
      findFirst: jest.fn().mockResolvedValue({
        scheduledStart: new Date(Date.now() + start),
        scheduledEnd: new Date(Date.now() + end),
        shiftTemplate: { type: 'MORNING' },
      }),
    },
    shift: { create },
  };
  const service = new AttendanceService(
    {
      $transaction: (work: (client: typeof tx) => Promise<unknown>) => work(tx),
    } as unknown as PrismaService,
    {} as KafkaProducerService,
  );
  await expect(
    service.clockIn(
      {
        restaurantId: 'restaurant',
        staffId: 'staff',
        shiftScheduleId: 'schedule',
      },
      'Asia/Kolkata',
    ),
  ).rejects.toThrow('Clock-in is only available during the scheduled shift');
  expect(create).not.toHaveBeenCalled();
});
