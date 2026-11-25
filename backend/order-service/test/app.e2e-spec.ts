import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { OrderStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types';
import type { OrderActor } from '../src/auth/order-access';
import { AppModule } from '../src/app.module';
import { KafkaService } from '../src/kafka/kafka.service';
import { OrderInventoryOutbox } from '../src/kafka/order-inventory-outbox.service';
import { PrismaService } from '../src/lib/prisma/prisma.service';
import { CatalogGatewayService } from '../src/utils/catalog-gateway.service';

describe('Order workflows (e2e)', () => {
  let app: INestApplication<App>;
  let db: PrismaService;
  let outbox: OrderInventoryOutbox;
  let price: number;
  const publish = jest.fn<Promise<void>, [string, unknown, string]>();
  const menuItemId = randomUUID();
  const modifierGroupId = randomUUID();
  const allowedModifierId = randomUUID();
  const unrelatedModifierId = randomUUID();
  const actors = new Map<string, OrderActor>();

  function authorize(
    restaurantId: string,
    role: OrderActor['role'] = 'RESTAURANT_ADMIN',
  ) {
    const token = randomUUID();
    actors.set(token, {
      role,
      managedRestaurantId: restaurantId,
      restaurants: [{ id: restaurantId }],
    });
    return { Authorization: 'Bearer ' + token };
  }

  beforeAll(async () => {
    if (
      !new URL(process.env.DATABASE_URL ?? '').pathname.startsWith(
        '/fmx_order_e2e_',
      )
    ) {
      throw new Error('Run these tests with npm run test:e2e.');
    }

    jest.spyOn(global, 'fetch').mockImplementation(async (url, init) => {
      if (!(url instanceof URL)) throw new Error('Expected a URL');
      expect(url.pathname).toMatch(/\/order-access$/);
      const token = new Headers(init?.headers).get('Authorization')?.slice(7);
      if (token === 'unavailable') throw new Error('Organization unavailable');
      if (token === 'invalid-payload') return Response.json({});
      const actor = token && actors.get(token);
      await Promise.resolve();
      return actor ? Response.json(actor) : new Response(null, { status: 401 });
    });

    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue({ publish })
      .overrideProvider(CatalogGatewayService)
      .useValue({
        getBulkPricing: () => ({
          menuItems: [
            {
              menuItemId,
              name: 'Dal',
              sku: 'DAL',
              price,
              isAvailable: true,
              modifierGroupIds: [modifierGroupId],
            },
          ],
          modifiers: [
            {
              id: allowedModifierId,
              name: 'Extra chutney',
              extraPrice: 2,
              isActive: true,
              groupId: modifierGroupId,
            },
            {
              id: unrelatedModifierId,
              name: 'Ice',
              extraPrice: 1,
              isActive: true,
              groupId: randomUUID(),
            },
          ],
        }),
      })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    db = module.get(PrismaService);
    outbox = module.get(OrderInventoryOutbox);
    jest.spyOn(outbox, 'onModuleInit').mockImplementation(() => undefined);
    await app.init();
  });

  beforeEach(() => {
    price = 10;
    publish.mockReset().mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await app?.close();
    jest.restoreAllMocks();
  });

  function tableOrder() {
    return {
      restaurantId: randomUUID(),
      phone: '5551234567',
      type: 'DINE_IN',
      tableId: 'Table 4',
      items: [{ menuItemId, quantity: 1 }],
    };
  }

  function createOrder(dto: ReturnType<typeof tableOrder>, key = randomUUID()) {
    return request(app.getHttpServer())
      .post('/orders')
      .set(authorize(dto.restaurantId))
      .set('Idempotency-Key', key)
      .send(dto);
  }

  it('exposes anonymous liveness and database readiness probes', async () => {
    await request(app.getHttpServer())
      .get('/health/live')
      .expect(200)
      .expect({ status: 'ok' });
    await request(app.getHttpServer())
      .get('/health/ready')
      .expect(200)
      .expect({ status: 'ready' });
  });

  it('creates an open table order and applies a second request once despite a retry', async () => {
    const dto = tableOrder();
    await createOrder(dto).expect(201);
    const key = randomUUID();
    const additional = { ...dto, tableId: ' table 4 ' };

    await Promise.all([
      createOrder(additional, key).expect(201),
      createOrder(additional, key).expect(201),
    ]);
    await createOrder(
      { ...additional, items: [{ menuItemId, quantity: 2 }] },
      key,
    ).expect(409);

    const orders = await db.order.findMany({
      where: { restaurantId: dto.restaurantId },
      include: { items: true },
    });

    expect(orders).toHaveLength(1);
    expect(orders[0].items).toHaveLength(1);
    expect(orders[0].items[0].quantity).toBe(2);
    expect(orders[0].total.toNumber()).toBe(20);
  });

  it('preserves each price when the menu price changes on an open table', async () => {
    const dto = tableOrder();
    await createOrder(dto).expect(201);

    price = 15;
    await createOrder(dto).expect(201);
    const order = await db.order.findFirstOrThrow({
      where: { restaurantId: dto.restaurantId },
      include: { items: { orderBy: { price: 'asc' } } },
    });

    expect(order.items.map((item) => item.total.toNumber())).toEqual([10, 15]);
    expect(order.subtotal.toNumber()).toBe(25);
  });

  it('deduplicates payment retries and blocks new table items after a partial payment', async () => {
    const dto = tableOrder();
    await createOrder(dto).expect(201);

    const order = await db.order.findFirstOrThrow({
      where: { restaurantId: dto.restaurantId },
    });
    const transactionId = randomUUID();
    const payment = {
      orderId: order.id,
      amount: 5,
      method: 'CARD',
      transactionId,
    };

    await Promise.all(
      [payment, payment].map((input) =>
        request(app.getHttpServer())
          .post('/payments')
          .set(authorize(dto.restaurantId))
          .send(input)
          .expect(201),
      ),
    );
    await request(app.getHttpServer())
      .post('/payments')
      .set(authorize(dto.restaurantId))
      .send({ ...payment, amount: 4 })
      .expect(409);
    await createOrder(dto).expect(409);

    expect(await db.payment.count({ where: { orderId: order.id } })).toBe(1);
  });

  it('retains the inventory event after publish failure and delivers it on retry', async () => {
    const dto = tableOrder();
    await createOrder(dto).expect(201);
    const order = await db.order.findFirstOrThrow({
      where: { restaurantId: dto.restaurantId },
      include: { items: true },
    });
    const item = order.items[0];
    await db.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PREPARING },
    });

    const route =
      '/orders/' + order.id + '/kitchen/items/' + item.id + '/status';
    await request(app.getHttpServer())
      .patch(route)
      .set(authorize(dto.restaurantId, 'STAFF'))
      .send({ status: 'PREPARING' })
      .expect(200);
    publish.mockRejectedValueOnce(new Error('Kafka unavailable'));
    await request(app.getHttpServer())
      .patch(route)
      .set(authorize(dto.restaurantId, 'STAFF'))
      .send({ status: 'READY' })
      .expect(200);

    await expect(outbox.publishPending()).rejects.toThrow('Kafka unavailable');
    expect(
      await db.orderInventoryEvent.count({ where: { orderItemId: item.id } }),
    ).toBe(1);

    await outbox.publishPending();
    expect(publish).toHaveBeenCalledTimes(2);
    expect(publish).toHaveBeenLastCalledWith(
      'order-complete',
      {
        orderItemId: item.id,
        menuItemId,
        quantity: 1,
        modifiers: [],
        restaurantId: dto.restaurantId,
      },
      item.id,
    );
    expect(
      await db.orderInventoryEvent.count({ where: { orderItemId: item.id } }),
    ).toBe(0);
  });

  it('requires a valid session and fails closed when Organization is unavailable', async () => {
    const api = request(app.getHttpServer());
    await api.get('/').expect(200);
    await api.get('/orders').expect(401);
    await api.get('/orders').set('Authorization', 'Bearer revoked').expect(401);
    await api
      .get('/orders')
      .set('Authorization', 'Bearer unavailable')
      .expect(503);
    await api
      .get('/orders')
      .set('Authorization', 'Bearer invalid-payload')
      .expect(503);
    await api.get('/customers').expect(401);
    await api.post('/payments').expect(401);
    await api
      .get('/orders/dashboard')
      .set('x-dashboard-key', 'old-key')
      .expect(401);
  });

  it('enforces assigned restaurant scope on orders and payment records', async () => {
    const dto = tableOrder();
    const api = request(app.getHttpServer());
    const staff = authorize(dto.restaurantId, 'STAFF');
    const other = authorize(randomUUID());

    const { restaurantId, ...cart } = dto;
    await api
      .post('/orders')
      .set(staff)
      .set('Idempotency-Key', randomUUID())
      .send(cart)
      .expect(201);
    await api
      .post('/orders')
      .set(other)
      .set('Idempotency-Key', randomUUID())
      .send(dto)
      .expect(403);

    const order = await db.order.findFirstOrThrow({ where: { restaurantId } });
    const orderPath = '/orders/' + order.id;
    await api.get('/orders').set(staff).expect(200);
    await api.get('/orders/kitchen/upcoming').set(staff).expect(200);
    await api.get('/orders').set(other).query({ restaurantId }).expect(403);
    await api.get(orderPath).set(staff).expect(200);
    await api.get(orderPath).set(other).expect(404);
    await api
      .post(orderPath + '/confirm')
      .set(other)
      .expect(404);

    const input = { orderId: order.id, amount: 5, method: 'CASH' };
    await api.post('/payments').set(other).send(input).expect(404);
    await api.post('/payments').set(staff).send(input).expect(201);
    const payment = await db.payment.findFirstOrThrow({
      where: { orderId: order.id },
    });

    const paymentPath = '/payments/' + payment.id;
    await api.get(paymentPath).set(staff).expect(200);
    await api.get(paymentPath).set(other).expect(404);
    await api
      .get('/payments/order/' + order.id + '/summary')
      .set(other)
      .expect(404);
    await api
      .post(paymentPath + '/refund')
      .set(staff)
      .expect(403);
    await api
      .post(paymentPath + '/refund')
      .set(other)
      .expect(404);
    await api
      .post(paymentPath + '/refund')
      .set(authorize(restaurantId))
      .expect(201);
  });

  it('limits dashboards to managers with restaurant scope and customer records to super admins', async () => {
    const { restaurantId } = tableOrder();
    const api = request(app.getHttpServer());
    const franchise = authorize(restaurantId, 'FRANCHISE_ADMIN');
    const superAdmin = authorize(restaurantId, 'SUPER_ADMIN');

    await api.get('/orders/dashboard').set(authorize(restaurantId)).expect(200);
    await api
      .get('/orders/dashboard')
      .set(authorize(restaurantId, 'STAFF'))
      .expect(403);
    await api
      .get('/orders/dashboard')
      .set(franchise)
      .query({ restaurantId })
      .expect(200);
    await api
      .get('/orders/dashboard')
      .set(franchise)
      .query({ restaurantId: randomUUID() })
      .expect(403);
    await api
      .get('/orders/dashboard')
      .set(superAdmin)
      .query({ restaurantId })
      .expect(200);
    await api.get('/orders').set(franchise).query({ restaurantId }).expect(403);
    await api.get('/customers').set(franchise).expect(403);
    await api.get('/customers').set(superAdmin).expect(200);
  });

  it('accepts a dish with its own modifiers or no modifiers and rejects modifiers from other groups', async () => {
    const dto = tableOrder();
    const withModifier = (modifierId: string) => ({
      ...dto,
      items: [
        { menuItemId, quantity: 1, modifiers: [{ modifierId, quantity: 1 }] },
      ],
    });

    await createOrder(withModifier(unrelatedModifierId)).expect(400);
    await createOrder(withModifier(allowedModifierId)).expect(201);
    await createOrder(dto).expect(201);

    const order = await db.order.findFirstOrThrow({
      where: { restaurantId: dto.restaurantId },
      include: { items: { include: { modifiers: true } } },
    });
    expect(order.total.toNumber()).toBe(22);
    expect(
      order.items.flatMap(({ modifiers }) =>
        modifiers.map(({ modifierId }) => modifierId),
      ),
    ).toEqual([allowedModifierId]);

    await request(app.getHttpServer())
      .post('/orders/' + order.id + '/items')
      .set(authorize(dto.restaurantId))
      .send({ items: withModifier(unrelatedModifierId).items })
      .expect(400);
  });

  it('rolls back invalid preparation and completes the normal kitchen and split-payment flow', async () => {
    const dto = tableOrder();
    await createOrder(dto).expect(201);
    const api = request(app.getHttpServer());
    const staff = authorize(dto.restaurantId, 'STAFF');
    const order = await db.order.findFirstOrThrow({
      where: { restaurantId: dto.restaurantId },
      include: { items: true },
    });
    const path = '/orders/' + order.id;
    const itemId = order.items[0].id;

    await api
      .post(path + '/prepare')
      .set(staff)
      .expect(400);
    expect(
      (await db.orderItem.findUniqueOrThrow({ where: { id: itemId } })).status,
    ).toBe('PENDING');
    await api
      .post(path + '/confirm')
      .set(staff)
      .expect(201);
    await api
      .post(path + '/prepare')
      .set(staff)
      .expect(201);
    expect(
      (await db.orderItem.findUniqueOrThrow({ where: { id: itemId } })).status,
    ).toBe('PREPARING');
    await api
      .post(path + '/ready')
      .set(staff)
      .expect(400);
    await api
      .patch(path + '/kitchen/items/' + itemId + '/status')
      .set(staff)
      .send({ status: 'READY' })
      .expect(200);
    await api
      .post(path + '/ready')
      .set(staff)
      .expect(201);
    await api
      .post(path + '/complete')
      .set(staff)
      .expect(400);

    for (const [amount, method] of [
      [4, 'CARD'],
      [6, 'CASH'],
    ] as const) {
      await api
        .post('/payments')
        .set(staff)
        .send({
          orderId: order.id,
          amount,
          method,
          transactionId: randomUUID(),
        })
        .expect(201);
    }
    await api
      .post(path + '/complete')
      .set(staff)
      .expect(201);
    expect(
      (await db.order.findUniqueOrThrow({ where: { id: order.id } })).status,
    ).toBe('COMPLETED');
    await outbox.publishPending();
  });

  it('allows manager cancellation before an item is ready and requires payment refunds first', async () => {
    const dto = tableOrder();
    await createOrder(dto).expect(201);
    const api = request(app.getHttpServer());
    const staff = authorize(dto.restaurantId, 'STAFF');
    const manager = authorize(dto.restaurantId);
    const order = await db.order.findFirstOrThrow({
      where: { restaurantId: dto.restaurantId },
    });
    const path = '/orders/' + order.id;
    const reason = { reason: 'Guest requested cancellation' };
    await api
      .post(path + '/confirm')
      .set(staff)
      .expect(201);
    await api
      .post(path + '/prepare')
      .set(staff)
      .expect(201);
    await api
      .post(path + '/cancel')
      .set(staff)
      .send(reason)
      .expect(403);
    await api
      .post('/payments')
      .set(staff)
      .send({ orderId: order.id, amount: 5, method: 'CASH' })
      .expect(201);
    await api
      .post(path + '/cancel')
      .set(manager)
      .send(reason)
      .expect(409);
    await api
      .post('/payments/order/' + order.id + '/refund')
      .set(manager)
      .expect(201);
    await api
      .post(path + '/cancel')
      .set(manager)
      .send(reason)
      .expect(201);

    const cancelled = await db.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { items: true },
    });
    expect(cancelled.status).toBe('CANCELLED');
    expect(cancelled.items.map(({ status }) => status)).toEqual(['CANCELLED']);
  });

  it('blocks full cancellation once a dish is ready even while other dishes are preparing', async () => {
    const dto = tableOrder();
    await createOrder({ ...dto, items: [...dto.items, ...dto.items] }).expect(
      201,
    );
    const api = request(app.getHttpServer());
    const manager = authorize(dto.restaurantId);
    const order = await db.order.findFirstOrThrow({
      where: { restaurantId: dto.restaurantId },
      include: { items: true },
    });
    const path = '/orders/' + order.id;
    await api
      .post(path + '/confirm')
      .set(manager)
      .expect(201);
    await api
      .post(path + '/prepare')
      .set(manager)
      .expect(201);
    await api
      .patch(path + '/kitchen/items/' + order.items[0].id + '/status')
      .set(manager)
      .send({ status: 'READY' })
      .expect(200);
    await api
      .post(path + '/cancel')
      .set(manager)
      .send({ reason: 'Guest asked to cancel' })
      .expect(409);
    expect(
      (await db.order.findUniqueOrThrow({ where: { id: order.id } })).status,
    ).toBe('PREPARING');
    await outbox.publishPending();
  });
});
