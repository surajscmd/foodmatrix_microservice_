import { Prisma } from '@prisma/client';
import type { PrismaService } from '../../lib/prisma/prisma.service.js';
import { InternalCatalogService } from './internal-catalog.service.js';

const menuItem = {
  id: 'item',
  name: 'Dosa',
  sku: 'DOSA',
  basePrice: new Prisma.Decimal(99.95),
  isAvailable: true,
  category: { isActive: true },
  modifierGroups: [{ groupId: 'group' }],
};
const override = {
  menuItemId: menuItem.id,
  price: new Prisma.Decimal(109.5),
  isAvailable: true,
};
const modifier = {
  id: 'extra',
  name: 'Extra chutney',
  extraPrice: new Prisma.Decimal(12.5),
  group: { isActive: true },
  groupId: 'group',
  isActive: true,
};

function pricing({
  menuItems = [menuItem],
  overrides = [],
  modifiers = [],
}: {
  menuItems?: (typeof menuItem)[];
  overrides?: (typeof override)[];
  modifiers?: (typeof modifier)[];
} = {}) {
  const prisma = {
    restaurantMenuItem: { findMany: jest.fn().mockResolvedValue(overrides) },
    menuItem: { findMany: jest.fn().mockResolvedValue(menuItems) },
    modifier: { findMany: jest.fn().mockResolvedValue(modifiers) },
  };
  return {
    service: new InternalCatalogService(prisma as unknown as PrismaService),
    prisma,
  };
}

it('prices a unique item and modifier at the restaurant override', async () => {
  const { service, prisma } = pricing({
    overrides: [override],
    modifiers: [modifier],
  });
  const result = await service.getBulkPricing(
    'restaurant',
    [menuItem.id, menuItem.id],
    [modifier.id, modifier.id],
  );
  expect(result.menuItems).toEqual([
    {
      menuItemId: 'item',
      name: 'Dosa',
      sku: 'DOSA',
      price: 109.5,
      isAvailable: true,
      modifierGroupIds: ['group'],
    },
  ]);
  expect(result.modifiers).toHaveLength(1);
  expect(result.modifiers[0]).toMatchObject({
    id: modifier.id,
    extraPrice: 12.5,
    groupId: 'group',
  });
  expect(prisma.restaurantMenuItem.findMany).toHaveBeenCalledWith({
    where: { restaurantId: 'restaurant', menuItemId: { in: ['item'] } },
  });
});

it('falls back to the global price when the restaurant has no override', async () => {
  const { service } = pricing();
  const result = await service.getBulkPricing('restaurant', ['item'], []);
  expect(result.menuItems[0]).toMatchObject({
    price: 99.95,
    isAvailable: true,
  });
});

it('returns empty arrays for an empty request', async () => {
  const { service } = pricing({ menuItems: [] });
  await expect(service.getBulkPricing('restaurant', [], [])).resolves.toEqual({
    menuItems: [],
    modifiers: [],
  });
});

it('reports an item missing from the global menu', async () => {
  const { service } = pricing({ menuItems: [] });
  await expect(
    service.getBulkPricing('restaurant', ['item'], []),
  ).rejects.toThrow('was not found');
});

it.each([
  { overrides: [{ ...override, isAvailable: false }] },
  { menuItems: [{ ...menuItem, isAvailable: false }], overrides: [override] },
  { menuItems: [{ ...menuItem, category: { isActive: false } }] },
])('rejects unavailable menu items', async (scenario) => {
  const { service } = pricing(scenario);
  await expect(
    service.getBulkPricing('restaurant', ['item'], []),
  ).rejects.toThrow('not currently available');
});

it.each([
  { ...modifier, isActive: false },
  { ...modifier, group: { isActive: false } },
])('rejects unavailable modifiers', async (candidate) => {
  const { service } = pricing({ modifiers: [candidate] });
  await expect(
    service.getBulkPricing('restaurant', ['item'], ['extra']),
  ).rejects.toThrow('not currently available');
});
