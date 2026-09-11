export interface EmployeeSignedInEvent {
  staffId: string;
  restaurantId: string;
  shiftId: string;
  shiftScheduleId: string;
  clockInAt: string;
}

export interface EmployeeLateEvent {
  staffId: string;
  restaurantId: string;
  shiftId: string;
  shiftScheduleId: string;
  scheduledStart: string;
  clockInAt: string;
  lateMinutes: number;
}

export interface EmployeeClockedOutEarlyEvent {
  staffId: string;
  restaurantId: string;
  shiftId: string;
  shiftScheduleId: string;
  scheduledEnd: string;
  clockOutAt: string;
  earlyMinutes: number;
}

export interface LeaveAppliedEvent {
  leaveId: string;
  staffId: string;
  restaurantId: string;
  type: string;
  isPaidLeave: boolean;
  startDate: string;
  endDate: string;
  totalDays: string;
}
