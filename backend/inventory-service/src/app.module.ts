import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './lib/prisma/prisma.module.js';
import { InventoryModule } from './modules/inventory/inventory.module.js';
import { KafkaModule } from './kafka/kafka.module.js';
import { StockRequestModule } from './modules/stock-request/stock-request.module.js';
import { StockTransferModule } from './modules/stock-transfer/stock-transfer.module.js';
import { WarehouseStockModule } from './modules/warehouse-stock/warehouse-stock.module.js';
import { OrderInventoryModule } from './modules/order-inventory/order-inventory.module.js';
import { RestaurantStockModule } from './modules/restaurant-stock/restaurant-stock.module.js';
import { WasteLogModule } from './modules/waste-log/waste-log.module.js';
import { StockMovementModule } from './modules/stock-movement/stock-movement.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    InventoryModule,
    KafkaModule,
    StockRequestModule,
    StockTransferModule,
    WarehouseStockModule,
    OrderInventoryModule,
    RestaurantStockModule,
    WasteLogModule,
    StockMovementModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
