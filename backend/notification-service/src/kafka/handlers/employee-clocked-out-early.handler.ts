import { Injectable } from '@nestjs/common';
import { NotificationDeliveryService } from './notification-delivery.service.js';

import type { EmployeeClockedOutEarlyEvent } from '../types/hr-events.js';

@Injectable()
export class EmployeeClockedOutEarlyHandler {
  constructor(private readonly delivery: NotificationDeliveryService) {}

  /**
   * Create a notification when an employee clocks out early.
   */
  async handle(event: EmployeeClockedOutEarlyEvent): Promise<void> {
    const message = `Employee clocked out ${event.earlyMinutes} minutes before the scheduled end time.`;

    await this.delivery.sendOnce(event.shiftId, [
      {
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
    ]);
  }
}
