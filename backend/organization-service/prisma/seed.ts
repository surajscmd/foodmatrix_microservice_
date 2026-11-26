import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  RestaurantStatus,
  SystemUserRole,
} from '@prisma/client';
import { hashPassword } from 'better-auth/crypto';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is missing in environment');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

export const FRANCHISE_ID = '1b88b4d7-4caa-467a-89e0-0eedafd9b059';

export const RESTAURANTS = [
  {
    id: 'd1a7c4b0-1001-4a2b-8c3d-111111111111',
    name: 'FoodMatrix Indiranagar',
    address: '100 Feet Road, HAL 2nd Stage, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    timezone: 'Asia/Kolkata',
    status: RestaurantStatus.ACTIVE,
  },
  {
    id: 'd1a7c4b0-1002-4a2b-8c3d-222222222222',
    name: 'FoodMatrix Whitefield',
    address: 'ITPL Main Road, Brookefield, Whitefield',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    timezone: 'Asia/Kolkata',
    status: RestaurantStatus.ACTIVE,
  },
  {
    id: 'd1a7c4b0-1003-4a2b-8c3d-333333333333',
    name: 'FoodMatrix Koramangala',
    address: '80 Feet Road, 4th Block, Koramangala',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    timezone: 'Asia/Kolkata',
    status: RestaurantStatus.ACTIVE,
  },
] as const;

interface DemoUserSeed {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: SystemUserRole;
  franchiseId: string | null;
  managedRestaurantId: string | null;
  preserveIfExists?: boolean;
}

const DEMO_USERS: DemoUserSeed[] = [
  {
    id: 'a0000000-0000-4000-8000-000000000001',
    firstName: 'FoodMatrix',
    lastName: 'Admin',
    email: 'admin@foodmatrix.local',
    role: SystemUserRole.SUPER_ADMIN,
    franchiseId: FRANCHISE_ID,
    managedRestaurantId: null,
    preserveIfExists: true,
  },
  {
    id: 'a0000000-0000-4000-8000-000000000002',
    firstName: 'Ananya',
    lastName: 'Rao',
    email: 'ananya.rao@foodmatrix.local',
    role: SystemUserRole.FRANCHISE_ADMIN,
    franchiseId: FRANCHISE_ID,
    managedRestaurantId: null,
  },
  {
    id: 'a0000000-0000-4000-8000-000000000003',
    firstName: 'Vikram',
    lastName: 'Menon',
    email: 'vikram.menon@foodmatrix.local',
    role: SystemUserRole.OPERATIONS,
    franchiseId: FRANCHISE_ID,
    managedRestaurantId: null,
  },
  {
    id: 'a0000000-0000-4000-8000-000000000004',
    firstName: 'Priya',
    lastName: 'Nair',
    email: 'priya.nair@foodmatrix.local',
    role: SystemUserRole.RESTAURANT_ADMIN,
    franchiseId: FRANCHISE_ID,
    managedRestaurantId: RESTAURANTS[0].id,
  },
  {
    id: 'a0000000-0000-4000-8000-000000000005',
    firstName: 'Rohan',
    lastName: 'Kulkarni',
    email: 'rohan.kulkarni@foodmatrix.local',
    role: SystemUserRole.RESTAURANT_ADMIN,
    franchiseId: FRANCHISE_ID,
    managedRestaurantId: RESTAURANTS[1].id,
  },
  {
    id: 'a0000000-0000-4000-8000-000000000006',
    firstName: 'Meera',
    lastName: 'Iyer',
    email: 'meera.iyer@foodmatrix.local',
    role: SystemUserRole.RESTAURANT_ADMIN,
    franchiseId: FRANCHISE_ID,
    managedRestaurantId: RESTAURANTS[2].id,
  },
  {
    id: 'a0000000-0000-4000-8000-000000000007',
    firstName: 'Arjun',
    lastName: 'Shetty',
    email: 'arjun.shetty@foodmatrix.local',
    role: SystemUserRole.STAFF,
    franchiseId: FRANCHISE_ID,
    managedRestaurantId: RESTAURANTS[0].id,
  },
];

