import { Controller, Get, Header, Headers } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { WorkspaceAccessService } from '../../auth/workspace-access.service.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';

@Controller(['inventory-access', 'notification-access'])
export class InventoryAccessController {
  constructor(
    private readonly access: WorkspaceAccessService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @AllowAnonymous()
  @Header('Cache-Control', 'private, no-store')
  async context(@Headers('authorization') authorization?: string) {
    const {
      systemUserId,
      role,
      franchiseId,
      managedRestaurantId,
      restaurants,
    } = await this.access.verifyBearer(authorization);
    const warehouseIds =
      role === 'SUPER_ADMIN'
        ? (await this.prisma.franchise.findMany({ select: { id: true } })).map(
            ({ id }) => id,
          )
        : franchiseId
          ? [franchiseId]
          : [];

    return {
      userId: systemUserId,
      role,
      franchiseId,
      managedRestaurantId,
      restaurantIds: restaurants.map(({ id }) => id),
      warehouseIds,
    };
  }
}
