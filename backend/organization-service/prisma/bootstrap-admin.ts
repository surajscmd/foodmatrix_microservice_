import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, SystemUserRole } from '@prisma/client';
import { hashPassword } from 'better-auth/crypto';
import { isEmail } from 'class-validator';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const franchiseName = process.env.BOOTSTRAP_FRANCHISE_NAME?.trim();
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim();
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (
    !connectionString ||
    !franchiseName ||
    !name ||
    !email ||
    !isEmail(email) ||
    !password ||
    password.length < 12 ||
    password.length > 128
  ) {
    throw new Error(
      'Set DATABASE_URL, BOOTSTRAP_FRANCHISE_NAME, BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL and a 12–128 character BOOTSTRAP_ADMIN_PASSWORD.',
    );
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  try {
    const passwordHash = await hashPassword(password);
    const [firstName, ...lastName] = name.split(/\s+/);
    const authUserId = randomUUID();
    await prisma.$transaction(async (tx) => {
      // Serialize concurrent bootstrap commands even on an empty database.
      await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(5419121, 1)`;
      const initialized = await tx.systemUser.findFirst({
        where: { role: SystemUserRole.SUPER_ADMIN },
        select: { id: true },
      });
      if (initialized) throw new Error('A super admin already exists.');
      const taken = await tx.systemUser.findUnique({
        where: { email },
        select: { id: true },
      });
      if (taken)
        throw new Error('This email is already assigned to a system user.');

      const franchise = await tx.franchise.upsert({
        where: { name: franchiseName },
        create: { name: franchiseName },
        update: {},
      });
      await tx.user.create({
        data: {
          id: authUserId,
          name,
          email,
          accounts: {
            create: {
              id: randomUUID(),
              providerId: 'credential',
              accountId: authUserId,
              password: passwordHash,
            },
          },
        },
      });
      await tx.systemUser.create({
        data: {
          authUserId,
          firstName,
          lastName: lastName.join(' '),
          email,
          role: SystemUserRole.SUPER_ADMIN,
          franchiseId: franchise.id,
        },
      });
    });
    console.log('Created the first franchise and super admin login.');
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : 'Organization bootstrap failed.',
  );
  process.exitCode = 1;
});
