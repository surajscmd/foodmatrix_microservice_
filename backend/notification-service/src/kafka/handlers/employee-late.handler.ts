import { Injectable, Logger } from '@nestjs/common';

import type { EmployeeLateEvent } from '../types/hr-events.js';

import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { NotificationGateway } from '../../socket/notification.gateway.js';

@Injectable()
export class EmployeeLateHandler {
  private readonly logger = new Logger(EmployeeLateHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  /**
   * Create a notification when an employee clocks in late.
   */
  async handle(event: EmployeeLateEvent): Promise<void> {
    const message = `Employee was ${event.lateMinutes} minutes late for the scheduled shift.`;

    // ============================================================
    // 1. CREATE NOTIFICATION IN DATABASE
    // ============================================================

    const notification = await this.prisma.notification.create({
      data: {
        scope: 'RESTAURANT',

        restaurantId: event.restaurantId,

        warehouseId: null,

        type: 'EMPLOYEE_LATE',

        priority: event.lateMinutes >= 30 ? 'HIGH' : 'NORMAL',

        title: 'Employee Late',

        message,

        referenceId: event.shiftId,

        referenceType: 'Shift',
      },
    });

    // ============================================================
    // 2. EMIT REAL-TIME NOTIFICATION
    // ============================================================

    this.notificationGateway.emitToRestaurant(event.restaurantId, notification);

    this.logger.log(
      `Late notification created and emitted for staff ${event.staffId}`,
    );
  }
}
