import { Module } from '@nestjs/common';

import { PrismaModule } from '../lib/prisma/prisma.module.js';

import { KafkaConsumerService } from './kafka-consumer.service.js';

// ============================================================
// INVENTORY HANDLERS
// ============================================================

import { NotificationDeliveryService } from './handlers/notification-delivery.service.js';
import { InventoryLowStockHandler } from './handlers/inventory-low-stock.handler.js';

import { StockRequestCreatedHandler } from './handlers/stock-request-created.handler.js';

import { StockRequestApprovedHandler } from './handlers/stock-request-approved.handler.js';

import { StockShippedHandler } from './handlers/stock-shipped.handler.js';

import { StockReceivedHandler } from './handlers/stock-received.handler.js';

// ============================================================
// HR HANDLERS
// ============================================================

import { EmployeeSignedInHandler } from './handlers/employee-signed-in.handler.js';

import { EmployeeLateHandler } from './handlers/employee-late.handler.js';

import { EmployeeClockedOutEarlyHandler } from './handlers/employee-clocked-out-early.handler.js';

import { LeaveAppliedHandler } from './handlers/leave-applied.handler.js';
import { LeaveDecisionHandler } from './handlers/leave-decision.handler.js';
import { SocketModule } from '../socket/socket.module.js';

@Module({
  imports: [PrismaModule, SocketModule],

  providers: [
    // ----------------------------------------------------------
    // Kafka Consumer
    // ----------------------------------------------------------

    KafkaConsumerService,

    // ----------------------------------------------------------
    // Inventory Handlers
    // ----------------------------------------------------------

    NotificationDeliveryService,
    InventoryLowStockHandler,

    StockRequestCreatedHandler,

    StockRequestApprovedHandler,

    StockShippedHandler,

    StockReceivedHandler,

    // ----------------------------------------------------------
    // HR Handlers
    // ----------------------------------------------------------

    EmployeeSignedInHandler,

    EmployeeLateHandler,

    EmployeeClockedOutEarlyHandler,

    LeaveAppliedHandler,
    LeaveDecisionHandler,
  ],
})
export class KafkaModule {}
