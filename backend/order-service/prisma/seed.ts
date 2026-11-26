import 'dotenv/config';
import { createHash } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  OrderItemStatus,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is missing in environment');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const INDIRANAGAR_ID = 'd1a7c4b0-1001-4a2b-8c3d-111111111111';
const WHITEFIELD_ID = 'd1a7c4b0-1002-4a2b-8c3d-222222222222';
const KORAMANGALA_ID = 'd1a7c4b0-1003-4a2b-8c3d-333333333333';

const STAFF_IDS = {
  arjun: 'b0000000-0000-4000-8000-000000000001',
  kavya: 'b0000000-0000-4000-8000-000000000002',
  sneha: 'b0000000-0000-4000-8000-000000000007',
  divya: 'b0000000-0000-4000-8000-000000000009',
  anjali: 'b0000000-0000-4000-8000-000000000011',
  nikhil: 'b0000000-0000-4000-8000-000000000012',
} as const;

interface CatalogLookup {
  menuItems: Map<string, { id: string; name: string; price: number }>;
  modifiers: Map<string, { id: string; name: string; price: number }>;
}

const FALLBACK_MENU: Array<{ sku: string; id: string; name: string; price: number }> = [
  { sku: 'DOS-MAS-001', id: 'f1000000-0000-4000-8000-000000000001', name: 'Masala Dosa', price: 139 },
  { sku: 'SID-IDL-001', id: 'f1000000-0000-4000-8000-000000000002', name: 'Idli', price: 79 },
  { sku: 'BEV-COF-001', id: 'f1000000-0000-4000-8000-000000000003', name: 'Filter Coffee', price: 69 },
  { sku: 'CUR-PAN-001', id: 'f1000000-0000-4000-8000-000000000004', name: 'Paneer Butter Masala', price: 279 },
  { sku: 'BRD-NAN-003', id: 'f1000000-0000-4000-8000-000000000005', name: 'Garlic Naan', price: 89 },
  { sku: 'BIR-CHK-001', id: 'f1000000-0000-4000-8000-000000000006', name: 'Chicken Biryani', price: 299 },
  { sku: 'CUR-CHK-001', id: 'f1000000-0000-4000-8000-000000000007', name: 'Butter Chicken', price: 329 },
  { sku: 'STR-PAN-001', id: 'f1000000-0000-4000-8000-000000000008', name: 'Paneer Tikka', price: 259 },
  { sku: 'BEV-LAS-002', id: 'f1000000-0000-4000-8000-000000000009', name: 'Mango Lassi', price: 119 },
  { sku: 'DES-GUL-001', id: 'f1000000-0000-4000-8000-000000000010', name: 'Gulab Jamun', price: 99 },
  { sku: 'STF-PAV-001', id: 'f1000000-0000-4000-8000-000000000011', name: 'Pav Bhaji', price: 149 },
  { sku: 'CMB-THL-001', id: 'f1000000-0000-4000-8000-000000000012', name: 'North Indian Veg Thali', price: 249 },
];

const FALLBACK_MODIFIERS: Array<{ key: string; id: string; name: string; price: number }> = [
  { key: 'Dosa Extras:Extra Butter', id: 'f2000000-0000-4000-8000-000000000001', name: 'Extra Butter', price: 20 },
  { key: 'Dosa Extras:Cheese', id: 'f2000000-0000-4000-8000-000000000002', name: 'Cheese', price: 40 },
  { key: 'Biryani Options:Extra Egg', id: 'f2000000-0000-4000-8000-000000000003', name: 'Extra Egg', price: 30 },
  { key: 'Spice Level:Medium', id: 'f2000000-0000-4000-8000-000000000004', name: 'Medium', price: 0 },
  { key: 'Spice Level:Spicy', id: 'f2000000-0000-4000-8000-000000000005', name: 'Spicy', price: 0 },
  { key: 'Bread Extras:Extra Butter', id: 'f2000000-0000-4000-8000-000000000006', name: 'Extra Butter', price: 20 },
];

