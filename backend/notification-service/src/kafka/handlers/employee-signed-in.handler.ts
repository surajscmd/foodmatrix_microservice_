import { Injectable } from '@nestjs/common';
import { NotificationDeliveryService } from './notification-delivery.service.js';

import type { EmployeeSignedInEvent } from '../types/hr-events.js';

@Injectable()
export class EmployeeSignedInHandler {
  constructor(private readonly delivery: NotificationDeliveryService) {}

  /**
   * Create a notification when an employee signs in.
   */
  async handle(event: EmployeeSignedInEvent): Promise<void> {
    await this.delivery.sendOnce(event.shiftId, [
      {
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
    ]);
  }
}
