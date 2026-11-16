import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import type { CatalogActor } from '../src/auth/catalog-access';
import { configureCatalogApp } from '../src/configure-app';

describe('Catalog HTTP API', () => {
  let app: INestApplication<App>;
  const restaurantId = randomUUID();
  const otherRestaurantId = randomUUID();
  const actor = (
    role: CatalogActor['role'],
    restaurants: string[],
    managedRestaurantId: string | null = null,
  ): CatalogActor => ({
    id: role.toLowerCase(),
    role,
    managedRestaurantId,
    restaurants: restaurants.map((id) => ({ id })),
  });
  const actors = new Map([
    ['admin-token', actor('SUPER_ADMIN', [restaurantId, otherRestaurantId])],
    ['franchise-token', actor('FRANCHISE_ADMIN', [restaurantId])],
    ['manager-token', actor('RESTAURANT_ADMIN', [restaurantId], restaurantId)],
    ['staff-token', actor('STAFF', [restaurantId], restaurantId)],
  ]);

  function http(token: string | null = 'admin-token') {
    const client = request(app.getHttpServer());
    const authorize = (test: request.Test) =>
      token ? test.set('Authorization', 'Bearer ' + token) : test;

    return {
      get: (path: string) => authorize(client.get(path)),
      post: (path: string) => authorize(client.post(path)),
      patch: (path: string) => authorize(client.patch(path)),
      delete: (path: string) => authorize(client.delete(path)),
    };
  }
  const dataId = (response: request.Response) =>
    (response.body as { data: { id: string } }).data.id;

  async function createItem(sku: string) {
    const categoryId = dataId(
      await http()
        .post('/menu-categories')
        .send({ name: sku + ' category' })
        .expect(201),
    );
    const itemId = dataId(
      await http()
        .post('/menu-items')
        .send({ categoryId, name: sku, sku, basePrice: 99.95 })
        .expect(201),
    );
    return { categoryId, itemId };
  }

  const pricing = (itemId: string, modifierIds: string[] = []) =>
    http(null)
      .post('/internal/catalog/bulk-pricing')
      .set('x-internal-key', process.env.INTERNAL_API_KEY ?? '')
      .send({ restaurantId, menuItemIds: [itemId], modifierIds });

  beforeAll(async () => {
    jest.spyOn(globalThis, 'fetch').mockImplementation((_url, options) => {
      const token = new Headers(options?.headers)
        .get('authorization')
        ?.replace(/^Bearer /, '');
      const account = actors.get(token ?? '');
      if (account) return Promise.resolve(Response.json(account));
      if (token === 'unavailable-token') {
        return Promise.reject(new Error('Organization unavailable'));
      }
      if (token === 'unassigned-token') {
        return Promise.resolve(new Response(null, { status: 403 }));
      }
      return Promise.resolve(new Response(null, { status: 401 }));
    });
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    configureCatalogApp(app);
    await app.init();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app?.close();
  });

  it('requires Organization-backed sessions for workspace routes', async () => {
    await http(null).get('/').expect(200);
    await http(null).get('/menu-items').expect(401);
    await http('expired-token').get('/ingredients').expect(401);
    await http('unassigned-token').get('/menu-items').expect(403);
    await http('unavailable-token').get('/menu-items').expect(503);
    await http('staff-token').get('/menu-items').expect(200);
    await http('franchise-token')
      .post('/menu-categories')
      .send({ name: 'Shared category' })
      .expect(403);
    await http().post('/internal/catalog/bulk-pricing').expect(401);
    expect(
      jest
        .mocked(fetch)
        .mock.calls.some(
          ([url, options]) =>
            url instanceof URL &&
            url.pathname.endsWith('/catalog-access') &&
            new Headers(options?.headers).get('authorization') ===
              'Bearer staff-token' &&
            options?.redirect === 'error',
        ),
    ).toBe(true);
  });

  it('limits restaurant price and availability overrides to assigned locations', async () => {
    const { categoryId, itemId } = await createItem('SCOPED');
    const ownOverride = dataId(
      await http('franchise-token')
        .post('/restaurant-menu-item')
        .send({ restaurantId, menuItemId: itemId, price: 110 })
        .expect(201),
    );
    const otherOverride = dataId(
      await http()
        .post('/restaurant-menu-item')
        .send({
          restaurantId: otherRestaurantId,
          menuItemId: itemId,
          price: 120,
          isAvailable: false,
        })
        .expect(201),
    );
    await http('manager-token')
      .patch('/restaurant-menu-item/' + ownOverride)
      .send({ price: 115 })
      .expect(200);
    await http('manager-token')
      .patch('/restaurant-menu-item/' + otherOverride)
      .send({ price: 116 })
      .expect(404);
    await http('franchise-token')
      .delete('/restaurant-menu-item/' + otherOverride)
      .expect(404);
    await http('staff-token')
      .patch('/restaurant-menu-item/' + ownOverride)
      .send({ price: 116 })
      .expect(403);
    await http('staff-token')
      .get('/restaurant-menu-item/' + otherOverride)
      .expect(404);
    await http('staff-token')
      .get('/restaurant-menu-item/restaurant/' + otherRestaurantId)
      .expect(403);
    await http('staff-token')
      .get('/restaurant-menu-item/restaurant/' + restaurantId)
      .expect(200);
    await http('franchise-token')
      .get('/restaurant-menu-item/changed')
      .expect(200)
      .expect(({ body }: { body: unknown }) => {
        expect(body).toMatchObject({ data: [{ restaurantId }] });
      });
    await http('staff-token')
      .get('/menu-items/' + itemId + '/restaurants')
      .expect(200)
      .expect(({ body }: { body: unknown }) => {
        expect(body).toMatchObject({
          data: { restaurants: [{ restaurantId, price: 115 }] },
        });
      });
    await http('staff-token')
      .get('/menu-items/category/' + categoryId)
      .expect(200)
      .expect(({ body }: { body: unknown }) => {
        expect(body).toMatchObject({
          data: [
            {
              id: itemId,
              configuredRestaurantCount: 1,
              unavailableRestaurantIds: [],
            },
          ],
        });
      });
  });

  it('uses global pricing by default and applies an explicit restaurant price', async () => {
    const { categoryId, itemId } = await createItem('PRICE');
    await http()
      .get('/menu-items/category/' + categoryId)
      .expect(200)
      .expect(({ body }: { body: unknown }) => {
        expect(body).toMatchObject({
          category: { id: categoryId },
          data: [{ id: itemId }],
        });
      });
    const override = dataId(
      await http()
        .post('/restaurant-menu-item')
        .send({ restaurantId, menuItemId: itemId })
        .expect(201),
    );
    await pricing(itemId)
      .expect(201)
      .expect(({ body }: { body: unknown }) => {
        expect(body).toMatchObject({
          menuItems: [{ menuItemId: itemId, price: 99.95 }],
        });
      });
    await http()
      .patch('/restaurant-menu-item/' + override)
      .send({ price: 109.5 })
      .expect(200);
    await pricing(itemId)
      .expect(201)
      .expect(({ body }: { body: unknown }) => {
        expect(body).toMatchObject({
          menuItems: [{ menuItemId: itemId, price: 109.5 }],
        });
      });
    await http()
      .patch('/restaurant-menu-item/' + override)
      .send({ restaurantId: randomUUID(), menuItemId: randomUUID() })
      .expect(400);
  });

  it('hides inactive categories on restaurant menus and rejects pricing those items', async () => {
    const { categoryId, itemId } = await createItem('INACTIVE');
    await http()
      .delete('/menu-categories/' + categoryId)
      .expect(200);
    await http()
      .get('/restaurant-menu-item/restaurant/' + restaurantId)
      .expect(200)
      .expect(({ body }: { body: unknown }) => {
        const { data } = body as { data: { id: string }[] };
        expect(data.some(({ id }) => id === itemId)).toBe(false);
      });
    await pricing(itemId).expect(404);
    await http()
      .get('/menu-items/' + itemId)
      .expect(200);
  });

  it('filters the restaurant menu before counting and paginating', async () => {
    const { categoryId, itemId } = await createItem('FILTERED-COFFEE-1');
    const secondItemId = dataId(
      await http()
        .post('/menu-items')
        .send({
          categoryId,
          name: 'Iced coffee',
          sku: 'FILTERED-COFFEE-2',
          basePrice: 120,
        })
        .expect(201),
    );
    await createItem('FILTERED-COFFEE-OTHER');
    await http()
      .post('/restaurant-menu-item')
      .send({ restaurantId, menuItemId: itemId, isAvailable: false })
      .expect(201);
    await http()
      .post('/restaurant-menu-item')
      .send({
        restaurantId: otherRestaurantId,
        menuItemId: secondItemId,
        isAvailable: false,
      })
      .expect(201);

    const list = () =>
      http('manager-token').get(
        '/restaurant-menu-item/restaurant/' + restaurantId,
      );
    const seen = new Set<string>();
    for (const page of [1, 2]) {
      const response = await list()
        .query({
          categoryId,
          search: '  cOfFeE  ',
          page,
          limit: 1,
          includeAvailabilityCounts: true,
        })
        .expect(200);
      const body = response.body as {
        data: { id: string }[];
        pagination: unknown;
        availabilityCounts: unknown;
      };
      expect(body.pagination).toEqual({
        page,
        limit: 1,
        total: 2,
        totalPages: 2,
      });
      expect(body.data).toHaveLength(1);
      expect(body.availabilityCounts).toEqual({ available: 1, unavailable: 1 });
      seen.add(body.data[0].id);
    }
    expect(seen).toEqual(new Set([itemId, secondItemId]));
    await list()
      .query({
        categoryId,
        availability: 'unavailable',
        includeAvailabilityCounts: true,
      })
      .expect(200)
      .expect(({ body }: { body: unknown }) => {
        expect(body).toMatchObject({
          data: [{ id: itemId, isAvailable: false }],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          availabilityCounts: { available: 1, unavailable: 1 },
        });
      });
    await list()
      .query({
        categoryId,
        search: 'FILTERED-COFFEE-2',
        availability: 'available',
        includeAvailabilityCounts: true,
      })
      .expect(200)
      .expect(({ body }: { body: unknown }) => {
        expect(body).toMatchObject({
          data: [{ id: secondItemId, isAvailable: true }],
          pagination: { total: 1, totalPages: 1 },
          availabilityCounts: { available: 1, unavailable: 0 },
        });
      });
    await list().query({ availability: 'invalid' }).expect(400);
  });

  it('keeps inactive modifier groups out of checkout pricing', async () => {
    const { itemId } = await createItem('MODIFIER');
    const group = await http()
      .post('/modifier-group')
      .send({ name: 'Extras' })
      .expect(201);
    const groupId = (group.body as { id: string }).id;
    const modifier = await http()
      .post('/modifiers')
      .send({ groupId, name: 'Extra', extraPrice: 10.5 })
      .expect(201);
    const modifierId = (
      modifier.body as { result: { modifier: { id: string } } }
    ).result.modifier.id;
    await pricing(itemId, [modifierId]).expect(201);
    await http()
      .delete('/modifier-group/' + groupId)
      .expect(200);
    await pricing(itemId, [modifierId]).expect(404);
  });

  it('preserves modifier-group settings when changing only its name', async () => {
    const group = await http()
      .post('/modifier-group')
      .send({
        name: 'Custom group',
        sortOrder: 7,
        minSelections: 2,
        maxSelections: 4,
      })
      .expect(201);
    const groupId = (group.body as { id: string }).id;
    await http()
      .patch('/modifier-group/' + groupId)
      .send({ name: 'Renamed group' })
      .expect(200)
      .expect(({ body }: { body: unknown }) => {
        expect(body).toMatchObject({
          name: 'Renamed group',
          sortOrder: 7,
          minSelections: 2,
          maxSelections: 4,
        });
      });
    await http()
      .patch('/modifiers/' + randomUUID())
      .send({ name: 'Missing' })
      .expect(404);
  });

  it('returns validation errors for invalid pagination and prices', async () => {
    await http().get('/ingredients').query({ page: 0 }).expect(400);
    await http()
      .get('/restaurant-menu-item/restaurant/' + restaurantId)
      .query({ limit: 'invalid' })
      .expect(400);
    const { itemId } = await createItem('VALIDATION');
    for (const price of [null, 10.123, 100_000_000]) {
      await http()
        .post('/restaurant-menu-item')
        .send({ restaurantId, menuItemId: itemId, price })
        .expect(400);
    }
    await http()
      .patch('/menu-items/' + itemId)
      .send({ name: null })
      .expect(400);
  });

  it('keeps recipes available for inventory when a menu item is retired', async () => {
    const { itemId } = await createItem('RECIPE');
    const ingredientId = dataId(
      await http()
        .post('/ingredients')
        .send({ name: 'Rice', uom: 'kg' })
        .expect(201),
    );
    await http()
      .post('/recipe-items')
      .send({ menuItemId: itemId, ingredientId, quantityNeeded: 0.125 })
      .expect(201);
    await http()
      .delete('/menu-items/' + itemId)
      .expect(200);
    await http(null)
      .post('/internal/catalog/bulk-recipes')
      .set('x-internal-key', process.env.INTERNAL_API_KEY ?? '')
      .send({ menuItemIds: [itemId], modifierIds: [] })
      .expect(201)
      .expect(({ body }: { body: unknown }) => {
        expect(body).toMatchObject({
          menuItems: [
            {
              menuItemId: itemId,
              ingredients: [{ ingredientId, quantityNeeded: 0.125 }],
            },
          ],
        });
      });
  });
});