async function resolveCatalog(): Promise<CatalogLookup> {
  const menuItems = new Map(
    FALLBACK_MENU.map((m) => [m.sku, { id: m.id, name: m.name, price: m.price }]),
  );
  const modifiers = new Map(
    FALLBACK_MODIFIERS.map((m) => [m.key, { id: m.id, name: m.name, price: m.price }]),
  );

  const catalogUrl = process.env.CATALOG_DATABASE_URL;
  if (!catalogUrl) return { menuItems, modifiers };

  const pool = new Pool({ connectionString: catalogUrl });
  try {
    const menuRes = await pool.query<{
      id: string;
      sku: string;
      name: string;
      basePrice: string;
    }>('SELECT id, sku, name, "basePrice" FROM "MenuItem"');

    for (const row of menuRes.rows) {
      menuItems.set(row.sku, {
        id: row.id,
        name: row.name,
        price: Number(row.basePrice),
      });
    }

    const modRes = await pool.query<{
      id: string;
      name: string;
      extraPrice: string;
      groupName: string;
    }>(
      'SELECT m.id, m.name, m."extraPrice", mg.name AS "groupName" FROM "Modifier" m JOIN "ModifierGroup" mg ON mg.id = m."groupId"',
    );

    for (const row of modRes.rows) {
      modifiers.set(`${row.groupName}:${row.name}`, {
        id: row.id,
        name: row.name,
        price: Number(row.extraPrice),
      });
    }

    console.log(
      `Resolved ${menuRes.rows.length} menu items and ${modRes.rows.length} modifiers from CATALOG_DATABASE_URL.`,
    );
  } finally {
    await pool.end();
  }

  return { menuItems, modifiers };
}

function daysAgo(days: number, hourOffset = 0): Date {
  return new Date(
    Date.now() - (days * 24 + hourOffset) * 60 * 60 * 1000,
  );
}

