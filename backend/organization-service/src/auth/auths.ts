import 'dotenv/config';

import { betterAuth } from 'better-auth/minimal';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { jwt } from 'better-auth/plugins';

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Logger } from '@nestjs/common';
import { deliverPasswordReset } from './password-reset-delivery.js';

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
const logger = new Logger('OrganizationAuth');
const resetDelivery = process.env.PASSWORD_RESET_WEBHOOK_URL;
const resetToken = process.env.PASSWORD_RESET_WEBHOOK_TOKEN;
if (Boolean(resetDelivery) !== Boolean(resetToken)) {
  logger.warn(
    'Configure both password reset webhook settings to enable reset email',
  );
}

export const auth = betterAuth({
  appName: 'FoodMatrix',

  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3001',

  secret: process.env.BETTER_AUTH_SECRET,

  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    revokeSessionsOnPasswordReset: true,
    ...(resetDelivery &&
      resetToken && {
        sendResetPassword: async ({ user, url }) => {
          try {
            await deliverPasswordReset(
              resetDelivery,
              resetToken,
              user.email,
              url,
            );
          } catch {
            logger.error('Password reset delivery failed');
          }
        },
      }),
  },

  disabledPaths: ['/sign-up/email'],
  trustedOrigins: (
    process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? 'http://localhost:3000'
  )
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const systemUser = await prisma.systemUser.findUnique({
            where: { authUserId: session.userId },
            select: { isActive: true },
          });
          if (!systemUser?.isActive) return false;
        },
      },
    },
  },

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
            include: {
              restaurant: {
                select: {
                  timezone: true,
                  name: true,
                  franchise: { select: { defaultCurrency: true } },
                },
              },
            },
          });

          if (!systemUser?.isActive) {
            throw new Error('Active FoodMatrix system user required');
          }

          return {
            id: user.id,
            sub: user.id,
            name: user.name,
            email: user.email,

            role: systemUser.role,
            franchiseId: systemUser.franchiseId,
            managedRestaurantId: systemUser.managedRestaurantId,
            systemUserId: systemUser.id,
            restaurantTimezone: systemUser.restaurant?.timezone,
            restaurantName: systemUser.restaurant?.name,
            restaurantCurrency:
              systemUser.restaurant?.franchise.defaultCurrency,
          };
        },
      },
    }),
  ],
});
