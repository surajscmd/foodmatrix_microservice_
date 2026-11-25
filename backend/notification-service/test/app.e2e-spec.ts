import { HealthController } from '../src/health.controller';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { NotificationDeliveryService } from '../src/kafka/handlers/notification-delivery.service';
import { PrismaModule } from '../src/lib/prisma/prisma.module';
import { PrismaService } from '../src/lib/prisma/prisma.service';
import { NotificationModule } from '../src/modules/notification/notification.module';
import { NotificationGateway } from '../src/socket/notification.gateway';
import { SocketModule } from '../src/socket/socket.module';
import type { Socket } from 'socket.io';

describe('Notification workflows', () => {
  let app: INestApplication<App>;
  let db: PrismaService;
  let delivery: NotificationDeliveryService;
  let gateway: NotificationGateway;

  const restaurantId = randomUUID();
  const warehouseId = randomUUID();
  const otherWarehouseId = randomUUID();
  const actors = {
    restaurant: {
      role: 'STAFF',
      managedRestaurantId: restaurantId,
      restaurantIds: [restaurantId],
      warehouseIds: [warehouseId],
    },
    warehouse: {
      role: 'FRANCHISE_ADMIN',
      managedRestaurantId: null,
      restaurantIds: [restaurantId],
      warehouseIds: [warehouseId],
    },
    other: {
      role: 'FRANCHISE_ADMIN',
      managedRestaurantId: null,
      restaurantIds: [],
      warehouseIds: [otherWarehouseId],
    },
  };
  const to = (role: keyof typeof actors) => ({
    Authorization: 'Bearer ' + role,
  });

  beforeAll(async () => {
    if (
      !new URL(process.env.DATABASE_URL ?? '').pathname.startsWith(
        '/fmx_notification_e2e_',
      )
    ) {
      throw new Error('Run Notification tests with npm run test:e2e.');
    }
    jest.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      const headers = new Headers(init?.headers);
      if (typeof url !== 'string') throw new Error('Expected upstream URL');
      if (url.endsWith('/api/auth/token')) {
        return Response.json({ token: headers.get('Cookie') });
      }
      const token = headers.get('Authorization')?.slice(7) ?? '';
      const actor = actors[token as keyof typeof actors];
      await Promise.resolve();
      return actor ? Response.json(actor) : new Response(null, { status: 401 });
    });

    const module = await Test.createTestingModule({
      imports: [PrismaModule, NotificationModule, SocketModule],
      controllers: [AppController, HealthController],
      providers: [AppService, NotificationDeliveryService],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    db = module.get(PrismaService);
    gateway = module.get(NotificationGateway);
    delivery = module.get(NotificationDeliveryService);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app?.close();
  });

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

  it('authorizes listings, individual reads, and read updates by audience', async () => {
    const api = request(app.getHttpServer());
    const [restaurant, warehouse] = await db.notification.createManyAndReturn({
      data: [
        {
          restaurantId,
          warehouseId,
          scope: 'RESTAURANT',
          type: 'SYSTEM',
          title: 'Restaurant alert',
          message: 'Example',
        },
        {
          restaurantId,
          warehouseId,
          scope: 'WAREHOUSE',
          type: 'SYSTEM',
          title: 'Warehouse alert',
          message: 'Example',
        },
      ],
    });
    await api.get('/').expect(200);
    await api.get('/notifications/warehouse/' + warehouseId).expect(401);
    await api
      .get('/notifications/warehouse/' + warehouseId)
      .set(to('other'))
      .expect(403);
    await api
      .get('/notifications/warehouse/' + warehouseId)
      .set(to('warehouse'))
      .expect(200);
    await api
      .get('/notifications/restaurant/' + restaurantId)
      .set(to('warehouse'))
      .expect(403);
    await api
      .get('/notifications/restaurant/' + restaurantId.toUpperCase())
      .set(to('restaurant'))
      .expect(200);
    await api
      .get('/notifications/' + warehouse.id)
      .set(to('restaurant'))
      .expect(404);
    await api
      .patch('/notifications/' + restaurant.id + '/read')
      .set(to('warehouse'))
      .expect(404);
    await api
      .patch('/notifications/' + restaurant.id + '/read')
      .set(to('restaurant'))
      .expect(200);
    await api
      .patch('/notifications/warehouse/' + warehouseId + '/read-all')
      .set(to('other'))
      .expect(403);
    await api
      .patch('/notifications/warehouse/' + warehouseId + '/read-all')
      .set(to('warehouse'))
      .expect(200);
    expect(
      await db.notification.count({
        where: { id: { in: [restaurant.id, warehouse.id] }, isRead: true },
      }),
    ).toBe(2);
  });

  it('admits only the authorized live notification room for a browser session', async () => {
    function browser(cookie?: string) {
      const join = jest.fn();
      return {
        join,
        socket: {
          handshake: { headers: { cookie } },
          connected: true,
          join,
        } as unknown as Socket,
      };
    }

    const unsigned = browser();
    await expect(
      gateway.joinWarehouse(unsigned.socket, { warehouseId }),
    ).resolves.toEqual({ joined: false });
    expect(unsigned.join).not.toHaveBeenCalled();

    const staff = browser('restaurant');
    await expect(
      gateway.joinWarehouse(staff.socket, { warehouseId }),
    ).resolves.toEqual({ joined: false });
    await expect(
      gateway.joinRestaurant(staff.socket, { restaurantId }),
    ).resolves.toEqual({ joined: true });
    expect(staff.join).toHaveBeenCalledTimes(1);
    expect(staff.join).toHaveBeenCalledWith('restaurant:' + restaurantId);

    const manager = browser('warehouse');
    await expect(
      gateway.joinWarehouse(manager.socket, { warehouseId: otherWarehouseId }),
    ).resolves.toEqual({ joined: false });
    await expect(
      gateway.joinWarehouse(manager.socket, { warehouseId }),
    ).resolves.toEqual({ joined: true });
    expect(manager.join).toHaveBeenCalledTimes(1);
    expect(manager.join).toHaveBeenCalledWith('warehouse:' + warehouseId);
  });

  it('stores and emits only one notification per audience on event redelivery', async () => {
    const restaurantEmission = jest.spyOn(gateway, 'emitToRestaurant');
    const warehouseEmission = jest.spyOn(gateway, 'emitToWarehouse');
    const referenceId = randomUUID();
    await Promise.all(
      [1, 2].map(() =>
        delivery.sendOnce(referenceId, [
          {
            scope: 'RESTAURANT',
            type: 'STOCK_SHIPPED',
            restaurantId,
            warehouseId,
            title: 'Shipment',
            message: 'Sent',
            referenceId,
          },
          {
            scope: 'WAREHOUSE',
            type: 'STOCK_SHIPPED',
            restaurantId,
            warehouseId,
            title: 'Shipment',
            message: 'Sent',
            referenceId,
          },
        ]),
      ),
    );
    expect(await db.notification.count({ where: { referenceId } })).toBe(2);
    expect(restaurantEmission).toHaveBeenCalledTimes(1);
    expect(warehouseEmission).toHaveBeenCalledTimes(1);
  });

  it('recovers notifications committed while the emission worker was stopped', async () => {
    await delivery.onModuleDestroy();
    const emitted = jest.spyOn(gateway, 'emitToRestaurant').mockClear();
    const referenceId = randomUUID();
    const input = {
      scope: 'RESTAURANT' as const,
      type: 'SYSTEM' as const,
      restaurantId,
      title: 'Durable alert',
      message: 'Created before worker restart',
      referenceId,
    };
    await delivery.sendOnce(referenceId, [input]);
    const saved = await db.notification.findFirstOrThrow({
      where: { referenceId },
    });
    expect(
      await db.notificationSocketOutbox.count({
        where: { notificationId: saved.id },
      }),
    ).toBe(1);
    expect(emitted).not.toHaveBeenCalled();

    const restarted = new NotificationDeliveryService(db, gateway);
    await restarted.flushPending();
    expect(emitted).toHaveBeenCalledTimes(1);
    expect(emitted).toHaveBeenCalledWith(
      restaurantId,
      expect.objectContaining({ id: saved.id }),
    );
    expect(
      await db.notificationSocketOutbox.count({
        where: { notificationId: saved.id },
      }),
    ).toBe(0);

    await delivery.sendOnce(referenceId, [input]);
    expect(await db.notification.count({ where: { referenceId } })).toBe(1);
    expect(
      await db.notificationSocketOutbox.count({
        where: { notificationId: saved.id },
      }),
    ).toBe(0);
    emitted.mockRestore();
  });

  it('retains a failed emission until the lease expires and another worker retries it', async () => {
    const emitted = jest
      .spyOn(gateway, 'emitToRestaurant')
      .mockImplementationOnce(() => {
        throw new Error('Simulated socket failure');
      });
    const referenceId = randomUUID();
    const worker = new NotificationDeliveryService(db, gateway);
    await worker.sendOnce(referenceId, [
      {
        scope: 'RESTAURANT',
        type: 'SYSTEM',
        restaurantId,
        title: 'Retry alert',
        message: 'Retry after a failed emission',
        referenceId,
      },
    ]);
    const saved = await db.notification.findFirstOrThrow({
      where: { referenceId },
    });
    expect(
      await db.notificationSocketOutbox.count({
        where: { notificationId: saved.id },
      }),
    ).toBe(1);
    expect(emitted).toHaveBeenCalledTimes(1);
    await worker.flushPending();
    expect(emitted).toHaveBeenCalledTimes(1);

    await db.notificationSocketOutbox.update({
      where: { notificationId: saved.id },
      data: { availableAt: new Date(0) },
    });
    const restarted = new NotificationDeliveryService(db, gateway);
    await restarted.flushPending();
    expect(emitted).toHaveBeenCalledTimes(2);
    expect(
      await db.notificationSocketOutbox.count({
        where: { notificationId: saved.id },
      }),
    ).toBe(0);
    expect(await db.notification.count({ where: { referenceId } })).toBe(1);
    emitted.mockRestore();
  });

  it('lets only one of two workers claim the same pending emission', async () => {
    const emitted = jest.spyOn(gateway, 'emitToRestaurant');
    const referenceId = randomUUID();
    await delivery.sendOnce(referenceId, [
      {
        scope: 'RESTAURANT',
        type: 'SYSTEM',
        restaurantId,
        title: 'Concurrent workers',
        message: 'Claim once',
        referenceId,
      },
    ]);
    const first = new NotificationDeliveryService(db, gateway);
    const second = new NotificationDeliveryService(db, gateway);
    await Promise.all([first.flushPending(), second.flushPending()]);
    expect(emitted).toHaveBeenCalledTimes(1);
    expect(await db.notificationSocketOutbox.count()).toBe(0);
    emitted.mockRestore();
  });
});
