import axios, { isAxiosError } from "axios";

export function attendanceError(error: unknown, fallback: string) {
  const message: unknown = isAxiosError(error) ? error.response?.data?.message : undefined;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) {
    return message.filter((part) => typeof part === "string").join(" ") || fallback;
  }
  return fallback;
}

/* =========================================================
   HR API CLIENT
   Browser -> Next.js /api/hr -> Kong -> HR Service
   ========================================================= */

export const hrApi = axios.create({
  baseURL: "/api/hr",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================================================
   TYPES
   ========================================================= */

export type EmployeeStatus = "ACTIVE" | "ON_LEAVE" | "SUSPENDED" | "TERMINATED";

export type PayType = "HOURLY" | "SALARY";

export interface WageHistory {
  id: string;
  staffId: string;

  payType: PayType;

  hourlyWage: number | string | null;
  overtimeRate: number | string | null;
  salaryAmount: number | string | null;

  effectiveStartDate: string;
  effectiveEndDate: string | null;

  approvedById: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface Staff {
  id: string;

  restaurantId: string;

  employeeCode: string;

  firstName: string;
  lastName: string;

  role: string;

  status: EmployeeStatus;

  createdAt: string;
  updatedAt: string;

  deletedAt: string | null;

  wageHistories?: WageHistory[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StaffListResponse {
  message: string;

  data: {
    data: Staff[];
    pagination: Pagination;
  };
}

export interface StaffResponse {
  message: string;
  data: Staff;
}

/* =========================================================
   STAFF PAYLOADS
   ========================================================= */

export interface CreateStaffPayload {
  restaurantId: string;

  employeeCode: string;

  firstName: string;
  lastName: string;

  role: string;

  pin: string;

  payType: PayType;

  hourlyWage?: number;

  overtimeRate?: number;

  salaryAmount?: number;

  approvedById?: string;
}

export interface UpdateStaffPayload {
  restaurantId?: string;

  employeeCode?: string;

  firstName?: string;
  lastName?: string;

  role?: string;

  pin?: string;
}

export interface UpdateStaffStatusPayload {
  status: EmployeeStatus;
}

/* =========================================================
   STAFF
   ========================================================= */

/**
 * Important:
 * restaurant scope for OPERATIONS / RESTAURANT_ADMIN /
 * STAFF is enforced by the HR backend from JWT.
 *
 * SUPER_ADMIN / FRANCHISE_ADMIN can receive global staff.
 */
export async function getStaff(
  page = 1,
  limit = 20,
): Promise<StaffListResponse> {
  const response = await hrApi.get<StaffListResponse>("/staff", {
    params: {
      page,
      limit,
    },
  });

  return response.data;
}

export async function getStaffById(staffId: string): Promise<StaffResponse> {
  const response = await hrApi.get<StaffResponse>(`/staff/${staffId}`);

  return response.data;
}

export async function createStaff(
  data: CreateStaffPayload,
): Promise<StaffResponse> {
  const response = await hrApi.post<StaffResponse>("/staff", data);

  return response.data;
}

export async function updateStaff(
  staffId: string,
  data: UpdateStaffPayload,
): Promise<StaffResponse> {
  const response = await hrApi.patch<StaffResponse>(`/staff/${staffId}`, data);

  return response.data;
}

export async function updateStaffStatus(
  staffId: string,
  status: EmployeeStatus,
): Promise<StaffResponse> {
  const response = await hrApi.patch<StaffResponse>(
    `/staff/${staffId}/status`,
    { status },
  );

  return response.data;
}

export async function deleteStaff(staffId: string): Promise<StaffResponse> {
  const response = await hrApi.delete<StaffResponse>(`/staff/${staffId}`);

  return response.data;
}

/* =========================================================
   WAGES
   ========================================================= */

export interface WageListResponse {
  message: string;

  data: {
    data: WageHistory[];
    pagination: Pagination;
  };
}

export interface WageResponse {
  message: string;
  data: WageHistory;
}

export interface CreateWagePayload {
  staffId: string;

  payType: PayType;

  hourlyWage?: number;

  overtimeRate?: number;

  salaryAmount?: number;

  effectiveStartDate: string;

  approvedById?: string;
}

export interface UpdateWagePayload {
  payType?: PayType;

  hourlyWage?: number;

  overtimeRate?: number;

  salaryAmount?: number;

  effectiveStartDate?: string;

  effectiveEndDate?: string;

  approvedById?: string;
}

export async function getWages(
  staffId: string,
  page = 1,
  limit = 20,
): Promise<WageListResponse> {
  const response = await hrApi.get<WageListResponse>("/wages", {
    params: {
      staffId,
      page,
      limit,
    },
  });

  return response.data;
}

export async function getWageById(wageId: string): Promise<WageResponse> {
  const response = await hrApi.get<WageResponse>(`/wages/${wageId}`);

  return response.data;
}

export async function getCurrentWage(staffId: string): Promise<WageResponse> {
  const response = await hrApi.get<WageResponse>(
    `/wages/staff/${staffId}/current`,
  );

  return response.data;
}

export async function createWage(
  data: CreateWagePayload,
): Promise<WageResponse> {
  const response = await hrApi.post<WageResponse>("/wages", data);

  return response.data;
}

export async function updateWage(
  wageId: string,
  data: UpdateWagePayload,
): Promise<WageResponse> {
  const response = await hrApi.patch<WageResponse>(`/wages/${wageId}`, data);

  return response.data;
}

export async function deleteWage(wageId: string): Promise<WageResponse> {
  const response = await hrApi.delete<WageResponse>(`/wages/${wageId}`);

  return response.data;
}

/* =========================================================
   ATTENDANCE
   ========================================================= */

export interface AttendanceShift {
  id: string;

  staffId: string;
  restaurantId: string;

  shiftType: string;

  clockInAt: string;
  clockOutAt: string | null;

  totalHours: number | string | null;
  regularHours: number | string | null;
  overtimeHours: number | string | null;

  isProcessedForPay?: boolean;

  staff: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface AttendanceResponse {
  message: string;
  data: AttendanceShift;
}

export interface AttendanceListResponse {
  message: string;
  data: AttendanceShift[];
}

export interface ClockInPayload {
  restaurantId: string;
  staffId: string;
  shiftScheduleId: string;
}

export async function getAttendance(params?: {
  restaurantId?: string;
  staffId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<AttendanceListResponse> {
  const response = await hrApi.get<AttendanceListResponse>(
    "/attendance",
    {
      params,
    },
  );

  return response.data;
}
export async function getAttendanceById(
  shiftId: string,
): Promise<AttendanceResponse> {
  const response = await hrApi.get<AttendanceResponse>(
    `/attendance/${shiftId}`,
  );

  return response.data;
}

export async function clockIn(
  data: ClockInPayload,
): Promise<AttendanceResponse> {
  const response = await hrApi.post<AttendanceResponse>(
    "/attendance/clock-in",
    data,
  );

  return response.data;
}

export async function clockOut(shiftId: string): Promise<AttendanceResponse> {
  const response = await hrApi.post<AttendanceResponse>(
    "/attendance/clock-out",
    {
      shiftId,
    },
  );

  return response.data;
}

/* =========================================================
   SHIFT SCHEDULES
   ========================================================= */

export interface ShiftTemplate {
  id: string;
  name: string;
  type: string;
  segments: {
    sequence: number;
    startTime: string;
    endTime: string;
    crossesMidnight: boolean;
  }[];
}

export async function getActiveShiftTemplates(restaurantId: string) {
  const response = await hrApi.get<{ data: ShiftTemplate[] }>("/shift-templates", {
    params: { restaurantId, status: "ACTIVE" },
  });
  return response.data.data;
}

export interface ShiftSchedule {
  id: string;

  staffId: string;
  restaurantId: string;

  shiftTemplateId: string;

  scheduledStart: string;
  scheduledEnd: string;

  status: string;

  staff: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    role: string;
  };

  shiftTemplate?: {
    id: string;
    name?: string;
    type?: string;
    segments?: unknown[];
  };
}

export interface ShiftScheduleResponse {
  message: string;
  data: ShiftSchedule;
}

export interface ShiftScheduleListResponse {
  message: string;
  data: ShiftSchedule[];
}

export interface CreateShiftSchedulePayload {
  restaurantId: string;

  staffId: string;

  shiftTemplateId: string;

  scheduledStart: string;
  scheduledEnd: string;
}

export interface UpdateShiftSchedulePayload {
  shiftTemplateId?: string;

  scheduledStart?: string;
  scheduledEnd?: string;

  status?: string;
}

export async function getShiftSchedules(params?: {
  restaurantId?: string;
  staffId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ShiftScheduleListResponse> {
  const response = await hrApi.get<ShiftScheduleListResponse>(
    "/shift-schedules",
    {
      params,
    },
  );

  return response.data;
}
export async function getShiftScheduleById(
  scheduleId: string,
): Promise<ShiftScheduleResponse> {
  const response = await hrApi.get<ShiftScheduleResponse>(
    `/shift-schedules/${scheduleId}`,
  );

  return response.data;
}

export async function createShiftSchedule(
  data: CreateShiftSchedulePayload,
): Promise<ShiftScheduleResponse> {
  const response = await hrApi.post<ShiftScheduleResponse>(
    "/shift-schedules",
    data,
  );

  return response.data;
}

export async function updateShiftSchedule(
  scheduleId: string,
  data: UpdateShiftSchedulePayload,
): Promise<ShiftScheduleResponse> {
  const response = await hrApi.patch<ShiftScheduleResponse>(
    `/shift-schedules/${scheduleId}`,
    data,
  );

  return response.data;
}
export async function getStaffByRestaurant(
  restaurantId: string,
  page = 1,
  limit = 20,
): Promise<StaffListResponse> {
  const response = await hrApi.get<StaffListResponse>("/staff", {
    params: {
      restaurantId,
      page,
      limit,
    },
  });

  return response.data;
}

export async function getAllStaff(
  page = 1,
  limit = 20,
): Promise<StaffListResponse> {
  const response = await hrApi.get<StaffListResponse>("/staff", {
    params: {
      page,
      limit,
    },
  });

  return response.data;
}
/* =========================================================
   LEAVE
   ========================================================= */

export interface LeaveRecord {
  id: string;
  staffId: string;
  type: string;
  isPaidLeave: boolean;
  startDate: string;
  endDate: string;
  totalDays?: number | string | null;
  reason?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedById?: string | null;
  createdAt: string;

  staff?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    role: string;
    restaurantId?: string;
  };
}

export interface LeaveListResponse {
  message: string;
  data: LeaveRecord[];
}

export async function getLeaves(params?: {
  restaurantId?: string;
  staffId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<LeaveListResponse> {
  const response = await hrApi.get<LeaveListResponse>(
    "/leaves",
    {
      params,
    },
  );

  return response.data;
}

/* =========================================================
   PAYSLIPS
   ========================================================= */

export interface Payslip {
  id: string;
  payrollRunId: string;
  staffId: string;

  regularHours: number | string | null;
  overtimeHours: number | string | null;
  paidLeaveHours: number | string | null;

  regularPay: number | string | null;
  overtimePay: number | string | null;

  grossPay: number | string | null;

  taxDeductions: number | string | null;
  otherDeductions: number | string | null;

  netPay: number | string | null;

  paymentMethod: string;
  status: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface PayslipResponse {
  message: string;
  data: Payslip;
}

export interface PayslipListResponse {
  message: string;
  data: Payslip[];
}

export async function getPayslips(params?: {
  staffId?: string;
  payrollRunId?: string;
  restaurantId?: string;
}): Promise<PayslipListResponse> {
  const response = await hrApi.get<PayslipListResponse>("/payslips", {
    params,
  });

  return response.data;
}

export async function getPayslipsByStaff(
  staffId: string,
): Promise<PayslipListResponse> {
  const response = await hrApi.get<PayslipListResponse>(
    `/payslips/staff/${staffId}`,
  );

  return response.data;
}

export async function getPayslipById(
  payslipId: string,
): Promise<PayslipResponse> {
  const response = await hrApi.get<PayslipResponse>(`/payslips/${payslipId}`);

  return response.data;
}

/* =========================================================
   PAYROLL RUNS
   ========================================================= */

export interface PayrollRun {
  id: string;
  restaurantId: string;

  periodStartDate: string;
  periodEndDate: string;

  status: string;

  processedById?: string | null;

  totalGrossPay: number | string;
  totalTaxes: number | string;
  totalNetPay: number | string;

  createdAt: string;
  updatedAt: string;

  payslips?: Payslip[];
}

export interface PayrollRunResponse {
  message: string;
  data: PayrollRun;
}

export interface PayrollRunListResponse {
  message: string;
  data: PayrollRun[];
}

export async function getPayrollRuns(params?: {
  restaurantId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<PayrollRunListResponse> {
  const response = await hrApi.get<PayrollRunListResponse>(
    "/payroll-runs",
    {
      params,
    },
  );

  return response.data;
}

export async function getPayrollRunById(
  payrollRunId: string,
): Promise<PayrollRunResponse> {
  const response = await hrApi.get<PayrollRunResponse>(
    `/payroll-runs/${payrollRunId}`,
  );

  return response.data;
}

export async function deleteShiftSchedule(
  scheduleId: string,
): Promise<ShiftScheduleResponse> {
  const response = await hrApi.delete<ShiftScheduleResponse>(
    `/shift-schedules/${scheduleId}`,
  );

  return response.data;
}
