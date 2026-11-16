import { RestaurantStatus, SystemUserRole, type Prisma } from '@prisma/client';

export const restaurantRoles = [
  SystemUserRole.RESTAURANT_ADMIN,
  SystemUserRole.STAFF,
  SystemUserRole.OPERATIONS,
] as const;

export function isRestaurantRole(role: SystemUserRole) {
  return restaurantRoles.some((restaurantRole) => restaurantRole === role);
}

export const accountAccessInclude = {
  restaurant: {
    select: {
      id: true,
      franchiseId: true,
      status: true,
      timezone: true,
      name: true,
      franchise: { select: { defaultCurrency: true } },
    },
  },
} satisfies Prisma.SystemUserInclude;

type AssignedAccount = Pick<
  Prisma.SystemUserGetPayload<{ include: typeof accountAccessInclude }>,
  'role' | 'isActive' | 'franchiseId' | 'managedRestaurantId' | 'restaurant'
>;

export function hasWorkspaceAccess(account: AssignedAccount | null) {
  if (!account?.isActive) return false;
  if (account.role === SystemUserRole.SUPER_ADMIN) return true;
  if (!account.franchiseId) return false;
  if (!isRestaurantRole(account.role)) return true;
  return (
    !!account.restaurant &&
    account.restaurant.id === account.managedRestaurantId &&
    account.restaurant.franchiseId === account.franchiseId &&
    account.restaurant.status === RestaurantStatus.ACTIVE
  );
}
