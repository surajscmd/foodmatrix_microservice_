import { Controller, Get, Header, Headers } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { WorkspaceAccessService } from '../../auth/workspace-access.service.js';

@Controller('order-access')
export class OrderAccessController {
  constructor(private readonly workspaceAccess: WorkspaceAccessService) {}

  @Get()
  @AllowAnonymous()
  @Header('Cache-Control', 'private, no-store')
  async context(@Headers('authorization') authorization?: string) {
    const { role, managedRestaurantId, restaurants } =
      await this.workspaceAccess.verifyBearer(authorization);
    return {
      role,
      managedRestaurantId,
      restaurants: restaurants.map(({ id }) => ({ id })),
    };
  }
}
