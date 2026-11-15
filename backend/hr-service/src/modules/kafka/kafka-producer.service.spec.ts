import { Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { Kafka, type Producer } from 'kafkajs';
import type { PrismaService } from '../../lib/prisma/prisma.service.js';
import { KafkaProducerService } from './kafka-producer.service.js';

const event = {
  id: 'event',
  topic: 'hr.leave-decision',
  payload: { leaveId: 'leave', status: 'REVOKED' },
};

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it('queues a leave event through the supplied database transaction', async () => {
  const create = jest.fn().mockResolvedValue({});
  jest.spyOn(Kafka.prototype, 'producer').mockReturnValue({} as Producer);
  const service = new KafkaProducerService({} as PrismaService);
  const tx = {
    hrEventOutbox: { create },
  } as unknown as Prisma.TransactionClient;

  await service.enqueue(tx, event.topic, event.payload);
  expect(create).toHaveBeenCalledWith({
    data: { topic: event.topic, payload: event.payload },
  });
});

it('keeps an event after a failed send and removes it after a successful retry', async () => {
  jest.useFakeTimers();
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  const send = jest
    .fn()
    .mockRejectedValueOnce(new Error('Kafka unavailable'))
    .mockResolvedValue([]);
  const broker = {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    send,
  };
  jest
    .spyOn(Kafka.prototype, 'producer')
    .mockReturnValue(broker as unknown as Producer);
  const remove = jest.fn().mockResolvedValue({ count: 1 });
  const prisma = {
    $queryRaw: jest
      .fn()
      .mockResolvedValueOnce([event])
      .mockResolvedValueOnce([event])
      .mockResolvedValue([]),
    hrEventOutbox: { deleteMany: remove },
  } as unknown as PrismaService;
  const service = new KafkaProducerService(prisma);
  service.onModuleInit();
  try {
    await jest.advanceTimersByTimeAsync(2_000);
    expect(remove).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(2_000);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenLastCalledWith({
      topic: event.topic,
      messages: [
        {
          value: JSON.stringify(event.payload),
          headers: { 'hr-event-id': event.id },
        },
      ],
    });
    expect(remove).toHaveBeenCalledWith({ where: { id: event.id } });
  } finally {
    await service.onModuleDestroy();
  }
});
