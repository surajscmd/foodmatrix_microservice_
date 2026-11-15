import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { Kafka } from 'kafkajs';

import { InventoryLowStockHandler } from './handlers/inventory-low-stock.handler.js';
import { StockRequestCreatedHandler } from './handlers/stock-request-created.handler.js';
import { StockRequestApprovedHandler } from './handlers/stock-request-approved.handler.js';
import { StockShippedHandler } from './handlers/stock-shipped.handler.js';
import { StockReceivedHandler } from './handlers/stock-received.handler.js';

import { EmployeeSignedInHandler } from './handlers/employee-signed-in.handler.js';
import { EmployeeLateHandler } from './handlers/employee-late.handler.js';
import { EmployeeClockedOutEarlyHandler } from './handlers/employee-clocked-out-early.handler.js';
import { LeaveAppliedHandler } from './handlers/leave-applied.handler.js';
import {
  isLeaveDecision,
  LeaveDecisionHandler,
} from './handlers/leave-decision.handler.js';

import type {
  LowStockEvent,
  StockRequestCreatedEvent,
  StockRequestApprovedEvent,
  StockShippedEvent,
  StockReceivedEvent,
} from './types/inventory-events.js';

import type {
  EmployeeSignedInEvent,
  EmployeeLateEvent,
  EmployeeClockedOutEarlyEvent,
  LeaveAppliedEvent,
} from './types/hr-events.js';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);

  private readonly kafka = new Kafka({
    clientId: 'notification-service-consumer',

    brokers: ['localhost:9094', 'localhost:9095', 'localhost:9096'],
  });

  private readonly consumer = this.kafka.consumer({
    groupId: 'notification-service-group',
  });

  constructor(
    // ==========================================================
    // INVENTORY HANDLERS
    // ==========================================================

    private readonly lowStockHandler: InventoryLowStockHandler,

    private readonly stockRequestCreatedHandler: StockRequestCreatedHandler,

    private readonly stockRequestApprovedHandler: StockRequestApprovedHandler,

    private readonly stockShippedHandler: StockShippedHandler,

    private readonly stockReceivedHandler: StockReceivedHandler,

    // ==========================================================
    // HR HANDLERS
    // ==========================================================

    private readonly employeeSignedInHandler: EmployeeSignedInHandler,

    private readonly employeeLateHandler: EmployeeLateHandler,

    private readonly employeeClockedOutEarlyHandler: EmployeeClockedOutEarlyHandler,

    private readonly leaveAppliedHandler: LeaveAppliedHandler,
    private readonly leaveDecisionHandler: LeaveDecisionHandler,
  ) {}

  // ============================================================
  // INVENTORY EVENT VALIDATION
  // ============================================================

  /**
   * Validate low-stock event.
   */
  private isLowStockEvent(event: unknown): event is LowStockEvent {
    if (typeof event !== 'object' || event === null) {
      return false;
    }

    const value = event as Record<string, unknown>;

    return typeof value.restaurantId === 'string' && Array.isArray(value.items);
  }

  /**
   * Validate stock-request-created event.
   */
  private isStockRequestCreatedEvent(
    event: unknown,
  ): event is StockRequestCreatedEvent {
    if (typeof event !== 'object' || event === null) {
      return false;
    }

    const value = event as Record<string, unknown>;

    return (
      typeof value.stockRequestId === 'string' &&
      typeof value.restaurantId === 'string' &&
      typeof value.warehouseId === 'string' &&
      typeof value.requestedBy === 'string' &&
      typeof value.itemCount === 'number'
    );
  }

  /**
   * Validate stock-request-approved event.
   */
  private isStockRequestApprovedEvent(
    event: unknown,
  ): event is StockRequestApprovedEvent {
    if (typeof event !== 'object' || event === null) {
      return false;
    }

    const value = event as Record<string, unknown>;

    return (
      typeof value.stockRequestId === 'string' &&
      typeof value.restaurantId === 'string' &&
      typeof value.warehouseId === 'string' &&
      Array.isArray(value.items)
    );
  }

  /**
   * Validate stock-shipped event.
   */
  private isStockShippedEvent(event: unknown): event is StockShippedEvent {
    if (typeof event !== 'object' || event === null) {
      return false;
    }

    const value = event as Record<string, unknown>;

    return (
      typeof value.stockTransferId === 'string' &&
      typeof value.restaurantId === 'string' &&
      typeof value.warehouseId === 'string' &&
      Array.isArray(value.items)
    );
  }

  /**
   * Validate stock-received event.
   */
  private isStockReceivedEvent(event: unknown): event is StockReceivedEvent {
    if (typeof event !== 'object' || event === null) {
      return false;
    }

    const value = event as Record<string, unknown>;

    return (
      typeof value.stockTransferId === 'string' &&
      typeof value.restaurantId === 'string' &&
      typeof value.warehouseId === 'string' &&
      Array.isArray(value.items)
    );
  }

  // ============================================================
  // HR EVENT VALIDATION
  // ============================================================

  /**
   * Validate employee signed-in event.
   */
  private isEmployeeSignedInEvent(
    event: unknown,
  ): event is EmployeeSignedInEvent {
    if (typeof event !== 'object' || event === null) {
      return false;
    }

    const value = event as Record<string, unknown>;

    return (
      typeof value.staffId === 'string' &&
      typeof value.restaurantId === 'string' &&
      typeof value.shiftId === 'string' &&
      typeof value.shiftScheduleId === 'string' &&
      typeof value.clockInAt === 'string'
    );
  }

  /**
   * Validate employee-late event.
   */
  private isEmployeeLateEvent(event: unknown): event is EmployeeLateEvent {
    if (typeof event !== 'object' || event === null) {
      return false;
    }

    const value = event as Record<string, unknown>;

    return (
      typeof value.staffId === 'string' &&
      typeof value.restaurantId === 'string' &&
      typeof value.shiftId === 'string' &&
      typeof value.shiftScheduleId === 'string' &&
      typeof value.scheduledStart === 'string' &&
      typeof value.clockInAt === 'string' &&
      typeof value.lateMinutes === 'number'
    );
  }

  /**
   * Validate employee early clock-out event.
   */
  private isEmployeeClockedOutEarlyEvent(
    event: unknown,
  ): event is EmployeeClockedOutEarlyEvent {
    if (typeof event !== 'object' || event === null) {
      return false;
    }

    const value = event as Record<string, unknown>;

    return (
      typeof value.staffId === 'string' &&
      typeof value.restaurantId === 'string' &&
      typeof value.shiftId === 'string' &&
      typeof value.shiftScheduleId === 'string' &&
      typeof value.scheduledEnd === 'string' &&
      typeof value.clockOutAt === 'string' &&
      typeof value.earlyMinutes === 'number'
    );
  }

  /**
   * Validate leave-applied event.
   */
  private isLeaveAppliedEvent(event: unknown): event is LeaveAppliedEvent {
    if (typeof event !== 'object' || event === null) {
      return false;
    }

    const value = event as Record<string, unknown>;

    return (
      typeof value.leaveId === 'string' &&
      typeof value.staffId === 'string' &&
      typeof value.restaurantId === 'string' &&
      typeof value.type === 'string' &&
      typeof value.isPaidLeave === 'boolean' &&
      typeof value.startDate === 'string' &&
      typeof value.endDate === 'string' &&
      typeof value.totalDays === 'string'
    );
  }

  // ============================================================
  // START CONSUMER
  // ============================================================

  /**
   * Connect to Kafka, subscribe to all supported topics,
   * and start consuming messages.
   */
  async onModuleInit(): Promise<void> {
    await this.consumer.connect();

    const topics = [
      // Inventory
      'inventory.low-stock',
      'inventory.stock-request-created',
      'inventory.stock-request-approved',
      'inventory.stock-shipped',
      'inventory.stock-received',

      // HR
      'hr.employee-signed-in',
      'hr.employee-late',
      'hr.employee-clocked-out-early',
      'hr.leave-applied',
      'hr.leave-decision',
    ];

    for (const topic of topics) {
      await this.consumer.subscribe({
        topic,
        fromBeginning: false,
      });
    }

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        if (!message.value) {
          return;
        }

        try {
          const event: unknown = JSON.parse(message.value.toString());

          switch (topic) {
            // ==================================================
            // INVENTORY
            // ==================================================

            case 'inventory.low-stock': {
              if (!this.isLowStockEvent(event)) {
                this.logger.warn('Invalid inventory.low-stock event received');
                return;
              }

              await this.lowStockHandler.handle(event);

              break;
            }

            case 'inventory.stock-request-created': {
              if (!this.isStockRequestCreatedEvent(event)) {
                this.logger.warn(
                  'Invalid inventory.stock-request-created event received',
                );
                return;
              }

              await this.stockRequestCreatedHandler.handle(event);

              break;
            }

            case 'inventory.stock-request-approved': {
              if (!this.isStockRequestApprovedEvent(event)) {
                this.logger.warn(
                  'Invalid inventory.stock-request-approved event received',
                );
                return;
              }

              await this.stockRequestApprovedHandler.handle(event);

              break;
            }

            case 'inventory.stock-shipped': {
              if (!this.isStockShippedEvent(event)) {
                this.logger.warn(
                  'Invalid inventory.stock-shipped event received',
                );
                return;
              }

              await this.stockShippedHandler.handle(event);

              break;
            }

            case 'inventory.stock-received': {
              if (!this.isStockReceivedEvent(event)) {
                this.logger.warn(
                  'Invalid inventory.stock-received event received',
                );
                return;
              }

              await this.stockReceivedHandler.handle(event);

              break;
            }

            // ==================================================
            // HR
            // ==================================================

            case 'hr.employee-signed-in': {
              if (!this.isEmployeeSignedInEvent(event)) {
                this.logger.warn(
                  'Invalid hr.employee-signed-in event received',
                );
                return;
              }

              await this.employeeSignedInHandler.handle(event);

              break;
            }

            case 'hr.employee-late': {
              if (!this.isEmployeeLateEvent(event)) {
                this.logger.warn('Invalid hr.employee-late event received');
                return;
              }

              await this.employeeLateHandler.handle(event);

              break;
            }

            case 'hr.employee-clocked-out-early': {
              if (!this.isEmployeeClockedOutEarlyEvent(event)) {
                this.logger.warn(
                  'Invalid hr.employee-clocked-out-early event received',
                );
                return;
              }

              await this.employeeClockedOutEarlyHandler.handle(event);

              break;
            }

            case 'hr.leave-applied': {
              if (!this.isLeaveAppliedEvent(event)) {
                this.logger.warn('Invalid hr.leave-applied event received');
                return;
              }

              await this.leaveAppliedHandler.handle(event);

              break;
            }

            case 'hr.leave-decision': {
              if (!isLeaveDecision(event)) {
                this.logger.warn('Invalid hr.leave-decision event received');
                return;
              }
              await this.leaveDecisionHandler.handle(event);
              break;
            }

            default:
              this.logger.warn(`No handler found for topic: ${topic}`);
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          this.logger.error(
            `Failed to process Kafka message from ${topic}: ${errorMessage}`,
          );
        }
      },
    });

    this.logger.log('Notification Kafka consumer connected');
  }

  // ============================================================
  // STOP CONSUMER
  // ============================================================

  /**
   * Disconnect from Kafka when the Notification Service shuts down.
   */
  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();

    this.logger.log('Notification Kafka consumer disconnected');
  }
}
