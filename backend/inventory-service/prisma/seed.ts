import 'dotenv/config';

import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is missing in .env');
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

// ============================================================
// CONSTANTS
// ============================================================

const RESTAURANT_ID = '7f3c2a91-6d84-4e17-9b52-1a6f8c3d2047';

// ============================================================
// RESTAURANT STOCK
//
// Exact ingredient IDs from Catalog Service
// ============================================================

const restaurantStocks = [
  {
    restaurantId: RESTAURANT_ID,
    ingredientId: '590a510b-d52d-42b4-9851-ef38f0121b1a', // Dosa Batter
    quantityOnHand: new Prisma.Decimal('10.0000'),
    reorderLevel: new Prisma.Decimal('2.0000'),
    reorderQuantity: new Prisma.Decimal('5.0000'),
  },
  {
    restaurantId: RESTAURANT_ID,
    ingredientId: '288be0f7-d718-47e0-a703-e20089caef3c', // Ghee
    quantityOnHand: new Prisma.Decimal('5.0000'),
    reorderLevel: new Prisma.Decimal('1.0000'),
    reorderQuantity: new Prisma.Decimal('3.0000'),
  },
  {
    restaurantId: RESTAURANT_ID,
    ingredientId: 'be5eea0d-b3cc-4143-9588-9577191f1158', // Sambar
    quantityOnHand: new Prisma.Decimal('5.0000'),
    reorderLevel: new Prisma.Decimal('1.0000'),
    reorderQuantity: new Prisma.Decimal('3.0000'),
  },
  {
    restaurantId: RESTAURANT_ID,
    ingredientId: '1f781b95-b26d-4d9b-b93e-ab92896af8a4', // Coconut Chutney
    quantityOnHand: new Prisma.Decimal('5.0000'),
    reorderLevel: new Prisma.Decimal('1.0000'),
    reorderQuantity: new Prisma.Decimal('3.0000'),
  },
  {
    restaurantId: RESTAURANT_ID,
    ingredientId: '88e5b278-47fd-40b0-acec-24893306c379', // Coconut Chutney
    quantityOnHand: new Prisma.Decimal('50.0000'),
    reorderLevel: new Prisma.Decimal('5.0000'),
    reorderQuantity: new Prisma.Decimal('25.0000'),
  },
];

// ============================================================
// MAIN
// ============================================================

async function main(): Promise<void> {
  console.log('🌱 Starting Inventory seed...');

  for (const stock of restaurantStocks) {
    await prisma.restaurantStock.upsert({
      where: {
        restaurantId_ingredientId: {
          restaurantId: stock.restaurantId,
          ingredientId: stock.ingredientId,
        },
      },

      create: stock,

      update: {
        quantityOnHand: stock.quantityOnHand,
        reorderLevel: stock.reorderLevel,
        reorderQuantity: stock.reorderQuantity,
      },
    });
  }

  console.log('✅ Restaurant stock seeded successfully');

  console.table(
    restaurantStocks.map((stock) => ({
      restaurantId: stock.restaurantId,
      ingredientId: stock.ingredientId,
      quantityOnHand: stock.quantityOnHand.toString(),
      reorderLevel: stock.reorderLevel.toString(),
      reorderQuantity: stock.reorderQuantity.toString(),
    })),
  );
}


// ============================================================
// RUN
// ============================================================

main()
  .catch((error: unknown) => {
    console.error('❌ Inventory seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


