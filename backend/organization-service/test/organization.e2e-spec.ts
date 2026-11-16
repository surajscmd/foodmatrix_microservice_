import { afterAll, beforeAll, expect, it, jest } from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { SystemUser } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureOrganizationApp } from '../src/configure-app.js';
import { PrismaService } from '../src/lib/prisma/prisma.service.js';

jest.setTimeout(20_000);

const origin = 'http://127.0.0.1';
const password = 'ServiceTestPassword#1';
type HttpServer = Parameters<typeof request>[0];
let app: INestApplication<HttpServer>;
let db: PrismaService;
let adminCookie: string;
let franchiseId: string;

function server() {
  return request(app.getHttpServer());
}

function cookieFrom(response: request.Response) {
  const values: unknown = response.headers['set-cookie'];
  if (!Array.isArray(values)) throw new Error('Response did not set a cookie');
  const cookies = values
    .filter(
      (value): value is string =>
        typeof value === 'string' && !/max-age=0(?:;|$)/i.test(value),
    )
    .map((value) => value.split(';', 1)[0]);
  if (!cookies.length) throw new Error('Response did not set an active cookie');
  return cookies.join('; ');
}

function signIn(email: string, value: string) {
  return server()
    .post('/api/auth/sign-in/email')
    .set('Origin', origin)
    .send({ email, password: value });
}

function me(cookie: string) {
  return server().get('/auth/me').set('Cookie', cookie);
}

async function createRestaurant(name: string, franchise = franchiseId) {
  const response = await server()
    .post('/restaurants')
    .set('Cookie', adminCookie)
    .send({
      franchiseId: franchise,
      name,
      address: '123 Main Road',
      city: 'Bengaluru',
      country: 'India',
    })
    .expect(201);
  return (response.body as { data: { id: string } }).data.id;
}

async function createAccount(
  email: string,
  role: SystemUser['role'],
  managedRestaurantId?: string,
) {
  const result = await server()
    .post('/auth/register')
    .set('Cookie', adminCookie)
    .send({
      name: 'Example Account',
      email,
      password,
      role,
      franchiseId,
      managedRestaurantId,
    })
    .expect(201);
  return (result.body as { data: { systemUser: SystemUser } }).data.systemUser;
}

async function tokenFor(cookie: string) {
  const response = await server()
    .get('/api/auth/token')
    .set('Cookie', cookie)
    .expect(200);
  return (response.body as { token: string }).token;
}

beforeAll(async () => {
  app = await NestFactory.create<INestApplication<HttpServer>>(AppModule, {
    bodyParser: false,
    logger: false,
    abortOnError: false,
  });
  configureOrganizationApp(app);
  await app.listen(0, '127.0.0.1');
  db = app.get(PrismaService);
  const admin = await signIn(
    process.env.BOOTSTRAP_ADMIN_EMAIL!,
    process.env.BOOTSTRAP_ADMIN_PASSWORD!,
  ).expect(200);
  adminCookie = cookieFrom(admin);
  const account = await me(adminCookie).expect(200);
  franchiseId = (account.body as { data: { systemUser: SystemUser } }).data
    .systemUser.franchiseId!;
});

afterAll(async () => {
  await app?.close();
});

it('boots and signs in the first super admin, recording the sign-in timestamp', async () => {
  const response = await me(adminCookie).expect(200);
  const { systemUser } = (response.body as { data: { systemUser: SystemUser } })
    .data;
  expect(systemUser.role).toBe('SUPER_ADMIN');
  expect(systemUser.franchiseId).toBe(franchiseId);
  expect(systemUser.lastLoginAt).toEqual(expect.any(String));
  await me('').expect(401);
});

it('validates null settings at the HTTP boundary', async () => {
  const location = await createRestaurant('Settings Store');
  await server()
    .patch('/restaurants/' + location)
    .set('Cookie', adminCookie)
    .send({ status: null, name: null })
    .expect(400);
  await server()
    .patch('/franchise')
    .set('Cookie', adminCookie)
    .send({ name: null })
    .expect(400);
});

it('rotates the password session and returns a cookie the browser can use', async () => {
  const location = await createRestaurant('Password Store');
  const account = await createAccount(
    'password@example.test',
    'STAFF',
    location,
  );
  const old = cookieFrom(await signIn(account.email, password).expect(200));
  const otherSession = cookieFrom(
    await signIn(account.email, password).expect(200),
  );
  const newPassword = 'ChangedServicePassword#2';
  const response = await server()
    .post('/auth/change-password')
    .set('Cookie', old)
    .set('Origin', origin)
    .send({ currentPassword: password, newPassword })
    .expect(200);
  const replacement = cookieFrom(response);
  expect(replacement).not.toBe(old);
  await me(replacement).expect(200);
  await me(old).expect(401);
  await me(otherSession).expect(401);
  await signIn(account.email, password).expect(401);
  await signIn(account.email, newPassword).expect(200);
});

