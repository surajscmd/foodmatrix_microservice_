import { NotificationDeliveryService } from './notification-delivery.service';
import type { PrismaService } from '../../lib/prisma/prisma.service';
import type { NotificationGateway } from '../../socket/notification.gateway';

const notification = {
  id: 'saved',
  scope: 'RESTAURANT',
  restaurantId: 'restaurant',
  warehouseId: null,
};
const input = {
  scope: 'RESTAURANT' as const,
  type: 'SYSTEM' as const,
  restaurantId: 'restaurant',
  title: 'Alert',
  message: 'Example',
};

function fixture() {
  const tx = {
    notification: {
      createManyAndReturn: jest
        .fn()
        .mockResolvedValue([{ id: notification.id }]),
    },
    notificationSocketOutbox: {
      createMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const prisma = {
    $transaction: jest.fn(
      async (callback: (client: typeof tx) => Promise<void>) => callback(tx),
    ),
    $queryRaw: jest
      .fn()
      .mockResolvedValueOnce([{ notificationId: notification.id }])
      .mockResolvedValue([]),
    notification: { findUnique: jest.fn().mockResolvedValue(notification) },
    notificationSocketOutbox: {
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const gateway = { emitToRestaurant: jest.fn(), emitToWarehouse: jest.fn() };
  const service = new NotificationDeliveryService(
    prisma as unknown as PrismaService,
    gateway as unknown as NotificationGateway,
  );
  return { tx, prisma, gateway, service };
}

it('commits the notification and queue entry together before emitting', async () => {
  const { tx, prisma, gateway, service } = fixture();
  await service.sendOnce('event', [input]);
  expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  expect(tx.notificationSocketOutbox.createMany).toHaveBeenCalledWith({
    data: [{ notificationId: notification.id }],
  });
  expect(
    tx.notificationSocketOutbox.createMany.mock.invocationCallOrder[0],
  ).toBeLessThan(gateway.emitToRestaurant.mock.invocationCallOrder[0]);
  expect(gateway.emitToRestaurant).toHaveBeenCalledWith(
    'restaurant',
    notification,
  );
  expect(prisma.notificationSocketOutbox.deleteMany).toHaveBeenCalledTimes(1);
});

it('does not emit when the atomic queue write fails', async () => {
  const { tx, prisma, gateway, service } = fixture();
  tx.notificationSocketOutbox.createMany.mockRejectedValueOnce(
    new Error('Queue write failed'),
  );
  await expect(service.sendOnce('event', [input])).rejects.toThrow(
    'Queue write failed',
  );
  expect(prisma.$queryRaw).not.toHaveBeenCalled();
  expect(gateway.emitToRestaurant).not.toHaveBeenCalled();
});

it('keeps failed emissions pending and allows another worker to recover them', async () => {
  const { prisma, gateway, service } = fixture();
  gateway.emitToRestaurant.mockImplementationOnce(() => {
    throw new Error('Socket emission failed');
  });
  await service.sendOnce('event', [input]);
  expect(prisma.notificationSocketOutbox.deleteMany).not.toHaveBeenCalled();
  prisma.$queryRaw
    .mockResolvedValueOnce([{ notificationId: notification.id }])
    .mockResolvedValue([]);
  const restarted = new NotificationDeliveryService(
    prisma as unknown as PrismaService,
    gateway as unknown as NotificationGateway,
  );
  await restarted.flushPending();
  expect(gateway.emitToRestaurant).toHaveBeenCalledTimes(2);
  expect(prisma.notificationSocketOutbox.deleteMany).toHaveBeenCalledTimes(1);
});

it('does not queue another emission for a duplicate event', async () => {
  const { tx, prisma, service } = fixture();
  tx.notification.createManyAndReturn.mockResolvedValueOnce([]);
  prisma.$queryRaw.mockReset().mockResolvedValue([]);
  await service.sendOnce('event', [input]);
  expect(tx.notificationSocketOutbox.createMany).not.toHaveBeenCalled();
});

it('drains persisted notifications even when their creation happened in a previous process', async () => {
  const { prisma, gateway, service } = fixture();
  await service.flushPending();
  expect(prisma.$transaction).not.toHaveBeenCalled();
  expect(gateway.emitToRestaurant).toHaveBeenCalledTimes(1);
});
