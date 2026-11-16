import { Injectable } from '@nestjs/common';
import { NotificationDeliveryService } from './notification-delivery.service.js';

import type { LeaveAppliedEvent } from '../types/hr-events.js';

@Injectable()
export class LeaveAppliedHandler {
  constructor(private readonly delivery: NotificationDeliveryService) {}

  /**
   * Create a notification when an employee applies for leave.
   */
  async handle(event: LeaveAppliedEvent): Promise<void> {
    const message = `An employee has applied for ${event.type} leave from ${event.startDate} to ${event.endDate}.`;

    await this.delivery.sendOnce(event.leaveId, [
      {
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
    ]);
  }
}
