import { describe, expect, it, jest } from '@jest/globals';
import { InventorySchedulerService } from './schedule.service.js';
import type { PrismaService } from '../../lib/prisma/prisma.service.js';
import type { CatalogGatewayService } from '../../utils/caltalog-gateway.service.js';

describe('Low-stock alert durability', () => {
  it('queues every restaurant in one durable batch without contacting Kafka', async () => {
    const createMany = jest
      .fn<(args: unknown) => Promise<{ count: number }>>()
      .mockResolvedValue({ count: 2 });
    const prisma = {
      $queryRaw: jest.fn<() => Promise<unknown[]>>().mockResolvedValue([
        { id: 'stock-a', restaurantId: 'restaurant-a', ingredientId: 'rice' },
        { id: 'stock-b', restaurantId: 'restaurant-a', ingredientId: 'oil' },
        { id: 'stock-c', restaurantId: 'restaurant-b', ingredientId: 'rice' },
      ]),
      inventoryOutbox: { createMany },
    };
    const getBulkIngredients = jest
      .fn<(ids: string[]) => Promise<unknown[]>>()
      .mockResolvedValue([{ id: 'rice', name: 'Rice', uom: 'kg' }]);
    const service = new InventorySchedulerService(
      prisma as unknown as PrismaService,
      { getBulkIngredients } as unknown as CatalogGatewayService,
    );

    await service.checkLowStock();

    expect(getBulkIngredients).toHaveBeenCalledWith(['rice', 'oil']);
    expect(createMany).toHaveBeenCalledTimes(1);
    expect(createMany).toHaveBeenCalledWith({
      data: [
        {
          topic: 'inventory.low-stock',
          payload: {
            restaurantId: 'restaurant-a',
            items: [
              {
                stockId: 'stock-a',
                ingredientId: 'rice',
                ingredient: { id: 'rice', name: 'Rice', uom: 'kg' },
              },
              { stockId: 'stock-b', ingredientId: 'oil', ingredient: null },
            ],
          },
        },
        {
          topic: 'inventory.low-stock',
          payload: {
            restaurantId: 'restaurant-b',
            items: [
              {
                stockId: 'stock-c',
                ingredientId: 'rice',
                ingredient: { id: 'rice', name: 'Rice', uom: 'kg' },
              },
            ],
          },
        },
      ],
    });
  });

  it('does not enqueue an empty alert when no stock is low', async () => {
    const createMany = jest.fn();
    const getBulkIngredients = jest.fn();
    const service = new InventorySchedulerService(
      {
        $queryRaw: jest.fn<() => Promise<unknown[]>>().mockResolvedValue([]),
        inventoryOutbox: { createMany },
      } as unknown as PrismaService,
      { getBulkIngredients } as unknown as CatalogGatewayService,
    );
    await service.checkLowStock();
    expect(createMany).not.toHaveBeenCalled();
    expect(getBulkIngredients).not.toHaveBeenCalled();
  });
});