it('deactivates a restaurant without deleting it and blocks existing and new access', async () => {
  const location = await createRestaurant('Paused Store');
  const account = await createAccount(
    'paused@example.test',
    'RESTAURANT_ADMIN',
    location,
  );
  const cookie = cookieFrom(await signIn(account.email, password).expect(200));
  const token = await tokenFor(cookie);
  const hrAccess = () =>
    server()
      .get('/hr-access')
      .set('Authorization', 'Bearer ' + token);
  const catalogAccess = () =>
    server()
      .get('/catalog-access')
      .set('Authorization', 'Bearer ' + token);
  const orderAccess = () =>
    server()
      .get('/order-access')
      .set('Authorization', 'Bearer ' + token);
  const inventoryAccess = () =>
    server()
      .get('/inventory-access')
      .set('Authorization', 'Bearer ' + token);
  const notificationAccess = () =>
    server()
      .get('/notification-access')
      .set('Authorization', 'Bearer ' + token);
  await server().get('/order-access').expect(401);
  await server().get('/inventory-access').expect(401);
  await server().get('/notification-access').expect(401);
  await notificationAccess().expect('Cache-Control', 'private, no-store').expect(200);
  await inventoryAccess()
    .expect('Cache-Control', 'private, no-store')
    .expect(200)
    .expect(({ body }: { body: unknown }) => {
      expect(body).toEqual({
        userId: account.id,
        role: 'RESTAURANT_ADMIN',
        franchiseId,
        managedRestaurantId: location,
        restaurantIds: [location],
        warehouseIds: [franchiseId],
      });
    });
  await orderAccess()
    .expect('Cache-Control', 'private, no-store')
    .expect(200)
    .expect(({ body }: { body: unknown }) => {
      expect(body).toEqual({
        role: 'RESTAURANT_ADMIN',
        managedRestaurantId: location,
        restaurants: [{ id: location }],
      });
    });
  await hrAccess().expect(200);
  await server().get('/catalog-access').expect(401);
  await server()
    .get('/catalog-access')
    .set('Authorization', 'Bearer invalid')
    .expect(401);
  await catalogAccess()
    .expect('Cache-Control', 'private, no-store')
    .expect(200)
    .expect(({ body }: { body: unknown }) => {
      expect(body).toEqual({
        id: account.authUserId,
        role: 'RESTAURANT_ADMIN',
        managedRestaurantId: location,
        restaurants: [{ id: location }],
      });
    });
  await server()
    .patch('/restaurants/' + location)
    .set('Cookie', cookie)
    .send({ status: 'INACTIVE' })
    .expect(403);
  await server()
    .delete('/restaurants/' + location)
    .set('Cookie', adminCookie)
    .expect(200);
  await server()
    .get('/restaurants/' + location)
    .set('Cookie', adminCookie)
    .expect(200)
    .expect(({ body }: { body: unknown }) => {
      expect(body).toMatchObject({
        data: { id: location, status: 'INACTIVE' },
      });
    });
  await me(cookie).expect(401);
  await hrAccess().expect(401);
  await catalogAccess().expect(401);
  await orderAccess().expect(401);
  await inventoryAccess().expect(401);
  await notificationAccess().expect(401);
  const inactive = await signIn(account.email, password);
  expect(inactive.status).toBeGreaterThanOrEqual(400);
  expect(inactive.status).toBeLessThan(500);
  await server()
    .patch('/restaurants/' + location)
    .set('Cookie', adminCookie)
    .send({ status: 'ACTIVE' })
    .expect(200);
  await me(cookie).expect(401);
  await hrAccess().expect(401);
  await catalogAccess().expect(401);
  await signIn(account.email, password).expect(200);
});

it('reassigns roles and locations within authorized scope and invalidates the old session', async () => {
  const first = await createRestaurant('First Store');
  const second = await createRestaurant('Second Store');
  const otherFranchise = await db.franchise.create({
    data: { name: 'Other Franchise' },
  });
  const outside = await createRestaurant('Outside Store', otherFranchise.id);
  const account = await createAccount('staff@example.test', 'STAFF', first);
  const manager = await createAccount(
    'manager@example.test',
    'FRANCHISE_ADMIN',
  );
  const old = cookieFrom(await signIn(account.email, password).expect(200));
  const oldToken = await tokenFor(old);
  const managerCookie = cookieFrom(
    await signIn(manager.email, password).expect(200),
  );
  const assignment = (cookie: string, id = account.id) =>
    server()
      .patch('/system-users/' + id + '/assignment')
      .set('Cookie', cookie);
  await assignment(managerCookie)
    .send({
      role: 'STAFF',
      franchiseId: otherFranchise.id,
      managedRestaurantId: outside,
    })
    .expect(403);
  await assignment(managerCookie)
    .send({
      role: 'SUPER_ADMIN',
      franchiseId,
    })
    .expect(403);
  await assignment(managerCookie, manager.id)
    .send({
      role: 'STAFF',
      franchiseId,
      managedRestaurantId: second,
    })
    .expect(404);
  await assignment(managerCookie)
    .send({
      role: 'RESTAURANT_ADMIN',
      franchiseId,
      managedRestaurantId: second,
    })
    .expect(200);
  await me(old).expect(401);
  await server()
    .get('/hr-access')
    .set('Authorization', 'Bearer ' + oldToken)
    .expect(401);
  const updated = cookieFrom(await signIn(account.email, password).expect(200));
  await me(updated)
    .expect(200)
    .expect(({ body }: { body: unknown }) => {
      expect(body).toMatchObject({
        data: {
          systemUser: { role: 'RESTAURANT_ADMIN', managedRestaurantId: second },
        },
      });
    });
  await server()
    .patch('/system-users/' + account.id + '/status')
    .set('Cookie', managerCookie)
    .send({ isActive: false })
    .expect(200);
  await me(updated).expect(401);
});
