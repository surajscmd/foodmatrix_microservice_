import { Injectable, Logger } from '@nestjs/common';

import type { EmployeeSignedInEvent } from '../types/hr-events.js';

import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { NotificationGateway } from '../../socket/notification.gateway.js';

@Injectable()
export class EmployeeSignedInHandler {
  private readonly logger = new Logger(EmployeeSignedInHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  /**
   * Create a notification when an employee signs in.
   */
  async handle(event: EmployeeSignedInEvent): Promise<void> {
    // ============================================================
    // 1. CREATE NOTIFICATION IN DATABASE
    // ============================================================

    const notification = await this.prisma.notification.create({
      data: {
        scope: 'RESTAURANT',

        restaurantId: event.restaurantId,

        warehouseId: null,

        type: 'EMPLOYEE_SIGNED_IN',

        priority: 'NORMAL',

        title: 'Employee Signed In',

        message: 'An employee has signed in for their shift.',

        referenceId: event.shiftId,

        referenceType: 'Shift',
      },
    });

    // ============================================================
    // 2. EMIT REAL-TIME NOTIFICATION
    // ============================================================

    this.notificationGateway.emitToRestaurant(event.restaurantId, notification);

    this.logger.log(
      `Employee signed-in notification created and emitted for staff ${event.staffId}`,
    );
  }
}
