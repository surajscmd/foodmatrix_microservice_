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

const hrApi = axios.create({
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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface StaffListResponse {
  message: string;

  data: {
    data: Staff[];
    pagination: Pagination;
  };
}

interface StaffResponse {
  message: string;
  data: Staff;
}

/* =========================================================
   STAFF PAYLOADS
   ========================================================= */

interface CreateStaffPayload {
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

interface UpdateStaffPayload {
  restaurantId?: string;

  employeeCode?: string;

  firstName?: string;
  lastName?: string;

  role?: string;

  pin?: string;
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

interface WageListResponse {
  message: string;

  data: {
    data: WageHistory[];
    pagination: Pagination;
  };
}

interface WageResponse {
  message: string;
  data: WageHistory;
}

interface CreateWagePayload {
  staffId: string;

  payType: PayType;

  hourlyWage?: number;

  overtimeRate?: number;

  salaryAmount?: number;

  effectiveStartDate: string;

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

export async function getCurrentWage(staffId: string): Promise<WageResponse> {
  const response = await hrApi.get<WageResponse>(
    `/wages/staff/${staffId}/current`,
  );

  return response.data;
}

/* =========================================================
   ATTENDANCE
   ========================================================= */

export interface AttendanceShift {
  id: string;

  staffId: string;
  restaurantId: string;
  shiftScheduleId?: string | null;

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

interface AttendanceResponse {
  message: string;
  data: AttendanceShift;
}

interface AttendanceListResponse {
  message: string;
  data: AttendanceShift[];
}

interface ClockInPayload {
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
  type: "MORNING" | "EVENING" | "NIGHT" | "SPLIT";
  status: "ACTIVE" | "INACTIVE";
  segments: {
    sequence: number;
    startTime: string;
    endTime: string;
    crossesMidnight: boolean;
  }[];
}

export async function getActiveShiftTemplates(restaurantId: string) {
  return getShiftTemplates(restaurantId, "ACTIVE");
}

export async function getShiftTemplates(restaurantId: string, status?: ShiftTemplate["status"]) {
  const response = await hrApi.get<{ data: ShiftTemplate[] }>("/shift-templates", {
    params: { restaurantId, status },
  });
  return response.data.data;
}

export async function saveShiftTemplate(restaurantId: string, payload: Omit<ShiftTemplate, "id">, id?: string) {
  const response = id
    ? await hrApi.patch<{ message: string; data: ShiftTemplate }>(`/shift-templates/${id}`, payload)
    : await hrApi.post<{ message: string; data: ShiftTemplate }>("/shift-templates", { ...payload, restaurantId });
  return response.data;
}

export async function deleteShiftTemplate(id: string) {
  return (await hrApi.delete<{ message: string }>(`/shift-templates/${id}`)).data;
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

interface ShiftScheduleResponse {
  message: string;
  data: ShiftSchedule;
}

interface ShiftScheduleListResponse {
  message: string;
  data: ShiftSchedule[];
}

interface CreateShiftSchedulePayload {
  restaurantId: string;

  staffId: string;

  shiftTemplateId: string;

  scheduledStart: string;
  scheduledEnd: string;
}

interface UpdateShiftSchedulePayload {
  shiftTemplateId?: string;

  scheduledStart?: string;
  scheduledEnd?: string;

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
  filters?: { search?: string; status?: EmployeeStatus; directory?: boolean },
): Promise<StaffListResponse> {
  const response = await hrApi.get<StaffListResponse>("/staff", {
    params: {
      restaurantId,
      page,
      limit,
      ...filters,
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
  status: "PENDING" | "APPROVED" | "REJECTED" | "REVOKED";
  approvedById?: string | null;
  revokedAt?: string | null;
  revokeReason?: string | null;
  createdAt: string;
  updatedAt: string;

  staff?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    role: string;
    restaurantId?: string;
  };
}

interface LeaveListResponse {
  message: string;
  data: LeaveRecord[];
}

type LeavePayload = Pick<LeaveRecord, "staffId" | "type" | "isPaidLeave" | "startDate" | "endDate"> & { reason: string };

export async function saveLeave(payload: LeavePayload, id?: string) {
  const response = id
    ? await hrApi.patch<{ message: string; data: LeaveRecord }>(`/leaves/${id}`, payload)
    : await hrApi.post<{ message: string; data: LeaveRecord }>("/leaves", payload);
  return response.data;
}

export async function reviewLeave(id: string, action: "approve" | "reject") {
  const response = await hrApi.patch<{ message: string }>(`/leaves/${id}/${action}`);
  return response.data;
}

export async function revokeLeave(leave: LeaveRecord, reason: string) {
  const response = await hrApi.patch<{ message: string }>(`/leaves/${leave.id}/revoke`, {
    expectedStatus: leave.status,
    expectedUpdatedAt: leave.updatedAt,
    reason,
  });
  return response.data;
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
  staff?: Pick<Staff, "firstName" | "lastName" | "employeeCode">;
  payrollRun?: Pick<PayrollRun, "periodStartDate" | "periodEndDate">;
}

interface PayslipListResponse {
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
  paidAt?: string | null;
  paymentReference?: string | null;
  reopenedAt?: string | null;
  reopenReason?: string | null;

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

interface PayrollRunListResponse {
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

export async function scheduleWageChange(payload: CreateWagePayload) {
  return (await hrApi.post<WageResponse>("/wages/changes", payload)).data;
}

export async function cancelWageChange(id: string) {
  return (await hrApi.delete<{ message: string }>(`/wages/changes/${id}`)).data;
}

export async function createPayrollRun(payload: {
  restaurantId: string;
  periodStartDate: string;
  periodEndDate: string;
}) {
  return (await hrApi.post<PayrollRunResponse>("/payroll-runs", payload)).data;
}

export type PayrollPaymentMethod = "DIRECT_DEPOSIT" | "CASH" | "CHECK";

export async function savePayrollStep(id: string, action: "process" | "approve", expectedUpdatedAt: string) {
  return (await hrApi.request<PayrollRunResponse>({
    method: action === "process" ? "post" : "patch",
    url: `/payroll-runs/${id}/${action}`,
    data: action === "approve" ? { expectedUpdatedAt } : undefined,
  })).data;
}

export async function reopenPayroll(run: PayrollRun, reason: string) {
  return (await hrApi.patch<PayrollRunResponse>(`/payroll-runs/${run.id}/reopen`, { reason, expectedUpdatedAt: run.updatedAt })).data;
}

export async function recordPayrollPayment(run: PayrollRun, method: PayrollPaymentMethod, reference: string) {
  return (await hrApi.patch<PayrollRunResponse>(`/payroll-runs/${run.id}/pay`, { method, reference, expectedUpdatedAt: run.updatedAt })).data;
}

export async function savePayrollDeductions(run: PayrollRun, slipId: string, taxDeductions: number, otherDeductions: number) {
  return (await hrApi.patch<PayrollRunResponse>(`/payroll-runs/${run.id}/payslips/${slipId}/deductions`, {
    taxDeductions, otherDeductions, expectedUpdatedAt: run.updatedAt,
  })).data;
}

export async function discardPayrollDraft(id: string) {
  return (await hrApi.delete<{ message: string }>(`/payroll-runs/${id}`)).data;
}

export async function downloadPayslip(id: string) {
  const response = await hrApi.get<Blob>(`/payslips/${id}/download`, { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `payslip-${id}.pdf`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function deleteShiftSchedule(
  scheduleId: string,
): Promise<{ message: string }> {
  const response = await hrApi.delete<{ message: string }>(
    `/shift-schedules/${scheduleId}`,
  );

  return response.data;
}
