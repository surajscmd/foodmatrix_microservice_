import { Injectable, Logger } from '@nestjs/common';

import type { LeaveAppliedEvent } from '../types/hr-events.js';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

import { NotificationGateway } from '../../socket/notification.gateway.js';

@Injectable()
export class LeaveAppliedHandler {
  private readonly logger = new Logger(LeaveAppliedHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  /**
   * Create a notification when an employee applies for leave.
   */
  async handle(event: LeaveAppliedEvent): Promise<void> {
    const message = `An employee has applied for ${event.type} leave from ${event.startDate} to ${event.endDate}.`;

    // ============================================================
    // 1. CREATE NOTIFICATION IN DATABASE
    // ============================================================

    const notification = await this.prisma.notification.create({
      data: {
        scope: 'RESTAURANT',

        restaurantId: event.restaurantId,

        warehouseId: null,

        type: 'LEAVE_APPLIED',

        priority: 'NORMAL',

        title: 'Leave Request',

        message,

        referenceId: event.leaveId,

        referenceType: 'Leave',
      },
    });

    // ============================================================
    // 2. EMIT REAL-TIME NOTIFICATION
    // ============================================================

    this.notificationGateway.emitToRestaurant(event.restaurantId, notification);

    this.logger.log(
      `Leave notification created and emitted for staff ${event.staffId}`,
    );
  }
}