async function main() {
  console.log('Seeding order-service...');
  const catalog = await resolveCatalog();

  const customers = [
    { id: 'c0000000-0000-4000-8000-000000000001', phone: '+919845011101', name: 'Aarav Mehta' },
    { id: 'c0000000-0000-4000-8000-000000000002', phone: '+919845011102', name: 'Diya Krishnan' },
    { id: 'c0000000-0000-4000-8000-000000000003', phone: '+919845011103', name: 'Kabir Malhotra' },
    { id: 'c0000000-0000-4000-8000-000000000004', phone: '+919845011104', name: 'Neha Bansal' },
    { id: 'c0000000-0000-4000-8000-000000000005', phone: '+919845011105', name: 'Rishi Chatterjee' },
    { id: 'c0000000-0000-4000-8000-000000000006', phone: '+919845011106', name: 'Pooja Deshpande' },
    { id: 'c0000000-0000-4000-8000-000000000007', phone: '+919845011107', name: 'Varun Subramanian' },
    { id: 'c0000000-0000-4000-8000-000000000008', phone: '+919845011108', name: 'Tanya Kapoor' },
  ];

  const customerMap = new Map<string, string>();
  for (const c of customers) {
    const saved = await prisma.customer.upsert({
      where: { phone: c.phone },
      update: { name: c.name },
      create: c,
    });
    customerMap.set(c.phone, saved.id);
  }

  interface OrderLineSeed {
    sku: string;
    quantity: number;
    status: OrderItemStatus;
    modifiers?: string[];
  }

  interface OrderSeed {
    id: string;
    idempotencyKey: string;
    restaurantId: string;
    staffId: string;
    tableId: string | null;
    customerPhone: string;
    type: OrderType;
    status: OrderStatus;
    discount?: number;
    createdAt: Date;
    cancelledAt?: Date;
    cancelReason?: string;
    items: OrderLineSeed[];
    payment?: {
      id: string;
      method: PaymentMethod;
      status: PaymentStatus;
      transactionId: string;
      createdAt: Date;
    };
  }

  const orderSeeds: OrderSeed[] = [
    // Past 6 days completed orders (populates 7-day Dashboard revenue chart)
    {
      id: 'c1000000-0000-4000-8000-000000000001',
      idempotencyKey: 'seed-order-001',
      restaurantId: INDIRANAGAR_ID,
      staffId: STAFF_IDS.arjun,
      tableId: 'T-01',
      customerPhone: '+919845011101',
      type: OrderType.DINE_IN,
      status: OrderStatus.COMPLETED,
      createdAt: daysAgo(6, 2),
      items: [
        { sku: 'DOS-MAS-001', quantity: 2, status: OrderItemStatus.READY, modifiers: ['Dosa Extras:Extra Butter'] },
        { sku: 'BEV-COF-001', quantity: 2, status: OrderItemStatus.READY },
      ],
      payment: {
        id: 'c2000000-0000-4000-8000-000000000001',
        method: PaymentMethod.UPI,
        status: PaymentStatus.COMPLETED,
        transactionId: 'TXN-SEED-001',
        createdAt: daysAgo(6, 1),
      },
    },
    {
      id: 'c1000000-0000-4000-8000-000000000002',
      idempotencyKey: 'seed-order-002',
      restaurantId: INDIRANAGAR_ID,
      staffId: STAFF_IDS.kavya,
      tableId: null,
      customerPhone: '+919845011102',
      type: OrderType.TAKEAWAY,
      status: OrderStatus.COMPLETED,
      createdAt: daysAgo(5, 3),
      items: [
        { sku: 'CUR-PAN-001', quantity: 2, status: OrderItemStatus.READY },
        { sku: 'BRD-NAN-003', quantity: 4, status: OrderItemStatus.READY, modifiers: ['Bread Extras:Extra Butter'] },
        { sku: 'BEV-LAS-002', quantity: 2, status: OrderItemStatus.READY },
      ],
      payment: {
        id: 'c2000000-0000-4000-8000-000000000002',
        method: PaymentMethod.CARD,
        status: PaymentStatus.COMPLETED,
        transactionId: 'TXN-SEED-002',
        createdAt: daysAgo(5, 2),
      },
    },
    {
      id: 'c1000000-0000-4000-8000-000000000003',
      idempotencyKey: 'seed-order-003',
      restaurantId: INDIRANAGAR_ID,
      staffId: STAFF_IDS.arjun,
      tableId: 'T-05',
      customerPhone: '+919845011103',
      type: OrderType.DINE_IN,
      status: OrderStatus.COMPLETED,
      discount: 100,
      createdAt: daysAgo(4, 1),
      items: [
        { sku: 'BIR-CHK-001', quantity: 3, status: OrderItemStatus.READY, modifiers: ['Biryani Options:Extra Egg'] },
        { sku: 'STR-PAN-001', quantity: 1, status: OrderItemStatus.READY },
        { sku: 'DES-GUL-001', quantity: 3, status: OrderItemStatus.READY },
      ],
      payment: {
        id: 'c2000000-0000-4000-8000-000000000003',
        method: PaymentMethod.CARD,
        status: PaymentStatus.COMPLETED,
        transactionId: 'TXN-SEED-003',
        createdAt: daysAgo(4, 0),
      },
    },
    {
      id: 'c1000000-0000-4000-8000-000000000004',
      idempotencyKey: 'seed-order-004',
      restaurantId: INDIRANAGAR_ID,
      staffId: STAFF_IDS.kavya,
      tableId: null,
      customerPhone: '+919845011104',
      type: OrderType.DELIVERY,
      status: OrderStatus.COMPLETED,
      createdAt: daysAgo(3, 2),
      items: [
        { sku: 'CUR-CHK-001', quantity: 2, status: OrderItemStatus.READY, modifiers: ['Spice Level:Medium'] },
        { sku: 'BRD-NAN-003', quantity: 4, status: OrderItemStatus.READY },
      ],
      payment: {
        id: 'c2000000-0000-4000-8000-000000000004',
        method: PaymentMethod.ONLINE,
        status: PaymentStatus.COMPLETED,
        transactionId: 'TXN-SEED-004',
        createdAt: daysAgo(3, 1),
      },
    },
    {
      id: 'c1000000-0000-4000-8000-000000000005',
      idempotencyKey: 'seed-order-005',
      restaurantId: INDIRANAGAR_ID,
      staffId: STAFF_IDS.arjun,
      tableId: 'T-03',
      customerPhone: '+919845011105',
      type: OrderType.DINE_IN,
      status: OrderStatus.COMPLETED,
      createdAt: daysAgo(2, 4),
      items: [
        { sku: 'CMB-THL-001', quantity: 4, status: OrderItemStatus.READY },
        { sku: 'BEV-LAS-002', quantity: 4, status: OrderItemStatus.READY },
      ],
      payment: {
        id: 'c2000000-0000-4000-8000-000000000005',
        method: PaymentMethod.UPI,
        status: PaymentStatus.COMPLETED,
        transactionId: 'TXN-SEED-005',
        createdAt: daysAgo(2, 3),
      },
    },
    {
      id: 'c1000000-0000-4000-8000-000000000006',
      idempotencyKey: 'seed-order-006',
      restaurantId: INDIRANAGAR_ID,
      staffId: STAFF_IDS.arjun,
      tableId: 'T-06',
      customerPhone: '+919845011106',
      type: OrderType.DINE_IN,
      status: OrderStatus.COMPLETED,
      createdAt: daysAgo(1, 3),
      items: [
        { sku: 'STF-PAV-001', quantity: 3, status: OrderItemStatus.READY, modifiers: ['Spice Level:Spicy'] },
        { sku: 'SID-IDL-001', quantity: 2, status: OrderItemStatus.READY },
        { sku: 'BEV-COF-001', quantity: 3, status: OrderItemStatus.READY },
      ],
      payment: {
        id: 'c2000000-0000-4000-8000-000000000006',
        method: PaymentMethod.CASH,
        status: PaymentStatus.COMPLETED,
        transactionId: 'TXN-SEED-006',
        createdAt: daysAgo(1, 2),
      },
    },
    // Active today orders for Indiranagar (POS + Kitchen Display + Waiter Pad)
    {
      id: 'c1000000-0000-4000-8000-000000000007',
      idempotencyKey: 'seed-order-007',
      restaurantId: INDIRANAGAR_ID,
      staffId: STAFF_IDS.arjun,
      tableId: 'T-02',
      customerPhone: '+919845011107',
      type: OrderType.DINE_IN,
      status: OrderStatus.PREPARING,
      createdAt: daysAgo(0, 1),
      items: [
        { sku: 'BIR-CHK-001', quantity: 2, status: OrderItemStatus.PREPARING, modifiers: ['Biryani Options:Extra Egg'] },
        { sku: 'STR-PAN-001', quantity: 1, status: OrderItemStatus.READY },
      ],
    },
    {
      id: 'c1000000-0000-4000-8000-000000000008',
      idempotencyKey: 'seed-order-008',
      restaurantId: INDIRANAGAR_ID,
      staffId: STAFF_IDS.arjun,
      tableId: 'T-04',
      customerPhone: '+919845011108',
      type: OrderType.DINE_IN,
      status: OrderStatus.READY,
      createdAt: daysAgo(0, 2),
      items: [
        { sku: 'CUR-PAN-001', quantity: 1, status: OrderItemStatus.READY },
        { sku: 'BRD-NAN-003', quantity: 2, status: OrderItemStatus.READY },
        { sku: 'BEV-LAS-002', quantity: 2, status: OrderItemStatus.READY },
      ],
    },
    {
      id: 'c1000000-0000-4000-8000-000000000009',
      idempotencyKey: 'seed-order-009',
      restaurantId: INDIRANAGAR_ID,
      staffId: STAFF_IDS.kavya,
      tableId: 'T-07',
      customerPhone: '+919845011101',
      type: OrderType.DINE_IN,
      status: OrderStatus.PENDING,
      createdAt: daysAgo(0, 0),
      items: [
        { sku: 'DOS-MAS-001', quantity: 2, status: OrderItemStatus.PENDING, modifiers: ['Dosa Extras:Cheese'] },
        { sku: 'BEV-COF-001', quantity: 2, status: OrderItemStatus.PENDING },
      ],
    },
    {
      id: 'c1000000-0000-4000-8000-000000000010',
      idempotencyKey: 'seed-order-010',
      restaurantId: INDIRANAGAR_ID,
      staffId: STAFF_IDS.arjun,
      tableId: null,
      customerPhone: '+919845011102',
      type: OrderType.TAKEAWAY,
      status: OrderStatus.CANCELLED,
      createdAt: daysAgo(1, 5),
      cancelledAt: daysAgo(1, 4),
      cancelReason: 'Customer rescheduled pickup for tomorrow',
      items: [
        { sku: 'STF-PAV-001', quantity: 2, status: OrderItemStatus.CANCELLED },
      ],
    },
    // Whitefield orders
    {
      id: 'c1000000-0000-4000-8000-000000000011',
      idempotencyKey: 'seed-order-011',
      restaurantId: WHITEFIELD_ID,
      staffId: STAFF_IDS.sneha,
      tableId: 'W-01',
      customerPhone: '+919845011103',
      type: OrderType.DINE_IN,
      status: OrderStatus.COMPLETED,
      createdAt: daysAgo(2, 2),
      items: [
        { sku: 'BIR-CHK-001', quantity: 2, status: OrderItemStatus.READY },
        { sku: 'CUR-CHK-001', quantity: 1, status: OrderItemStatus.READY, modifiers: ['Spice Level:Medium'] },
      ],
      payment: {
        id: 'c2000000-0000-4000-8000-000000000007',
        method: PaymentMethod.CARD,
        status: PaymentStatus.COMPLETED,
        transactionId: 'TXN-SEED-007',
        createdAt: daysAgo(2, 1),
      },
    },
    {
      id: 'c1000000-0000-4000-8000-000000000012',
      idempotencyKey: 'seed-order-012',
      restaurantId: WHITEFIELD_ID,
      staffId: STAFF_IDS.divya,
      tableId: null,
      customerPhone: '+919845011104',
      type: OrderType.DELIVERY,
      status: OrderStatus.COMPLETED,
      createdAt: daysAgo(0, 3),
      items: [
        { sku: 'CMB-THL-001', quantity: 3, status: OrderItemStatus.READY },
      ],
      payment: {
        id: 'c2000000-0000-4000-8000-000000000008',
        method: PaymentMethod.UPI,
        status: PaymentStatus.COMPLETED,
        transactionId: 'TXN-SEED-008',
        createdAt: daysAgo(0, 2),
      },
    },
    {
      id: 'c1000000-0000-4000-8000-000000000013',
      idempotencyKey: 'seed-order-013',
      restaurantId: WHITEFIELD_ID,
      staffId: STAFF_IDS.sneha,
      tableId: 'W-03',
      customerPhone: '+919845011105',
      type: OrderType.DINE_IN,
      status: OrderStatus.CONFIRMED,
      createdAt: daysAgo(0, 1),
      items: [
        { sku: 'DOS-MAS-001', quantity: 3, status: OrderItemStatus.PENDING, modifiers: ['Dosa Extras:Extra Butter'] },
      ],
    },
    // Koramangala orders
    {
      id: 'c1000000-0000-4000-8000-000000000014',
      idempotencyKey: 'seed-order-014',
      restaurantId: KORAMANGALA_ID,
      staffId: STAFF_IDS.anjali,
      tableId: 'K-02',
      customerPhone: '+919845011106',
      type: OrderType.DINE_IN,
      status: OrderStatus.COMPLETED,
      createdAt: daysAgo(1, 2),
      items: [
        { sku: 'CUR-PAN-001', quantity: 2, status: OrderItemStatus.READY },
        { sku: 'BRD-NAN-003', quantity: 4, status: OrderItemStatus.READY },
        { sku: 'DES-GUL-001', quantity: 2, status: OrderItemStatus.READY },
      ],
      payment: {
        id: 'c2000000-0000-4000-8000-000000000009',
        method: PaymentMethod.UPI,
        status: PaymentStatus.COMPLETED,
        transactionId: 'TXN-SEED-009',
        createdAt: daysAgo(1, 1),
      },
    },
    {
      id: 'c1000000-0000-4000-8000-000000000015',
      idempotencyKey: 'seed-order-015',
      restaurantId: KORAMANGALA_ID,
      staffId: STAFF_IDS.nikhil,
      tableId: 'K-04',
      customerPhone: '+919845011107',
      type: OrderType.DINE_IN,
      status: OrderStatus.READY,
      createdAt: daysAgo(0, 1),
      items: [
        { sku: 'BIR-CHK-001', quantity: 2, status: OrderItemStatus.READY },
        { sku: 'BEV-LAS-002', quantity: 2, status: OrderItemStatus.READY },
      ],
    },
  ];

  let createdCount = 0;

  for (const seed of orderSeeds) {
    const existing = await prisma.order.findUnique({
      where: { idempotencyKey: seed.idempotencyKey },
      select: { id: true },
    });
    if (existing) continue;

    let subtotal = 0;
    const itemCreates = seed.items.map((line) => {
      const menuItem = catalog.menuItems.get(line.sku);
      if (!menuItem) {
        throw new Error(`Missing catalog menu item for SKU ${line.sku}`);
      }
      const modCreates = (line.modifiers ?? []).map((modKey) => {
        const mod = catalog.modifiers.get(modKey);
        if (!mod) {
          throw new Error(`Missing catalog modifier for ${modKey}`);
        }
        return {
          modifierId: mod.id,
          name: mod.name,
          price: new Prisma.Decimal(mod.price.toFixed(2)),
          quantity: 1,
        };
      });
      const modTotal = modCreates.reduce(
        (sum, m) => sum + Number(m.price) * m.quantity,
        0,
      );
      const unitPrice = menuItem.price + modTotal;
      const lineTotal = unitPrice * line.quantity;
      subtotal += lineTotal;

      return {
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: new Prisma.Decimal(unitPrice.toFixed(2)),
        quantity: line.quantity,
        total: new Prisma.Decimal(lineTotal.toFixed(2)),
        status: line.status,
        modifiers: { create: modCreates },
      };
    });

    const discount = seed.discount ?? 0;
    const taxable = Math.max(0, subtotal - discount);
    const tax = Number((taxable * 0.05).toFixed(2));
    const total = Number((taxable + tax).toFixed(2));
    const customerId = customerMap.get(seed.customerPhone)!;

    await prisma.order.create({
      data: {
        id: seed.id,
        idempotencyKey: seed.idempotencyKey,
        restaurantId: seed.restaurantId,
        staffId: seed.staffId,
        tableId: seed.tableId,
        customerId,
        type: seed.type,
        status: seed.status,
        subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
        discount: new Prisma.Decimal(discount.toFixed(2)),
        tax: new Prisma.Decimal(tax.toFixed(2)),
        total: new Prisma.Decimal(total.toFixed(2)),
        cancelledAt: seed.cancelledAt ?? null,
        cancelReason: seed.cancelReason ?? null,
        createdAt: seed.createdAt,
        items: { create: itemCreates },
        ...(seed.payment && {
          payments: {
            create: {
              id: seed.payment.id,
              amount: new Prisma.Decimal(total.toFixed(2)),
              status: seed.payment.status,
              method: seed.payment.method,
              transactionId: seed.payment.transactionId,
              createdAt: seed.payment.createdAt,
            },
          },
        }),
        createRequests: {
          create: {
            key: seed.idempotencyKey,
            fingerprint: createHash('sha256')
              .update(seed.idempotencyKey)
              .digest('hex'),
          },
        },
      },
    });
    createdCount++;
  }

  console.log(
    `Order seed complete: ${customers.length} customers, ${createdCount} new orders (${orderSeeds.length} total configured).`,
  );
}

main()
  .catch((error) => {
    console.error('Order seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
