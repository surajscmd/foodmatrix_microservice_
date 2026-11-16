import { Controller, Get, Header, Headers } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { WorkspaceAccessService } from '../../auth/workspace-access.service.js';

@Controller('catalog-access')
export class CatalogAccessController {
  constructor(private readonly workspaceAccess: WorkspaceAccessService) {}

  @Get()
  @AllowAnonymous()
  @Header('Cache-Control', 'private, no-store')
  async context(@Headers('authorization') authorization?: string) {
    const { id, role, managedRestaurantId, restaurants } =
      await this.workspaceAccess.verifyBearer(authorization);
    return {
      id,
      role,
      managedRestaurantId,
      restaurants: restaurants.map((restaurant) => ({ id: restaurant.id })),
    };
  }
}
