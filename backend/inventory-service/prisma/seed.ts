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

type IngredientSeed = readonly [ingredientId: string, name: string];

const ingredients: IngredientSeed[] = [
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

const WAREHOUSE_ID = '1b88b4d7-4caa-467a-89e0-0eedafd9b059';

async function main(): Promise<void> {
  console.log('Starting warehouse inventory seed...');

  const ingredientIds = ingredients.map(([id]) => id);

  if (
    ingredients.length !== 92 ||
    new Set(ingredientIds).size !== ingredients.length
  ) {
    throw new Error('Expected exactly 92 unique ingredient IDs');
  }

  await prisma.$transaction(
    ingredients.map(([ingredientId]) =>
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
          quantityOnHand: new Prisma.Decimal('10000.0000'),
        },
        update: {
          quantityOnHand: new Prisma.Decimal('10000.0000'),
        },
      }),
    ),
  );

  const total = await prisma.warehouseStock.count({
    where: {
      warehouseId: WAREHOUSE_ID,
    },
  });

  console.log(`Warehouse / Franchise: ${WAREHOUSE_ID}`);
  console.log(`Ingredients seeded: ${ingredients.length}`);
  console.log(`Warehouse stock records: ${total}`);
  console.log('Each seeded ingredient balance is 10,000 Catalog units.');
}

async function run(): Promise<void> {
  try {
    await main();
  } catch (error: unknown) {
    console.error('Warehouse seed failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void run();
