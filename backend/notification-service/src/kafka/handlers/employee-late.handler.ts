import { Injectable } from '@nestjs/common';
import { NotificationDeliveryService } from './notification-delivery.service.js';

import type { EmployeeLateEvent } from '../types/hr-events.js';

@Injectable()
export class EmployeeLateHandler {
  constructor(private readonly delivery: NotificationDeliveryService) {}

  /**
   * Create a notification when an employee clocks in late.
   */
  async handle(event: EmployeeLateEvent): Promise<void> {
    const message = `Employee was ${event.lateMinutes} minutes late for the scheduled shift.`;

    await this.delivery.sendOnce(event.shiftId, [
      {
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
    ]);
  }
}
