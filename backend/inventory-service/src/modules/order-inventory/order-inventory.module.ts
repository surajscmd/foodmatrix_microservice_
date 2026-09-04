import { Module } from '@nestjs/common';

import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { CatalogGatewayService } from '../../utils/caltalog-gateway.service.js';

import { OrderInventoryService } from './order-inventory.service.js';

@Module({
  providers: [PrismaService, CatalogGatewayService, OrderInventoryService],
  exports: [OrderInventoryService],
})
export class OrderInventoryModule {}
