import { ConflictException, NotFoundException } from '@nestjs/common';
import { SystemUserRole } from '@prisma/client';
import type { PrismaService } from '../../lib/prisma/prisma.service.js';

// ============================================================
// MAIN VALIDATION FUNCTION
// ============================================================
export async function validateSystemUserScope(
  prisma: PrismaService,
  role: SystemUserRole,
  franchiseId?: string,
  regionId?: string,
  restaurantId?: string,
): Promise<void> {
  // 1. SUPER ADMIN
  if (role === 'SUPER_ADMIN') {
    if (franchiseId || regionId || restaurantId) {
      throw new ConflictException(
        'SUPER_ADMIN cannot have franchise, region, or restaurant scope.',
      );
    }
    return;
  }

  // 2. FRANCHISE ADMIN
  if (role === 'FRANCHISE_ADMIN') {
    if (!franchiseId)
      throw new ConflictException('FRANCHISE_ADMIN requires franchiseId.');
    if (regionId || restaurantId)
      throw new ConflictException(
        'FRANCHISE_ADMIN cannot have region or restaurant scope.',
      );

    await checkFranchise(prisma, franchiseId);
    return;
  }

  // 3. REGIONAL ADMIN
  if (role === 'REGIONAL_ADMIN') {
    if (!franchiseId)
      throw new ConflictException('REGIONAL_ADMIN requires franchiseId.');
    if (!regionId)
      throw new ConflictException('REGIONAL_ADMIN requires managedRegionId.');
    if (restaurantId)
      throw new ConflictException(
        'REGIONAL_ADMIN cannot have restaurant scope.',
      );

    await checkFranchise(prisma, franchiseId);
    await checkRegion(prisma, regionId, franchiseId);
    return;
  }

  // 4. RESTAURANT ADMIN
  if (role === 'RESTAURANT_ADMIN') {
    if (!franchiseId)
      throw new ConflictException('RESTAURANT_ADMIN requires franchiseId.');
    if (!restaurantId)
      throw new ConflictException(
        'RESTAURANT_ADMIN requires managedRestaurantId.',
      );

    await checkFranchise(prisma, franchiseId);
    await checkRestaurant(prisma, restaurantId, franchiseId);
    return;
  }

  throw new ConflictException('Invalid system user role.');
}

// ============================================================
// INTERNAL HELPERS
// ============================================================
async function checkFranchise(
  prisma: PrismaService,
  franchiseId: string,
): Promise<void> {
  const franchise = await prisma.franchise.findUnique({
    where: { id: franchiseId },
  });
  if (!franchise)
    throw new NotFoundException(
      `Franchise with ID '${franchiseId}' not found.`,
    );
}

async function checkRegion(
  prisma: PrismaService,
  regionId: string,
  franchiseId: string,
): Promise<void> {
  const region = await prisma.region.findUnique({ where: { id: regionId } });
  if (!region)
    throw new NotFoundException(`Region with ID '${regionId}' not found.`);
  if (region.franchiseId !== franchiseId)
    throw new ConflictException(
      'The selected region does not belong to the selected franchise.',
    );
}

async function checkRestaurant(
  prisma: PrismaService,
  restaurantId: string,
  franchiseId: string,
): Promise<void> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: { region: true },
  });
  if (!restaurant)
    throw new NotFoundException(
      `Restaurant with ID '${restaurantId}' not found.`,
    );
  if (restaurant.region.franchiseId !== franchiseId)
    throw new ConflictException(
      'The selected restaurant does not belong to the selected franchise.',
    );
}
