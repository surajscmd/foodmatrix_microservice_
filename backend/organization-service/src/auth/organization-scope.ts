import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { SystemUserRole } from '@prisma/client';
import type { AuthenticatedUser } from './auth.guard.js';

export function requiredFranchise(user: AuthenticatedUser, requested?: string) {
  if (user.role === SystemUserRole.SUPER_ADMIN) {
    const id = requested ?? user.franchiseId;
    if (!id) throw new BadRequestException('Select a franchise');
    return id;
  }
  if (!user.franchiseId || (requested && requested !== user.franchiseId)) {
    throw new ForbiddenException('You do not have access to this franchise');
  }
  return user.franchiseId;
}

export function restaurantScope(user: AuthenticatedUser) {
  if (user.role === SystemUserRole.SUPER_ADMIN) return {};
  const franchiseId = requiredFranchise(user);
  if (user.role === SystemUserRole.FRANCHISE_ADMIN) return { franchiseId };
  if (!user.managedRestaurantId)
    throw new ForbiddenException('No restaurant is assigned to this account');
  return { id: user.managedRestaurantId, franchiseId };
}
