import { Module } from '@nestjs/common';

import { OrderController } from './orders.controller';
import { OrderService } from './orders.service';
import { OrderItemsService } from './order-items.service';

import { CatalogGatewayService } from '../../utils/catalog-gateway.service';

@Module({
  controllers: [OrderController],

  providers: [OrderService, OrderItemsService, CatalogGatewayService],

  exports: [OrderService, OrderItemsService],
})
export class OrdersModule {}
