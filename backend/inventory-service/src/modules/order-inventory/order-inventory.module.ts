import { Module } from '@nestjs/common';

import { PrismaModule } from '../../lib/prisma/prisma.module.js';
import { CatalogGatewayService } from '../../utils/caltalog-gateway.service.js';

import { OrderInventoryService } from './order-inventory.service.js';

@Module({
  imports: [PrismaModule],
  providers: [CatalogGatewayService, OrderInventoryService],
  exports: [OrderInventoryService],
})
export class OrderInventoryModule {}