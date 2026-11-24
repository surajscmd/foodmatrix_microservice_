import { describe, expect, it, jest } from '@jest/globals';
import { InventoryOutboxService } from './inventory-outbox.service.js';
import type { PrismaService } from '../lib/prisma/prisma.service.js';
import type { KafkaProducerService } from './kafka-producer.service.js';

describe('Inventory event retries', () => {
  it('retains failed low-stock deliveries and retries with the same event ID', async () => {
    const event = {
      id: 'durable-event',
      topic: 'inventory.low-stock',
      payload: { restaurantId: 'restaurant' },
    };
    const findMany = jest
      .fn<() => Promise<(typeof event)[]>>()
      .mockResolvedValue([event]);
    const deleteMany = jest
      .fn<(args: unknown) => Promise<{ count: number }>>()
      .mockResolvedValue({ count: 1 });
    const publish = jest
      .fn<(topic: string, payload: unknown, key?: string) => Promise<void>>()
      .mockRejectedValueOnce(new Error('Kafka unavailable'))
      .mockResolvedValueOnce(undefined);
    const worker = new InventoryOutboxService(
      { inventoryOutbox: { findMany, deleteMany } } as unknown as PrismaService,
      { publish } as unknown as KafkaProducerService,
    );
    await worker.publishPending();
    expect(deleteMany).not.toHaveBeenCalled();
    await worker.publishPending();
    expect(publish).toHaveBeenNthCalledWith(
      1,
      event.topic,
      event.payload,
      event.id,
    );
    expect(publish).toHaveBeenNthCalledWith(
      2,
      event.topic,
      event.payload,
      event.id,
    );
    expect(deleteMany).toHaveBeenCalledTimes(1);
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: event.id } });
  });
});
