import 'dotenv/config';

import {
  LocationType,
  MovementType,
  Prisma,
  PrismaClient,
  StockRequestStatus,
  TransferDiscrepancyType,
  TransferStatus,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is missing in environment');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

type IngredientSeed = readonly [ingredientId: string, name: string];

const FALLBACK_INGREDIENTS: IngredientSeed[] = [
  ['9683214f-63f0-4d06-8aaa-d2276f086e95', 'Almond'],
  ['a3352caa-08c1-4101-baca-80195c2fa266', 'Basmati Rice'],
  ['a807c6c9-db51-49fa-bdba-20f67c34317b', 'Beans'],
  ['54b75628-2f83-423a-ba73-ad8e14382cbc', 'Besan'],
  ['467f51c1-8640-4c0c-beff-41f5e64c4be6', 'Biryani Masala'],
  ['4605d992-be47-4e31-9b27-f2c52c90c369', 'Black Pepper'],
  ['1d451e73-a233-4e83-9dfe-c43f398ed20e', 'Bread'],
  ['b064289a-2ef3-4512-9394-5d9a4318b60f', 'Butter'],
  ['13053f82-9735-474f-b18f-969605d90d04', 'Capsicum'],
  ['5c070113-ebad-4e3f-b627-de96095838b0', 'Cardamom'],
  ['3b883019-e758-4ed5-89b4-6c172f720ed5', 'Cardamom Powder'],
  ['8bf3e5f2-b820-4e11-9ab3-279a0cac7b8b', 'Carrot'],
  ['f17ce0b6-1df4-4735-a6a8-a484b179c3e7', 'Cashew'],
  ['24bd496f-ffeb-4fa7-b8d5-d9f6b723bcfb', 'Cauliflower'],
  ['1b8d4910-e7a9-4e81-b82a-efbfae187417', 'Cheddar Cheese'],
  ['3d18bc2a-724a-41c7-9ff1-2b442110cd93', 'Chicken'],
  ['b3b4ac1b-a184-4834-90c8-698f04aa0583', 'Chicken 67'],
  ['2363376f-f9eb-4f86-8043-8695b4487c58', 'Chicken Breast Boneless'],
  ['69e936b0-4769-4c45-99c5-72813931e920', 'Chickpeas'],
  ['1a22c848-bedc-4741-abf1-d04f04d37fbc', 'Chilli Powder'],
  ['89725c8b-5940-41d1-8681-6a54099888af', 'Chilli Sauce'],
  ['92833b89-eb94-4a47-a6dd-2d1e2efda050', 'Cinnamon'],
  ['4720510f-e543-4df7-8e8f-696958493c55', 'Cloves'],
  ['327cafb8-79a2-4bf6-ae30-532ca06dcd15', 'Cocoa Powder'],
  ['7f19369b-a055-4272-8878-189ce4d96867', 'Coconut'],
  ['1f781b95-b26d-4d9b-b93e-ab92896af8a4', 'Coconut Chutney'],
  ['f98b784a-fa02-4059-aa13-e3dcf9833e44', 'Coriander'],
  ['0819a5c3-401f-4739-9ab1-e2bdc5021b33', 'Coriander Powder'],
  ['515652ce-704e-4eaf-a0b2-00f82ede99ca', 'Corn'],
  ['802da261-476a-449d-999d-facc2f01595a', 'Corn Flour'],
  ['0cf9977a-935f-4bda-9093-6540c6854e83', 'Cream'],
  ['db1a548e-f5aa-4f2b-ade1-21c64863e8c9', 'Cumin'],
  ['cb90a8de-9fb1-4bbd-9c75-ce3f609a86ae', 'Curd'],
  ['ad66eb89-9bbc-4708-b0a9-94131666af4e', 'Curry Leaves'],
  ['590a510b-d52d-42b4-9851-ef38f0121b1a', 'Dosa Batter'],
  ['50fa9427-9ab2-4bd4-9695-ebf3763277a0', 'Egg'],
  ['1b9d6aa1-3a81-4edc-a6ab-fe6693a4d4b5', 'Fish'],
  ['b114cafe-395a-46af-b9c1-a2da4f91aa94', 'Food Color'],
  ['6141864d-8e65-429e-98b9-2a3ad7a06e48', 'Garam Masala'],
  ['4510a817-9815-4737-941c-ce9308941078', 'Garlic'],
  ['288be0f7-d718-47e0-a703-e20089caef3c', 'Ghee'],
  ['97ae84a1-ad9e-457f-8518-004df45db59c', 'Ginger'],
  ['a457d0d3-5e46-4ba9-8bbe-6ddfecd21065', 'Ginger Garlic Paste'],
  ['b4c1dc21-5617-4f94-b9db-ef0bbb317bbd', 'Green Chilli'],
  ['fe1fe13a-e8ca-41ed-9881-cb84783772b7', 'Green Chutney'],
  ['1b6f0c23-be59-4fe4-90fb-9730cc6838bb', 'Green Peas'],
  ['45dc4bab-a4d7-440d-8796-e8158a32d04f', 'Jalebi Batter'],
  ['909530de-ac23-4cf3-ac72-a6acbeb3ecd8', 'Kasuri Methi'],
  ['2a703952-30ce-4035-bb13-d0ec0785034d', 'Khoya'],
  ['2bf10e00-9a73-4087-83aa-d58debe17aae', 'Lemon'],
  ['171f8de9-655b-48fd-96d1-f27a13170772', 'Maida'],
  ['29d939bf-0dbe-4217-b70a-e1d9d1456bb7', 'Mango'],
  ['6858523c-030f-4dc0-9509-ba756f705a19', 'Milk'],
  ['a8e38445-ba08-46e4-8eb9-8b394fa17c38', 'Mineral Water'],
  ['4ee86cc9-4b5b-43f1-92a7-fb17ddc9b69d', 'Mint'],
  ['747e2e7b-448c-4561-9e8b-f49e70536719', 'Mint Chutney'],
  ['8308c482-018d-4592-aff4-62bc8cf3919d', 'Moong Dal'],
  ['76a17001-d45f-4b00-b597-8243b88397ce', 'Mozzarella Cheese'],
  ['fe257d27-9bd5-45fd-be25-7df63a139e0d', 'Mutton'],
  ['4ddb8f99-8f60-4f89-86f0-85e3b8bc820f', 'Oil'],
  ['e08e7912-c868-41a8-8d07-8a83389067cd', 'Onion'],
  ['405e5c19-b664-4c41-b435-15f26b6772e4', 'onions'],
  ['41de9030-7d79-4a1d-b790-c9693dc68b2b', 'Paneer'],
  ['04323d81-6745-47ad-84c5-8c4bb4af06a1', 'Pani'],
  ['454b2aef-d8d1-4806-bd6b-ecdbc4bed5fd', 'Papdi'],
  ['2e9aecd5-327d-4678-a1f3-eb9b59c3ce8c', 'Pav'],
  ['9a49345e-53c9-4e5a-b5b0-eab58ec0a94b', 'Potato'],
  ['7209ecb9-b50c-4eb6-b226-deb454e5f544', 'Potato Masala'],
  ['19ca298e-1ca0-42b2-8fe3-0b3eabdc937d', 'Puffed Rice'],
  ['6ea6fd7e-e07e-4ed8-a2e8-9d4f09c8c1b1', 'Rajma'],
  ['e5b37d09-a77a-4ea8-8d96-7371690a6084', 'Rava'],
  ['145fc469-3b10-4ce9-b345-af98e0bf76bf', 'Regular Rice'],
  ['88e5b278-47fd-40b0-acec-24893306c379', 'Rice'],
  ['dfee5a9e-acd6-49ca-a7bf-216b74c882f2', 'Saffron'],
  ['15eb3012-0d5b-4ae9-b0d1-6ac8841696cc', 'Salt'],
  ['be5eea0d-b3cc-4143-9588-9577191f1158', 'Sambar'],
  ['32ad1499-da7f-4309-8010-c53ad25a91dc', 'Sev'],
  ['80443489-a47c-4c88-bd3b-cfdcd9c26fff', 'Soy Sauce'],
  ['b4fb912e-46c2-431f-ade3-1e86bd5904d7', 'Spinach'],
  ['db0389bf-ad03-47ba-baad-c3ea027f5d0a', 'Sugar'],
  ['edb8de05-0a0f-4aff-8006-f1528a53418b', 'Tamarind'],
  ['fbc37f9c-c216-463d-bd79-d91f0c2528f7', 'Tamarind Chutney'],
  ['cf27ad73-0beb-4106-9cc1-cfabcc841282', 'Tandoori Masala'],
  ['1903a1f5-50ea-4eb4-a5e2-edfe4db47689', 'Tomato'],
  ['ad6fb94a-b4a6-4426-a029-b5b113b55404', 'Tomato Chutney'],
  ['af490312-bb20-4830-a0a7-df4a1da4865a', 'tomoto'],
  ['97a5df3b-6388-4484-a00c-7b9e8729f4db', 'Toor Dal'],
  ['c07bee00-1af1-4067-92c2-e28b75f58642', 'Turmeric Powder'],
  ['8adc2591-97b6-40ec-8e27-5dd6654e4da7', 'Urad Dal'],
  ['430ec219-2a52-40fa-82b1-319e6f17de09', 'Vinegar'],
  ['18b826c3-18dd-482f-835c-1d9fef9124f9', 'Wheat Flour'],
  ['7d54b6eb-3c1b-4280-ba06-9534cd0e6b14', 'Yogurt'],
];

const DEFAULT_WAREHOUSE_ID = '1b88b4d7-4caa-467a-89e0-0eedafd9b059';
const INDIRANAGAR_ID = 'd1a7c4b0-1001-4a2b-8c3d-111111111111';
const WHITEFIELD_ID = 'd1a7c4b0-1002-4a2b-8c3d-222222222222';
const KORAMANGALA_ID = 'd1a7c4b0-1003-4a2b-8c3d-333333333333';

const OPS_USER_ID = 'a0000000-0000-4000-8000-000000000003';
const IND_ADMIN_ID = 'a0000000-0000-4000-8000-000000000004';
const WFD_ADMIN_ID = 'a0000000-0000-4000-8000-000000000005';
const KRM_ADMIN_ID = 'a0000000-0000-4000-8000-000000000006';

async function resolveWarehouseId(): Promise<string> {
  if (process.env.WAREHOUSE_ID) return process.env.WAREHOUSE_ID;

  const orgUrl = process.env.ORGANIZATION_DATABASE_URL;
  if (!orgUrl) return DEFAULT_WAREHOUSE_ID;

  const pool = new pg.Pool({ connectionString: orgUrl });
  try {
    const res = await pool.query<{ id: string }>(
      'SELECT id FROM "Franchise" ORDER BY "createdAt" ASC LIMIT 1',
    );
    if (res.rows[0]?.id) {
      console.log(`Resolved franchise/warehouse ID from ORGANIZATION_DATABASE_URL: ${res.rows[0].id}`);
      return res.rows[0].id;
    }
  } finally {
    await pool.end();
  }
  return DEFAULT_WAREHOUSE_ID;
}

async function resolveIngredientMap(): Promise<Map<string, string>> {
  const catalogUrl = process.env.CATALOG_DATABASE_URL;
  if (catalogUrl) {
    const pool = new pg.Pool({ connectionString: catalogUrl });
    try {
      const res = await pool.query<{ id: string; name: string }>(
        'SELECT id, name FROM "Ingredient" WHERE "isActive" = true',
      );
      if (res.rows.length > 0) {
        const liveByName = new Map<string, string>();
        for (const row of res.rows) {
          liveByName.set(row.name.toLowerCase(), row.id);
        }
        console.log(
          `Resolved ${res.rows.length} live ingredient IDs from CATALOG_DATABASE_URL.`,
        );
        return liveByName;
      }
    } finally {
      await pool.end();
    }
  }

  const byName = new Map<string, string>();
  for (const [id, name] of FALLBACK_INGREDIENTS) {
    byName.set(name.toLowerCase(), id);
  }
  return byName;
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function ing(map: Map<string, string>, name: string): string {
  const id = map.get(name.toLowerCase());
  if (!id) throw new Error(`Missing ingredient mapping for "${name}"`);
  return id;
}

async function main(): Promise<void> {
  console.log('Seeding inventory-service...');
  const WAREHOUSE_ID = await resolveWarehouseId();
  const ingredientMap = await resolveIngredientMap();
  const uniqueIngredients = [...new Set(ingredientMap.values())];

  // 1. Warehouse Stock (prune stale/fallback ingredients first so Catalog bulk-lookup matches 100%)
  await prisma.warehouseStock.deleteMany({
    where: {
      warehouseId: WAREHOUSE_ID,
      ingredientId: { notIn: uniqueIngredients },
    },
  });

  await prisma.$transaction(
    uniqueIngredients.map((ingredientId) =>
      prisma.warehouseStock.upsert({
        where: {
          warehouseId_ingredientId: {
            warehouseId: WAREHOUSE_ID,
            ingredientId,
          },
        },
        create: {
          warehouseId: WAREHOUSE_ID,
          ingredientId,
          quantityOnHand: new Prisma.Decimal('1000.0000'),
        },
        update: {
          quantityOnHand: new Prisma.Decimal('1000.0000'),
        },
      }),
    ),
  );

  // 2. Restaurant Stock (healthy + deliberate low-stock items for showcase)
  const stockDefinitions: Array<{
    restaurantId: string;
    ingredient: string;
    qty: string;
    reorderLevel: string;
    reorderQty: string;
  }> = [
    // Indiranagar
    { restaurantId: INDIRANAGAR_ID, ingredient: 'Basmati Rice', qty: '65.0000', reorderLevel: '20.0000', reorderQty: '50.0000' },
    { restaurantId: INDIRANAGAR_ID, ingredient: 'Rice', qty: '48.0000', reorderLevel: '15.0000', reorderQty: '40.0000' },
    { restaurantId: INDIRANAGAR_ID, ingredient: 'Dosa Batter', qty: '28.0000', reorderLevel: '12.0000', reorderQty: '30.0000' },
    { restaurantId: INDIRANAGAR_ID, ingredient: 'Paneer', qty: '3.5000', reorderLevel: '10.0000', reorderQty: '25.0000' },
    { restaurantId: INDIRANAGAR_ID, ingredient: 'Butter', qty: '2.0000', reorderLevel: '8.0000', reorderQty: '15.0000' },
    { restaurantId: INDIRANAGAR_ID, ingredient: 'Cream', qty: '1.5000', reorderLevel: '6.0000', reorderQty: '12.0000' },
    { restaurantId: INDIRANAGAR_ID, ingredient: 'Chicken', qty: '34.0000', reorderLevel: '15.0000', reorderQty: '30.0000' },
    { restaurantId: INDIRANAGAR_ID, ingredient: 'Onion', qty: '42.0000', reorderLevel: '15.0000', reorderQty: '40.0000' },
    { restaurantId: INDIRANAGAR_ID, ingredient: 'Tomato', qty: '36.0000', reorderLevel: '15.0000', reorderQty: '35.0000' },
    { restaurantId: INDIRANAGAR_ID, ingredient: 'Oil', qty: '45.0000', reorderLevel: '15.0000', reorderQty: '30.0000' },
    { restaurantId: INDIRANAGAR_ID, ingredient: 'Ghee', qty: '14.0000', reorderLevel: '5.0000', reorderQty: '12.0000' },
    { restaurantId: INDIRANAGAR_ID, ingredient: 'Sambar', qty: '22.0000', reorderLevel: '8.0000', reorderQty: '20.0000' },
    { restaurantId: INDIRANAGAR_ID, ingredient: 'Coconut Chutney', qty: '15.0000', reorderLevel: '5.0000', reorderQty: '12.0000' },
    // Whitefield
    { restaurantId: WHITEFIELD_ID, ingredient: 'Basmati Rice', qty: '9.0000', reorderLevel: '20.0000', reorderQty: '50.0000' },
    { restaurantId: WHITEFIELD_ID, ingredient: 'Chicken', qty: '12.0000', reorderLevel: '15.0000', reorderQty: '35.0000' },
    { restaurantId: WHITEFIELD_ID, ingredient: 'Paneer', qty: '18.0000', reorderLevel: '10.0000', reorderQty: '25.0000' },
    { restaurantId: WHITEFIELD_ID, ingredient: 'Dosa Batter', qty: '24.0000', reorderLevel: '12.0000', reorderQty: '30.0000' },
    { restaurantId: WHITEFIELD_ID, ingredient: 'Onion', qty: '31.0000', reorderLevel: '15.0000', reorderQty: '40.0000' },
    { restaurantId: WHITEFIELD_ID, ingredient: 'Tomato', qty: '27.0000', reorderLevel: '15.0000', reorderQty: '35.0000' },
    { restaurantId: WHITEFIELD_ID, ingredient: 'Oil', qty: '32.0000', reorderLevel: '15.0000', reorderQty: '30.0000' },
    { restaurantId: WHITEFIELD_ID, ingredient: 'Wheat Flour', qty: '38.0000', reorderLevel: '12.0000', reorderQty: '30.0000' },
    // Koramangala
    { restaurantId: KORAMANGALA_ID, ingredient: 'Dosa Batter', qty: '6.0000', reorderLevel: '15.0000', reorderQty: '35.0000' },
    { restaurantId: KORAMANGALA_ID, ingredient: 'Basmati Rice', qty: '54.0000', reorderLevel: '20.0000', reorderQty: '50.0000' },
    { restaurantId: KORAMANGALA_ID, ingredient: 'Paneer', qty: '22.0000', reorderLevel: '10.0000', reorderQty: '25.0000' },
    { restaurantId: KORAMANGALA_ID, ingredient: 'Chicken', qty: '29.0000', reorderLevel: '15.0000', reorderQty: '30.0000' },
    { restaurantId: KORAMANGALA_ID, ingredient: 'Butter', qty: '14.0000', reorderLevel: '8.0000', reorderQty: '15.0000' },
    { restaurantId: KORAMANGALA_ID, ingredient: 'Milk', qty: '30.0000', reorderLevel: '12.0000', reorderQty: '25.0000' },
    { restaurantId: KORAMANGALA_ID, ingredient: 'Sugar', qty: '25.0000', reorderLevel: '10.0000', reorderQty: '20.0000' },
  ];

  for (const s of stockDefinitions) {
    const ingredientId = ing(ingredientMap, s.ingredient);
    await prisma.restaurantStock.upsert({
      where: {
        restaurantId_ingredientId: {
          restaurantId: s.restaurantId,
          ingredientId,
        },
      },
      create: {
        restaurantId: s.restaurantId,
        ingredientId,
        quantityOnHand: new Prisma.Decimal(s.qty),
        reorderLevel: new Prisma.Decimal(s.reorderLevel),
        reorderQuantity: new Prisma.Decimal(s.reorderQty),
      },
      update: {
        quantityOnHand: new Prisma.Decimal(s.qty),
        reorderLevel: new Prisma.Decimal(s.reorderLevel),
        reorderQuantity: new Prisma.Decimal(s.reorderQty),
      },
    });
  }

  // 3. Stock Requests
  const requests = [
    {
      id: 'd2000000-0000-4000-8000-000000000001',
      restaurantId: INDIRANAGAR_ID,
      warehouseId: WAREHOUSE_ID,
      requestedBy: IND_ADMIN_ID,
      approvedBy: null,
      rejectedBy: null,
      status: StockRequestStatus.REQUESTED,
      reason: 'Weekend dinner rush replenishment for dairy & paneer curries',
      rejectionReason: null,
      requestedAt: hoursAgo(1.5),
      approvedAt: null,
      rejectedAt: null,
      fulfilledAt: null,
      items: [
        { id: 'd3000000-0000-4000-8000-000000000001', ingredient: 'Paneer', requestedQty: '25.0000', approvedQty: null },
        { id: 'd3000000-0000-4000-8000-000000000002', ingredient: 'Butter', requestedQty: '15.0000', approvedQty: null },
        { id: 'd3000000-0000-4000-8000-000000000003', ingredient: 'Cream', requestedQty: '12.0000', approvedQty: null },
      ],
    },
    {
      id: 'd2000000-0000-4000-8000-000000000002',
      restaurantId: WHITEFIELD_ID,
      warehouseId: WAREHOUSE_ID,
      requestedBy: WFD_ADMIN_ID,
      approvedBy: OPS_USER_ID,
      rejectedBy: null,
      status: StockRequestStatus.APPROVED,
      reason: 'Approved mid-week biryani & grill stock-up',
      rejectionReason: null,
      requestedAt: hoursAgo(8),
      approvedAt: hoursAgo(4),
      rejectedAt: null,
      fulfilledAt: null,
      items: [
        { id: 'd3000000-0000-4000-8000-000000000004', ingredient: 'Basmati Rice', requestedQty: '50.0000', approvedQty: '50.0000' },
        { id: 'd3000000-0000-4000-8000-000000000005', ingredient: 'Chicken', requestedQty: '35.0000', approvedQty: '30.0000' },
      ],
    },
    {
      id: 'd2000000-0000-4000-8000-000000000003',
      restaurantId: KORAMANGALA_ID,
      warehouseId: WAREHOUSE_ID,
      requestedBy: KRM_ADMIN_ID,
      approvedBy: OPS_USER_ID,
      rejectedBy: null,
      status: StockRequestStatus.FULFILLED,
      reason: 'Weekly staples restock',
      rejectionReason: null,
      requestedAt: daysAgo(3),
      approvedAt: daysAgo(3),
      rejectedAt: null,
      fulfilledAt: daysAgo(2),
      items: [
        { id: 'd3000000-0000-4000-8000-000000000006', ingredient: 'Basmati Rice', requestedQty: '40.0000', approvedQty: '40.0000' },
        { id: 'd3000000-0000-4000-8000-000000000007', ingredient: 'Oil', requestedQty: '25.0000', approvedQty: '25.0000' },
      ],
    },
    {
      id: 'd2000000-0000-4000-8000-000000000004',
      restaurantId: INDIRANAGAR_ID,
      warehouseId: WAREHOUSE_ID,
      requestedBy: IND_ADMIN_ID,
      approvedBy: null,
      rejectedBy: OPS_USER_ID,
      status: StockRequestStatus.REJECTED,
      reason: 'Duplicate saffron request',
      rejectionReason: 'Duplicate request — already included in morning dispatch',
      requestedAt: daysAgo(4),
      approvedAt: null,
      rejectedAt: daysAgo(4),
      fulfilledAt: null,
      items: [
        { id: 'd3000000-0000-4000-8000-000000000008', ingredient: 'Saffron', requestedQty: '1.0000', approvedQty: null },
      ],
    },
  ];

  for (const req of requests) {
    await prisma.stockRequest.upsert({
      where: { id: req.id },
      update: {},
      create: {
        id: req.id,
        restaurantId: req.restaurantId,
        warehouseId: req.warehouseId,
        requestedBy: req.requestedBy,
        approvedBy: req.approvedBy,
        rejectedBy: req.rejectedBy,
        status: req.status,
        reason: req.reason,
        rejectionReason: req.rejectionReason,
        requestedAt: req.requestedAt,
        approvedAt: req.approvedAt,
        rejectedAt: req.rejectedAt,
        fulfilledAt: req.fulfilledAt,
      },
    });

    for (const item of req.items) {
      await prisma.stockRequestItem.upsert({
        where: { id: item.id },
        update: {},
        create: {
          id: item.id,
          stockRequestId: req.id,
          ingredientId: ing(ingredientMap, item.ingredient),
          requestedQty: new Prisma.Decimal(item.requestedQty),
          approvedQty: item.approvedQty ? new Prisma.Decimal(item.approvedQty) : null,
        },
      });
    }
  }

  // 4. Stock Transfers + Shipments + Transit + Discrepancy
  const completedTransferId = 'd4000000-0000-4000-8000-000000000001';
  const inTransitTransferId = 'd4000000-0000-4000-8000-000000000002';
  const disputedTransferId = 'd4000000-0000-4000-8000-000000000003';
  const approvedTransferId = 'd4000000-0000-4000-8000-000000000004';

  const transfers = [
    {
      id: completedTransferId,
      stockRequestId: 'd2000000-0000-4000-8000-000000000003',
      fromWarehouseId: WAREHOUSE_ID,
      toRestaurantId: KORAMANGALA_ID,
      status: TransferStatus.COMPLETED,
      requestedBy: KRM_ADMIN_ID,
      approvedBy: OPS_USER_ID,
      shippedBy: OPS_USER_ID,
      receivedBy: KRM_ADMIN_ID,
      requestedAt: daysAgo(3),
      approvedAt: daysAgo(3),
      shippedAt: daysAgo(2),
      receivedAt: daysAgo(2),
      completedAt: daysAgo(2),
      items: [
        { id: 'd5000000-0000-4000-8000-000000000001', ingredient: 'Basmati Rice', req: '40.0000', app: '40.0000', ship: '40.0000', rec: '40.0000' },
        { id: 'd5000000-0000-4000-8000-000000000002', ingredient: 'Oil', req: '25.0000', app: '25.0000', ship: '25.0000', rec: '25.0000' },
      ],
      shipment: {
        id: 'd6000000-0000-4000-8000-000000000001',
        carrierName: 'FoodMatrix ColdChain',
        trackingNumber: 'FM-BLR-1988',
        shipperName: 'Ramesh Rao',
        shipperPhone: '+919845000101',
        driverName: 'Prakash Gowda',
        driverPhone: '+919845000201',
        vehicleNumber: 'KA-01-FM-4412',
        vehicleType: 'Insulated Van',
        dispatchLocation: 'Peenya Central Warehouse, Bengaluru',
        deliveryLocation: 'FoodMatrix Koramangala, 80 Feet Road',
        estimatedArrival: daysAgo(2),
        dispatchedAt: daysAgo(2),
        deliveredAt: daysAgo(2),
        notes: 'Delivered intact with signed POD.',
      },
    },
    {
      id: inTransitTransferId,
      stockRequestId: null,
      fromWarehouseId: WAREHOUSE_ID,
      toRestaurantId: INDIRANAGAR_ID,
      status: TransferStatus.IN_TRANSIT,
      requestedBy: IND_ADMIN_ID,
      approvedBy: OPS_USER_ID,
      shippedBy: OPS_USER_ID,
      receivedBy: null,
      requestedAt: hoursAgo(6),
      approvedAt: hoursAgo(5),
      shippedAt: hoursAgo(2),
      receivedAt: null,
      completedAt: null,
      items: [
        { id: 'd5000000-0000-4000-8000-000000000003', ingredient: 'Onion', req: '30.0000', app: '30.0000', ship: '30.0000', rec: null },
        { id: 'd5000000-0000-4000-8000-000000000004', ingredient: 'Tomato', req: '25.0000', app: '25.0000', ship: '25.0000', rec: null },
      ],
      shipment: {
        id: 'd6000000-0000-4000-8000-000000000002',
        carrierName: 'FoodMatrix ColdChain',
        trackingNumber: 'FM-BLR-2041',
        shipperName: 'Ramesh Rao',
        shipperPhone: '+919845000101',
        driverName: 'Mahesh Naik',
        driverPhone: '+919845000202',
        vehicleNumber: 'KA-03-FM-8821',
        vehicleType: 'Refrigerated Tempo',
        dispatchLocation: 'Peenya Central Warehouse, Bengaluru',
        deliveryLocation: 'FoodMatrix Indiranagar, 100 Feet Road',
        estimatedArrival: hoursAgo(-1),
        dispatchedAt: hoursAgo(2),
        deliveredAt: null,
        notes: 'En route via Outer Ring Road.',
      },
    },
    {
      id: disputedTransferId,
      stockRequestId: null,
      fromWarehouseId: WAREHOUSE_ID,
      toRestaurantId: WHITEFIELD_ID,
      status: TransferStatus.DISPUTED,
      requestedBy: WFD_ADMIN_ID,
      approvedBy: OPS_USER_ID,
      shippedBy: OPS_USER_ID,
      receivedBy: WFD_ADMIN_ID,
      requestedAt: daysAgo(1),
      approvedAt: daysAgo(1),
      shippedAt: hoursAgo(12),
      receivedAt: hoursAgo(3),
      completedAt: null,
      items: [
        { id: 'd5000000-0000-4000-8000-000000000005', ingredient: 'Basmati Rice', req: '40.0000', app: '40.0000', ship: '40.0000', rec: '36.0000' },
      ],
      shipment: {
        id: 'd6000000-0000-4000-8000-000000000003',
        carrierName: 'FoodMatrix ColdChain',
        trackingNumber: 'FM-BLR-2035',
        shipperName: 'Ramesh Rao',
        shipperPhone: '+919845000101',
        driverName: 'Vinay Kumar',
        driverPhone: '+919845000203',
        vehicleNumber: 'KA-05-FM-3309',
        vehicleType: 'Mini Truck',
        dispatchLocation: 'Peenya Central Warehouse, Bengaluru',
        deliveryLocation: 'FoodMatrix Whitefield, ITPL Main Road',
        estimatedArrival: hoursAgo(4),
        dispatchedAt: hoursAgo(12),
        deliveredAt: hoursAgo(3),
        notes: 'One 4 kg sack missing at unloading.',
      },
    },
    {
      id: approvedTransferId,
      stockRequestId: 'd2000000-0000-4000-8000-000000000002',
      fromWarehouseId: WAREHOUSE_ID,
      toRestaurantId: WHITEFIELD_ID,
      status: TransferStatus.APPROVED,
      requestedBy: WFD_ADMIN_ID,
      approvedBy: OPS_USER_ID,
      shippedBy: null,
      receivedBy: null,
      requestedAt: hoursAgo(8),
      approvedAt: hoursAgo(4),
      shippedAt: null,
      receivedAt: null,
      completedAt: null,
      items: [
        { id: 'd5000000-0000-4000-8000-000000000006', ingredient: 'Basmati Rice', req: '50.0000', app: '50.0000', ship: null, rec: null },
        { id: 'd5000000-0000-4000-8000-000000000007', ingredient: 'Chicken', req: '35.0000', app: '30.0000', ship: null, rec: null },
      ],
      shipment: null,
    },
  ];

  for (const t of transfers) {
    await prisma.stockTransfer.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        stockRequestId: t.stockRequestId,
        fromWarehouseId: t.fromWarehouseId,
        toRestaurantId: t.toRestaurantId,
        status: t.status,
        requestedBy: t.requestedBy,
        approvedBy: t.approvedBy,
        shippedBy: t.shippedBy,
        receivedBy: t.receivedBy,
        requestedAt: t.requestedAt,
        approvedAt: t.approvedAt,
        shippedAt: t.shippedAt,
        receivedAt: t.receivedAt,
        completedAt: t.completedAt,
      },
    });

    for (const item of t.items) {
      await prisma.stockTransferItem.upsert({
        where: { id: item.id },
        update: {},
        create: {
          id: item.id,
          transferId: t.id,
          ingredientId: ing(ingredientMap, item.ingredient),
          requestedQty: new Prisma.Decimal(item.req),
          approvedQty: item.app ? new Prisma.Decimal(item.app) : null,
          shippedQty: item.ship ? new Prisma.Decimal(item.ship) : null,
          receivedQty: item.rec ? new Prisma.Decimal(item.rec) : null,
        },
      });
    }

    if (t.shipment) {
      await prisma.shipment.upsert({
        where: { id: t.shipment.id },
        update: {},
        create: {
          ...t.shipment,
          transferId: t.id,
        },
      });
    }
  }

  // Transit rows for IN_TRANSIT transfer
  await prisma.inventoryTransit.upsert({
    where: {
      transferId_ingredientId: {
        transferId: inTransitTransferId,
        ingredientId: ing(ingredientMap, 'Onion'),
      },
    },
    update: {},
    create: {
      id: 'd7000000-0000-4000-8000-000000000001',
      transferId: inTransitTransferId,
      ingredientId: ing(ingredientMap, 'Onion'),
      quantity: new Prisma.Decimal('30.0000'),
    },
  });

  await prisma.inventoryTransit.upsert({
    where: {
      transferId_ingredientId: {
        transferId: inTransitTransferId,
        ingredientId: ing(ingredientMap, 'Tomato'),
      },
    },
    update: {},
    create: {
      id: 'd7000000-0000-4000-8000-000000000002',
      transferId: inTransitTransferId,
      ingredientId: ing(ingredientMap, 'Tomato'),
      quantity: new Prisma.Decimal('25.0000'),
    },
  });

  // Discrepancy for DISPUTED transfer
  await prisma.transferDiscrepancy.upsert({
    where: { id: 'd8000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: 'd8000000-0000-4000-8000-000000000001',
      transferId: disputedTransferId,
      transferItemId: 'd5000000-0000-4000-8000-000000000005',
      type: TransferDiscrepancyType.SHORT_RECEIPT,
      expectedQty: new Prisma.Decimal('40.0000'),
      actualQty: new Prisma.Decimal('36.0000'),
      reason: '4 kg bag torn and left at loading bay',
      reportedBy: WFD_ADMIN_ID,
    },
  });

  // 5. Stock Movements (Audit Trail)
  const movements = [
    {
      id: 'd9000000-0000-4000-8000-000000000001',
      locationType: LocationType.WAREHOUSE,
      locationId: WAREHOUSE_ID,
      ingredient: 'Basmati Rice',
      movementType: MovementType.PURCHASE,
      quantityChange: '500.0000',
      referenceId: 'PO-2026-1101',
      reason: 'Monthly supplier procurement — India Gate Foods',
      createdAt: daysAgo(5),
    },
    {
      id: 'd9000000-0000-4000-8000-000000000002',
      locationType: LocationType.WAREHOUSE,
      locationId: WAREHOUSE_ID,
      ingredient: 'Basmati Rice',
      movementType: MovementType.TRANSFER_OUT,
      quantityChange: '-40.0000',
      referenceId: completedTransferId,
      reason: 'Dispatched to FoodMatrix Koramangala',
      createdAt: daysAgo(2),
    },
    {
      id: 'd9000000-0000-4000-8000-000000000003',
      locationType: LocationType.RESTAURANT,
      locationId: KORAMANGALA_ID,
      ingredient: 'Basmati Rice',
      movementType: MovementType.TRANSFER_IN,
      quantityChange: '40.0000',
      referenceId: completedTransferId,
      reason: 'Received from Central Warehouse',
      createdAt: daysAgo(2),
    },
    {
      id: 'd9000000-0000-4000-8000-000000000004',
      locationType: LocationType.RESTAURANT,
      locationId: INDIRANAGAR_ID,
      ingredient: 'Paneer',
      movementType: MovementType.POS_SALE,
      quantityChange: '-2.4000',
      referenceId: 'c1000000-0000-4000-8000-000000000001',
      reason: 'Kitchen preparation consumption',
      createdAt: hoursAgo(6),
    },
    {
      id: 'd9000000-0000-4000-8000-000000000005',
      locationType: LocationType.RESTAURANT,
      locationId: INDIRANAGAR_ID,
      ingredient: 'Cream',
      movementType: MovementType.WASTE,
      quantityChange: '-0.8000',
      referenceId: 'da000000-0000-4000-8000-000000000001',
      reason: 'Expired dairy batch discarded during morning check',
      createdAt: daysAgo(1),
    },
    {
      id: 'd9000000-0000-4000-8000-000000000006',
      locationType: LocationType.RESTAURANT,
      locationId: WHITEFIELD_ID,
      ingredient: 'Chicken',
      movementType: MovementType.ADJUSTMENT,
      quantityChange: '-1.2000',
      referenceId: 'AUD-WFD-011',
      reason: 'Physical cycle count trim & reconciliation',
      createdAt: daysAgo(1),
    },
  ];

  for (const m of movements) {
    await prisma.stockMovement.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id,
        locationType: m.locationType,
        locationId: m.locationId,
        ingredientId: ing(ingredientMap, m.ingredient),
        movementType: m.movementType,
        quantityChange: new Prisma.Decimal(m.quantityChange),
        referenceId: m.referenceId,
        reason: m.reason,
        createdAt: m.createdAt,
      },
    });
  }

  // 6. Waste Logs
  const wasteLogs = [
    {
      id: 'da000000-0000-4000-8000-000000000001',
      restaurantId: INDIRANAGAR_ID,
      ingredient: 'Cream',
      qty: '0.8000',
      reason: 'Expired dairy batch discarded during morning audit',
      createdAt: daysAgo(1),
    },
    {
      id: 'da000000-0000-4000-8000-000000000002',
      restaurantId: INDIRANAGAR_ID,
      ingredient: 'Tomato',
      qty: '1.5000',
      reason: 'Bruised tomatoes sorted out before prep',
      createdAt: daysAgo(2),
    },
    {
      id: 'da000000-0000-4000-8000-000000000003',
      restaurantId: WHITEFIELD_ID,
      ingredient: 'Dosa Batter',
      qty: '2.2000',
      reason: 'Over-fermented batter batch discarded',
      createdAt: daysAgo(1),
    },
    {
      id: 'da000000-0000-4000-8000-000000000004',
      restaurantId: KORAMANGALA_ID,
      ingredient: 'Milk',
      qty: '1.0000',
      reason: 'Spillage near beverage counter',
      createdAt: hoursAgo(9),
    },
  ];

  for (const w of wasteLogs) {
    await prisma.wasteLog.upsert({
      where: { id: w.id },
      update: {},
      create: {
        id: w.id,
        restaurantId: w.restaurantId,
        ingredientId: ing(ingredientMap, w.ingredient),
        qty: new Prisma.Decimal(w.qty),
        reason: w.reason,
        createdAt: w.createdAt,
      },
    });
  }

  console.log(
    `Inventory seed complete: ${uniqueIngredients.length} warehouse items, ${stockDefinitions.length} restaurant stock rows, ${requests.length} requests, ${transfers.length} transfers, ${movements.length} movements, ${wasteLogs.length} waste logs.`,
  );
}

async function run(): Promise<void> {
  try {
    await main();
  } catch (error: unknown) {
    console.error('Inventory seed failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void run();
