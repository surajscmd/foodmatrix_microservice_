import { Module } from '@nestjs/common';
import { InventoryAccessController } from './inventory-access.controller.js';
import { RestaurantService } from './restaurant.service.js';
import { RestaurantController } from './restaurant.controller.js';
import { HrAccessController } from './hr-access.controller.js';
import { OrderAccessController } from './order-access.controller.js';
import { CatalogAccessController } from './catalog-access.controller.js';
import { WorkspaceAccessService } from '../../auth/workspace-access.service.js';

@Module({
  controllers: [
    RestaurantController,
    HrAccessController,
    CatalogAccessController,
    OrderAccessController,
    InventoryAccessController,
  ],
  providers: [RestaurantService, WorkspaceAccessService],
})
export class RestaurantModule {}
