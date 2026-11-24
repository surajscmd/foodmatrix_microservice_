import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import type { InventoryActor } from '../src/auth/inventory-access.js';
import { InventoryOutboxService } from '../src/kafka/inventory-outbox.service.js';
import { KafkaConsumerService } from '../src/kafka/kafka-consumer.service.js';
import { KafkaProducerService } from '../src/kafka/kafka-producer.service.js';
import { PrismaService } from '../src/lib/prisma/prisma.service.js';
import { OrderDeductionRetryService } from '../src/modules/order-inventory/order-deduction-retry.service.js';
import { InventorySchedulerService } from '../src/modules/schedule/schedule.service.js';
import { CatalogGatewayService } from '../src/utils/caltalog-gateway.service.js';

describe('Inventory workflows', () => {
  let app: INestApplication<Parameters<typeof request>[0]>;
  let db: PrismaService;
  let outbox: InventoryOutboxService;
  let deductions: OrderDeductionRetryService;
  let scheduler: InventorySchedulerService;
  const restaurantId = randomUUID();
  const warehouseId = randomUUID();
  const otherWarehouseId = randomUUID();
  const otherRestaurantId = randomUUID();
  const ingredientId = randomUUID();
  const menuItemId = randomUUID();
  const modifierId = randomUUID();
  const actors = {
    manager: {
      userId: randomUUID(),
      role: 'RESTAURANT_ADMIN',
      franchiseId: warehouseId,
      managedRestaurantId: restaurantId,
      restaurantIds: [restaurantId],
      warehouseIds: [warehouseId],
    },
    staff: {
      userId: randomUUID(),
      role: 'STAFF',
      franchiseId: warehouseId,
      managedRestaurantId: restaurantId,
      restaurantIds: [restaurantId],
      warehouseIds: [warehouseId],
    },
    warehouse: {
      userId: randomUUID(),
      role: 'FRANCHISE_ADMIN',
      franchiseId: warehouseId,
      managedRestaurantId: null,
      restaurantIds: [restaurantId],
      warehouseIds: [warehouseId],
    },
    other: {
      userId: randomUUID(),
      role: 'FRANCHISE_ADMIN',
      franchiseId: otherWarehouseId,
      managedRestaurantId: null,
      restaurantIds: [otherRestaurantId],
      warehouseIds: [otherWarehouseId],
    },
  } satisfies Record<string, InventoryActor>;
  const publish =
    jest.fn<(topic: string, payload: unknown, key?: string) => Promise<void>>();

  beforeAll(async () => {
    if (
      !new URL(process.env.DATABASE_URL ?? '').pathname.startsWith(
        '/fmx_inventory_e2e_',
      )
    ) {
      throw new Error('Run the Inventory tests with npm run test:e2e.');
    }
    jest.spyOn(globalThis, 'fetch').mockImplementation((url, init) => {
      if (!(url instanceof URL) || !url.pathname.endsWith('/inventory-access'))
        throw new Error('Unexpected upstream request');
      const token = new Headers(init?.headers).get('Authorization')?.slice(7);
      if (token === 'offline')
        return Promise.reject(new Error('Organization unavailable'));
      const actor = token && actors[token as keyof typeof actors];
      return Promise.resolve(
        actor ? Response.json(actor) : new Response(null, { status: 401 }),
      );
    });

    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaConsumerService)
      .useValue({})
      .overrideProvider(KafkaProducerService)
      .useValue({ publish })
      .overrideProvider(CatalogGatewayService)
      .useValue({
        getBulkIngredients: () => [
          { id: ingredientId, name: 'Lentils', uom: 'kg', isActive: true },
        ],
        getBulkRecipes: () => ({
          menuItems: [
            { menuItemId, ingredients: [{ ingredientId, quantityNeeded: 2 }] },
          ],
          modifiers: [
            { modifierId, ingredients: [{ ingredientId, quantityNeeded: 1 }] },
          ],
        }),
      })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    db = module.get(PrismaService);
    outbox = module.get(InventoryOutboxService);
    deductions = module.get(OrderDeductionRetryService);
    scheduler = module.get(InventorySchedulerService);
    // Run workers explicitly so timing and Kafka failure are deterministic.
    jest.spyOn(outbox, 'publishPending');
    jest.spyOn(deductions, 'retryPending');
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    jest.restoreAllMocks();
  });

  function api() {
    return request(app.getHttpServer());
  }
  function bearer(actor: keyof typeof actors) {
    return 'Bearer ' + actor;
  }

  it('checks bearer sessions and location scope even on direct service calls', async () => {
    await api().get('/').expect(200);
    await api()
      .get('/restaurant-stock/' + restaurantId)
      .expect(401);
    await api()
      .get('/restaurant-stock/' + restaurantId)
      .set('Authorization', 'Bearer expired')
      .expect(401);
    await api()
      .get('/restaurant-stock/' + restaurantId)
      .set('Authorization', 'Bearer offline')
      .expect(503);
    await api()
      .get('/restaurant-stock/' + restaurantId)
      .set('Authorization', bearer('staff'))
      .expect(200);
    await api()
      .get('/restaurant-stock/' + otherRestaurantId)
      .set('Authorization', bearer('staff'))
      .expect(403);
    await api()
      .get('/warehouse-stock/warehouse/' + warehouseId)
      .set('Authorization', bearer('manager'))
      .expect(403);
    await api()
      .get('/stock-movements')
      .set('Authorization', bearer('warehouse'))
      .expect(403);
  });

  it('completes a stock request, records the real actors, and delivers saved events after Kafka recovers', async () => {
    publish.mockRejectedValue(new Error('Kafka offline'));
    const post = (
      path: string,
      actor: keyof typeof actors,
      body: object = {},
    ) => api().post(path).set('Authorization', bearer(actor)).send(body);

    await post('/warehouse-stock/receive', 'warehouse', {
      warehouseId,
      ingredientId,
      quantity: 10,
    }).expect(201);
    const draft = {
      warehouseId: otherWarehouseId,
      restaurantId,
      items: [{ ingredientId, requestedQty: 6 }],
    };
    await post('/stock-requests', 'staff', draft).expect(403);
    const created = await post('/stock-requests', 'manager', draft).expect(201);
    const stockRequest = (
      created.body as {
        data: { id: string; warehouseId: string; requestedBy: string };
      }
    ).data;
    expect(stockRequest.warehouseId).toBe(warehouseId);
    expect(stockRequest.requestedBy).toBe(actors.manager.userId);

    const requestPath = '/stock-requests/' + stockRequest.id;
    const approval = { items: [{ ingredientId, approvedQty: 6 }] };
    await post(requestPath + '/approve', 'other', approval).expect(404);
    const approved = await post(
      requestPath + '/approve',
      'warehouse',
      approval,
    ).expect(201);
    await post(requestPath + '/approve', 'warehouse', approval).expect(409);
    const transfer = (
      approved.body as { data: { id: string; items: { id: string }[] } }
    ).data;
    const transferPath = '/stock-transfers/' + transfer.id;
    const transferItemId = transfer.items[0].id;

    await post(transferPath + '/start-picking', 'manager').expect(404);
    await post(transferPath + '/start-picking', 'warehouse').expect(201);
    await post(transferPath + '/ready-to-ship', 'warehouse').expect(201);
    await post(transferPath + '/shipment', 'warehouse', {
      carrierName: 'Local carrier',
    }).expect(201);
    await post(transferPath + '/ship', 'warehouse', {
      items: [{ transferItemId, shippedQty: 6 }],
    }).expect(201);
    await post(transferPath + '/in-transit', 'warehouse').expect(201);
    const receipt = { items: [{ transferItemId, receivedQty: 6 }] };
    await post(transferPath + '/receive', 'warehouse', receipt).expect(404);
    await post(transferPath + '/receive', 'manager', receipt).expect(201);

    const saved = await db.stockTransfer.findUniqueOrThrow({
      where: { id: transfer.id },
    });
    expect(saved).toMatchObject({
      status: 'COMPLETED',
      shippedBy: actors.warehouse.userId,
      receivedBy: actors.manager.userId,
    });
    const restaurantStock = await db.restaurantStock.findUniqueOrThrow({
      where: { restaurantId_ingredientId: { restaurantId, ingredientId } },
    });
    expect(restaurantStock.quantityOnHand.toNumber()).toBe(6);

    await outbox.publishPending();
    expect(await db.inventoryOutbox.count()).toBe(4);
    publish.mockReset().mockResolvedValue(undefined);
    await outbox.publishPending();
    expect(publish.mock.calls.map(([topic]) => topic)).toEqual([
      'inventory.stock-request-created',
      'inventory.stock-request-approved',
      'inventory.stock-in-transit',
      'inventory.stock-received',
    ]);
    expect(await db.inventoryOutbox.count()).toBe(0);
  });

  it('retries a shortage after replenishment and applies menu items and modifiers once', async () => {
    publish.mockResolvedValue(undefined);
    const location = randomUUID();
    const event = {
      restaurantId: location,
      orderItemId: randomUUID(),
      menuItemId,
      quantity: 2,
      modifiers: [{ modifierId, quantity: 1 }],
    };
    const source = { topic: 'order-complete', partition: 0, offset: '15' };
    await deductions.processOrDefer(event, source);
    await deductions.processOrDefer(event, source);
    expect(await db.inventoryPendingDeduction.count()).toBe(1);
    expect(
      await db.inventoryOutbox.count({
        where: { topic: 'order-complete-stock-shortage' },
      }),
    ).toBe(1);

    await db.restaurantStock.create({
      data: { restaurantId: location, ingredientId, quantityOnHand: 10 },
    });
    await db.inventoryPendingDeduction.update({
      where: { orderItemId: event.orderItemId },
      data: { retryAt: new Date(0) },
    });
    await deductions.retryPending();
    await deductions.processOrDefer(event, source);

    expect(await db.inventoryPendingDeduction.count()).toBe(0);
    const movements = await db.stockMovement.findMany({
      where: { referenceId: event.orderItemId },
    });
    expect(
      movements.map((movement) => movement.quantityChange.toNumber()),
    ).toEqual([-6]);
  });

  it('persists low-stock alerts through a Kafka outage and delivers them after recovery', async () => {
    const location = randomUUID();
    await db.restaurantStock.create({
      data: {
        restaurantId: location,
        ingredientId,
        quantityOnHand: 1,
        reorderLevel: 5,
        reorderQuantity: 10,
      },
    });
    publish.mockReset().mockRejectedValue(new Error('Kafka unavailable'));
    await scheduler.checkLowStock();
    const queued = await db.inventoryOutbox.findMany({
      where: { topic: 'inventory.low-stock' },
    });
    const event = queued.find(
      (row) =>
        (row.payload as { restaurantId?: string }).restaurantId === location,
    );
    expect(event).toBeDefined();
    expect(publish).not.toHaveBeenCalled();
    await outbox.publishPending();
    expect(
      await db.inventoryOutbox.findUnique({ where: { id: event!.id } }),
    ).not.toBeNull();

    publish.mockReset().mockResolvedValue(undefined);
    await outbox.publishPending();
    expect(publish).toHaveBeenCalledWith(
      'inventory.low-stock',
      event!.payload,
      event!.id,
    );
    expect(
      await db.inventoryOutbox.findUnique({ where: { id: event!.id } }),
    ).toBeNull();
  });
});
