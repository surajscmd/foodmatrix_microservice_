import { ShiftType, type Prisma } from '@prisma/client';
import type { PrismaService } from '../../lib/prisma/prisma.service.js';
import { ShiftTemplateService } from './shift-template.service.js';

it('creates an active template with an overnight segment', async () => {
  const create = jest
    .fn<Promise<unknown>, [Prisma.ShiftTemplateCreateArgs]>()
    .mockResolvedValue({ id: 'template' });
  const prisma = {
    shiftTemplate: { findUnique: jest.fn().mockResolvedValue(null), create },
  } as unknown as PrismaService;
  const segments = [
    {
      sequence: 1,
      startTime: '22:00',
      endTime: '02:00',
      crossesMidnight: true,
    },
    {
      sequence: 2,
      startTime: '02:30',
      endTime: '05:00',
      crossesMidnight: false,
    },
  ];
  await new ShiftTemplateService(prisma).create({
    restaurantId: 'restaurant',
    type: ShiftType.NIGHT,
    name: 'Night',
    segments,
  });

  expect(create.mock.calls[0]?.[0]).toMatchObject({
    data: { status: 'ACTIVE', segments: { create: segments } },
  });
});

it('rejects overlapping segments before writing a template', async () => {
  const create = jest.fn();
  const prisma = {
    shiftTemplate: { findUnique: jest.fn().mockResolvedValue(null), create },
  } as unknown as PrismaService;
  await expect(
    new ShiftTemplateService(prisma).create({
      restaurantId: 'restaurant',
      type: ShiftType.MORNING,
      name: 'Overlapping',
      segments: [
        {
          sequence: 1,
          startTime: '09:00',
          endTime: '12:00',
          crossesMidnight: false,
        },
        {
          sequence: 2,
          startTime: '11:30',
          endTime: '14:00',
          crossesMidnight: false,
        },
      ],
    }),
  ).rejects.toThrow('non-overlapping time blocks');
  expect(create).not.toHaveBeenCalled();
});