async function upsertDemoFranchise() {
  const existing = await prisma.franchise.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (existing) {
    return prisma.franchise.update({
      where: { id: existing.id },
      data: {
        taxId: existing.taxId ?? '29AABCF1234D1Z5',
        defaultCurrency: existing.defaultCurrency || 'INR',
      },
    });
  }

  return prisma.franchise.create({
    data: {
      id: FRANCHISE_ID,
      name: 'FoodMatrix Bengaluru',
      taxId: '29AABCF1234D1Z5',
      defaultCurrency: 'INR',
    },
  });
}

async function main() {
  console.log('Seeding organization-service...');
  const franchise = await upsertDemoFranchise();

  const legacyRestaurantIds = [
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
  ];
  await prisma.systemUser.updateMany({
    where: { managedRestaurantId: { in: legacyRestaurantIds } },
    data: { managedRestaurantId: null },
  });
  await prisma.restaurant.deleteMany({
    where: { id: { in: legacyRestaurantIds } },
  });

  for (const restaurant of RESTAURANTS) {
    await prisma.restaurant.upsert({
      where: { id: restaurant.id },
      update: {
        name: restaurant.name,
        address: restaurant.address,
        city: restaurant.city,
        state: restaurant.state,
        country: restaurant.country,
        timezone: restaurant.timezone,
        status: restaurant.status,
        franchiseId: franchise.id,
      },
      create: {
        ...restaurant,
        franchiseId: franchise.id,
      },
    });
  }

  const demoPassword = process.env.SEED_USER_PASSWORD ?? 'FoodMatrix@2026';
  const passwordHash = await hashPassword(demoPassword);

  for (const seedUser of DEMO_USERS) {
    const existingSystemUser = await prisma.systemUser.findUnique({
      where: { email: seedUser.email },
    });

    if (existingSystemUser && seedUser.preserveIfExists) {
      continue;
    }

    const existingAuthUser = await prisma.user.findUnique({
      where: { email: seedUser.email },
    });

    const authUserId =
      existingSystemUser?.authUserId ?? existingAuthUser?.id ?? seedUser.id;
    const fullName = `${seedUser.firstName} ${seedUser.lastName}`;

    await prisma.user.upsert({
      where: { id: authUserId },
      update: {
        name: fullName,
        email: seedUser.email,
        emailVerified: true,
      },
      create: {
        id: authUserId,
        name: fullName,
        email: seedUser.email,
        emailVerified: true,
      },
    });

    const existingAccount = await prisma.account.findFirst({
      where: { userId: authUserId, providerId: 'credential' },
    });

    if (existingAccount) {
      await prisma.account.update({
        where: { id: existingAccount.id },
        data: { password: passwordHash },
      });
    } else {
      await prisma.account.create({
        data: {
          id: randomUUID(),
          accountId: authUserId,
          providerId: 'credential',
          userId: authUserId,
          password: passwordHash,
        },
      });
    }

    const targetFranchiseId = seedUser.franchiseId ? franchise.id : null;

    await prisma.systemUser.upsert({
      where: { email: seedUser.email },
      update: {
        firstName: seedUser.firstName,
        lastName: seedUser.lastName,
        role: seedUser.role,
        franchiseId: targetFranchiseId,
        managedRestaurantId: seedUser.managedRestaurantId,
        isActive: true,
      },
      create: {
        id: seedUser.id,
        authUserId,
        firstName: seedUser.firstName,
        lastName: seedUser.lastName,
        email: seedUser.email,
        role: seedUser.role,
        franchiseId: targetFranchiseId,
        managedRestaurantId: seedUser.managedRestaurantId,
        isActive: true,
      },
    });
  }

  console.log(
    `Organization seed complete: 1 franchise (${franchise.id}), ${RESTAURANTS.length} restaurants, ${DEMO_USERS.length} system users.`,
  );
}

main()
  .catch((error) => {
    console.error('Organization seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
