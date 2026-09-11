import { Injectable, Logger } from '@nestjs/common';

import type { EmployeeClockedOutEarlyEvent } from '../types/hr-events.js';

import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { NotificationGateway } from '../../socket/notification.gateway.js';

@Injectable()
export class EmployeeClockedOutEarlyHandler {
  private readonly logger = new Logger(EmployeeClockedOutEarlyHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  /**
   * Create a notification when an employee clocks out early.
   */
  async handle(event: EmployeeClockedOutEarlyEvent): Promise<void> {
    const message = `Employee clocked out ${event.earlyMinutes} minutes before the scheduled end time.`;

    // ============================================================
    // 1. CREATE NOTIFICATION IN DATABASE
    // ============================================================

    const notification = await this.prisma.notification.create({
      data: {
        scope: 'RESTAURANT',

        restaurantId: event.restaurantId,

        warehouseId: null,

        type: 'EMPLOYEE_CLOCKED_OUT_EARLY',

        priority: event.earlyMinutes >= 30 ? 'HIGH' : 'NORMAL',

        title: 'Employee Clocked Out Early',

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
      `Early clock-out notification created and emitted for staff ${event.staffId}`,
    );
  }
}
