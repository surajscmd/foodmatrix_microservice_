import 'dotenv/config';

import { betterAuth } from 'better-auth/minimal';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { jwt } from 'better-auth/plugins';

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

export const auth = betterAuth({
  appName: 'FoodMatrix',

  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3001',

  secret: process.env.BETTER_AUTH_SECRET,

  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,

    sendResetPassword: async ({ user, url }) => {
      await Promise.resolve();

      console.log(`Password reset URL for ${user.email}: ${url}`);
    },
  },

  trustedOrigins: ['http://localhost:3000'],

  plugins: [
    jwt({
      jwks: {
        keyPairConfig: {
          alg: 'EdDSA',
          crv: 'Ed25519',
        },
      },

      jwt: {
        expirationTime: '15m',

        definePayload: async ({ user }) => {
          const systemUser = await prisma.systemUser.findUnique({
            where: {
              authUserId: user.id,
            },
          });

          if (!systemUser) {
            throw new Error('FoodMatrix system user not found');
          }

          return {
            id: user.id,
            sub: user.id,
            name: user.name,
            email: user.email,

            role: systemUser.role,
            franchiseId: systemUser.franchiseId,
            managedRestaurantId: systemUser.managedRestaurantId,
          };
        },
      },
    }),
  ],
});
