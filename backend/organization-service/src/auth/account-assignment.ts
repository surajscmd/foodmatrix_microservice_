import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RestaurantStatus, SystemUserRole, type Prisma } from '@prisma/client';
import { isRestaurantRole } from './account-access.js';

type Assignment = {
  role: SystemUserRole;
  franchiseId?: string | null;
  managedRestaurantId?: string | null;
};

export async function validateAccountAssignment(
  db: Pick<Prisma.TransactionClient, 'restaurant' | 'franchise'>,
  actor: Pick<Assignment, 'role' | 'franchiseId'>,
  assignment: Assignment,
) {
  const { role, franchiseId, managedRestaurantId = null } = assignment;
  const needsRestaurant = isRestaurantRole(role);
  if (actor.role !== SystemUserRole.SUPER_ADMIN) {
    if (
      actor.role !== SystemUserRole.FRANCHISE_ADMIN ||
      !needsRestaurant ||
      !actor.franchiseId ||
      actor.franchiseId !== franchiseId
    ) {
      throw new ForbiddenException('You cannot assign this role or franchise');
    }
  }

  if (!franchiseId) throw new BadRequestException('Select a franchise');
  if (needsRestaurant && !managedRestaurantId)
    throw new BadRequestException('Select a restaurant for this role');
  if (!needsRestaurant && managedRestaurantId)
    throw new BadRequestException(
      'This role does not have a restaurant assignment',
    );

  if (managedRestaurantId) {
    const restaurant = await db.restaurant.findFirst({
      where: { id: managedRestaurantId, franchiseId },
      select: { status: true },
    });
    if (!restaurant)
      throw new NotFoundException(
        'Restaurant not found in the selected franchise',
      );
    if (restaurant.status !== RestaurantStatus.ACTIVE)
      throw new BadRequestException('Select an active restaurant');
  } else {
    const franchise = await db.franchise.findUnique({
      where: { id: franchiseId },
      select: { id: true },
    });
    if (!franchise) throw new NotFoundException('Franchise not found');
  }

  return { role, franchiseId, managedRestaurantId };
}
