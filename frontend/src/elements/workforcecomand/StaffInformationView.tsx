"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  History,
  Loader2,
  UserRound,
  WalletCards,
  XCircle,
} from "lucide-react";

import {
  getAttendance,
  getCurrentWage,
  getLeaves,
  getPayrollRuns,
  getShiftSchedules,
  getStaffById,
  getWages,
  type AttendanceShift,
  type LeaveRecord,
  type PayrollRun,
  type ShiftSchedule,
  type Staff,
  type WageHistory,
} from "@/lib/hr-api";

interface StaffInformationViewProps {
  staffId: string;
  restaurantName?: string;
  onBack: () => void;
}

// ============================================================
// HELPERS
// ============================================================

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function money(value?: string | number | null) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return String(value);
  }

  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function numberValue(value?: string | number | null) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const parsed = Number(value);

  return Number.isNaN(parsed) ? 0 : parsed;
}

function statusClass(status?: string) {
  switch (status) {
    case "ACTIVE":
    case "APPROVED":
    case "PAID":
    case "COMPLETED":
    case "PRESENT":
    case "SCHEDULED":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

    case "PENDING":
    case "DRAFT":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";

    case "REJECTED":
    case "CANCELLED":
    case "TERMINATED":
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";

    default:
      return "bg-zinc-800 text-zinc-400 border-zinc-700";
  }
}

function StatusBadge({ status }: { status?: string }) {
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${statusClass(
        status,
      )}`}
    >
      {status ?? "UNKNOWN"}
    </span>
  );
}

function Section({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 ${className}`}
    >
      <div className="mb-5 flex items-center gap-2 border-b border-zinc-800 pb-3">
        <span className="text-emerald-400">{icon}</span>

        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
          {title}
        </h3>
      </div>

      {children}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 py-8 text-center">
      <p className="text-xs text-zinc-600">{message}</p>
    </div>
  );
}

// ============================================================
// DATE HELPERS
// ============================================================

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentMonthRange() {
  const now = new Date();

  return {
    start: toDateInputValue(
      new Date(now.getFullYear(), now.getMonth(), 1),
    ),
    end: toDateInputValue(
      new Date(now.getFullYear(), now.getMonth() + 1, 0),
    ),
  };
}

function getAttendanceDateKey(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return toDateInputValue(date);
}

// ============================================================
// COMPONENT
// ============================================================

export default function StaffInformationView({
  staffId,
  restaurantName,
  onBack,
}: StaffInformationViewProps) {
  // ============================================================
  // EMPLOYEE DATA
  // ============================================================

  const [staff, setStaff] = useState<Staff | null>(null);
  const [currentWage, setCurrentWage] = useState<WageHistory | null>(null);
  const [wages, setWages] = useState<WageHistory[]>([]);
  const [attendance, setAttendance] = useState<AttendanceShift[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================
  // ATTENDANCE STATE
  // ============================================================

  const initialMonth = useMemo(() => getCurrentMonthRange(), []);

  const [attendanceStartDate, setAttendanceStartDate] = useState(
    initialMonth.start,
  );

  const [attendanceEndDate, setAttendanceEndDate] = useState(
    initialMonth.end,
  );

  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // ============================================================
  // SHIFT SCHEDULE STATE
  // ============================================================

  const [shiftStartDate, setShiftStartDate] = useState(
    initialMonth.start,
  );

  const [shiftEndDate, setShiftEndDate] = useState(initialMonth.end);

  const [schedules, setSchedules] = useState<ShiftSchedule[]>([]);

  const [shiftLoading, setShiftLoading] = useState(false);

  const [shiftError, setShiftError] = useState<string | null>(null);

  // ============================================================
  // LEAVE STATE
  // ============================================================

  const [leaveStartDate, setLeaveStartDate] = useState(
    initialMonth.start,
  );

  const [leaveEndDate, setLeaveEndDate] = useState(initialMonth.end);

  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);

  const [leaveLoading, setLeaveLoading] = useState(false);

  const [leaveError, setLeaveError] = useState<string | null>(null);

  // ============================================================
  // PAYROLL STATE
  // ============================================================

  const [payrollStartDate, setPayrollStartDate] = useState(
    initialMonth.start,
  );

  const [payrollEndDate, setPayrollEndDate] = useState(
    initialMonth.end,
  );

  const [payrollLoading, setPayrollLoading] = useState(false);

  const [payrollError, setPayrollError] = useState<string | null>(null);

  // ============================================================
  // LOAD EMPLOYEE DATA
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!staffId) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // ------------------------------------------------------
        // LOAD STAFF FIRST
        // ------------------------------------------------------

        const staffResponse = await getStaffById(staffId);

        if (cancelled) return;

        const employee = staffResponse.data;

        setStaff(employee);

        // ------------------------------------------------------
        // LOAD CORE EMPLOYEE RESOURCES
        // ------------------------------------------------------

        const results = await Promise.allSettled([
          getCurrentWage(staffId),
          getWages(staffId, 1, 100),
        ]);

        if (cancelled) return;

        const [currentWageResult, wagesResult] = results;

        // ------------------------------------------------------
        // CURRENT WAGE
        // ------------------------------------------------------

        if (currentWageResult.status === "fulfilled") {
          setCurrentWage(currentWageResult.value.data);
        } else {
          setCurrentWage(null);
        }

        // ------------------------------------------------------
        // WAGE HISTORY
        // ------------------------------------------------------

        if (wagesResult.status === "fulfilled") {
          setWages(wagesResult.value.data?.data ?? []);
        } else {
          setWages([]);
        }
      } catch (err) {
        if (cancelled) return;

        console.error(
          "Failed to load employee information:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load employee information.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [staffId]);

  // ============================================================
  // LOAD ATTENDANCE
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const loadAttendance = async () => {
      if (!staffId) {
        return;
      }

      if (
        attendanceStartDate &&
        attendanceEndDate &&
        attendanceStartDate > attendanceEndDate
      ) {
        setAttendance([]);
        return;
      }

      try {
        setAttendanceLoading(true);

        const startDate = attendanceStartDate
          ? new Date(
              `${attendanceStartDate}T00:00:00`,
            ).toISOString()
          : undefined;

        const endDate = attendanceEndDate
          ? new Date(
              `${attendanceEndDate}T23:59:59.999`,
            ).toISOString()
          : undefined;

        const response = await getAttendance({
          staffId,
          startDate,
          endDate,
        });

        if (cancelled) return;

        setAttendance(response.data ?? []);
      } catch (err) {
        if (cancelled) return;

        console.error(
          "Failed to load employee attendance:",
          err,
        );

        setAttendance([]);
      } finally {
        if (!cancelled) {
          setAttendanceLoading(false);
        }
      }
    };

    void loadAttendance();

    return () => {
      cancelled = true;
    };
  }, [
    staffId,
    attendanceStartDate,
    attendanceEndDate,
  ]);

  // ============================================================
  // LOAD SHIFT SCHEDULES
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const loadSchedules = async () => {
      if (!staffId) {
        return;
      }

      if (
        shiftStartDate &&
        shiftEndDate &&
        shiftStartDate > shiftEndDate
      ) {
        setSchedules([]);
        setShiftError(
          "Start date cannot be after the end date.",
        );
        return;
      }

      try {
        setShiftLoading(true);
        setShiftError(null);

        const startDate = shiftStartDate
          ? new Date(
              `${shiftStartDate}T00:00:00`,
            ).toISOString()
          : undefined;

        const endDate = shiftEndDate
          ? new Date(
              `${shiftEndDate}T23:59:59.999`,
            ).toISOString()
          : undefined;

        const response = await getShiftSchedules({
          staffId,
          startDate,
          endDate,
        });

        if (cancelled) return;

        setSchedules(response.data ?? []);
      } catch (err) {
        if (cancelled) return;

        console.error(
          "Failed to load employee shift schedules:",
          err,
        );

        setSchedules([]);

        setShiftError(
          err instanceof Error
            ? err.message
            : "Failed to load shift schedules.",
        );
      } finally {
        if (!cancelled) {
          setShiftLoading(false);
        }
      }
    };

    void loadSchedules();

    return () => {
      cancelled = true;
    };
  }, [
    staffId,
    shiftStartDate,
    shiftEndDate,
  ]);

  // ============================================================
  // LOAD LEAVES
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const loadLeaves = async () => {
      if (!staffId) {
        return;
      }

      if (
        leaveStartDate &&
        leaveEndDate &&
        leaveStartDate > leaveEndDate
      ) {
        setLeaves([]);
        setLeaveError(
          "Start date cannot be after the end date.",
        );
        return;
      }

      try {
        setLeaveLoading(true);
        setLeaveError(null);

        const startDate = leaveStartDate
          ? new Date(
              `${leaveStartDate}T00:00:00`,
            ).toISOString()
          : undefined;

        const endDate = leaveEndDate
          ? new Date(
              `${leaveEndDate}T23:59:59.999`,
            ).toISOString()
          : undefined;

        const response = await getLeaves({
          staffId,
          startDate,
          endDate,
        });

        if (cancelled) return;

        setLeaves(response.data ?? []);
      } catch (err) {
        if (cancelled) return;

        console.error(
          "Failed to load employee leave records:",
          err,
        );

        setLeaves([]);

        setLeaveError(
          err instanceof Error
            ? err.message
            : "Failed to load leave records.",
        );
      } finally {
        if (!cancelled) {
          setLeaveLoading(false);
        }
      }
    };

    void loadLeaves();

    return () => {
      cancelled = true;
    };
  }, [
    staffId,
    leaveStartDate,
    leaveEndDate,
  ]);

  // ============================================================
  // LOAD PAYROLL
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const loadPayroll = async () => {
      if (!staffId || !staff?.restaurantId) {
        return;
      }

      if (
        payrollStartDate &&
        payrollEndDate &&
        payrollStartDate > payrollEndDate
      ) {
        setPayrollRuns([]);
        setPayrollError(
          "Start date cannot be after the end date.",
        );
        return;
      }

      try {
        setPayrollLoading(true);
        setPayrollError(null);

        const response = await getPayrollRuns({
          restaurantId: staff.restaurantId,
          startDate: payrollStartDate || undefined,
          endDate: payrollEndDate || undefined,
        });

        if (cancelled) return;

        // Payroll endpoint returns restaurant-level payroll runs.
        // Keep only payroll runs containing this employee.
        const employeePayrollRuns = (
          response.data ?? []
        ).filter((run) =>
          run.payslips?.some(
            (payslip) => payslip.staffId === staffId,
          ),
        );

        setPayrollRuns(employeePayrollRuns);
      } catch (err) {
        if (cancelled) return;

        console.error(
          "Failed to load employee payroll:",
          err,
        );

        setPayrollRuns([]);

        setPayrollError(
          err instanceof Error
            ? err.message
            : "Failed to load payroll records.",
        );
      } finally {
        if (!cancelled) {
          setPayrollLoading(false);
        }
      }
    };

    void loadPayroll();

    return () => {
      cancelled = true;
    };
  }, [
    staffId,
    staff?.restaurantId,
    payrollStartDate,
    payrollEndDate,
  ]);

  // ============================================================
  // FILTERED ATTENDANCE
  // ============================================================

  const filteredAttendance = useMemo(() => {
    if (
      attendanceStartDate &&
      attendanceEndDate &&
      attendanceStartDate > attendanceEndDate
    ) {
      return [];
    }

    return attendance.filter((record) => {
      const dateKey = getAttendanceDateKey(
        record.clockInAt,
      );

      return (
        dateKey >= attendanceStartDate &&
        dateKey <= attendanceEndDate
      );
    });
  }, [
    attendance,
    attendanceStartDate,
    attendanceEndDate,
  ]);

  // ============================================================
  // DERIVED DATA
  // ============================================================

  const completedAttendance = useMemo(
    () =>
      filteredAttendance.filter(
        (record) => record.clockOutAt !== null,
      ),
    [filteredAttendance],
  );

  const totalHours = useMemo(
    () =>
      filteredAttendance.reduce(
        (total, record) =>
          total + numberValue(record.totalHours),
        0,
      ),
    [filteredAttendance],
  );

  const overtimeHours = useMemo(
    () =>
      filteredAttendance.reduce(
        (total, record) =>
          total + numberValue(record.overtimeHours),
        0,
      ),
    [filteredAttendance],
  );

  const approvedLeaves = leaves.filter(
    (leave) => leave.status === "APPROVED",
  ).length;

  const pendingLeaves = leaves.filter(
    (leave) => leave.status === "PENDING",
  ).length;

  // Payroll runs are ordered newest first by the backend.
  // Use the newest employee payslip from those payroll runs.
  const latestEmployeePayslip = useMemo(() => {
    for (const run of payrollRuns) {
      const payslip = run.payslips?.find(
        (item) => item.staffId === staffId,
      );

      if (payslip) {
        return payslip;
      }
    }

    return null;
  }, [payrollRuns, staffId]);

  // ============================================================
  // LOADING
  // ============================================================

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500">
          <Loader2
            className="animate-spin text-emerald-400"
            size={18}
          />

          <span className="text-xs">
            Loading employee information...
          </span>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error || !staff) {
    return (
      <div className="space-y-6 p-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-400 transition hover:border-zinc-700 hover:text-white"
        >
          <ArrowLeft size={14} />
          Back to Workforce
        </button>

        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8 text-center">
          <XCircle
            size={28}
            className="mx-auto mb-3 text-rose-400"
          />

          <p className="text-sm font-semibold text-rose-300">
            Unable to load employee
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {error ??
              "Employee information was not found."}
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN VIEW
  // ============================================================

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
            aria-label="Back to workforce"
          >
            <ArrowLeft size={16} />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded border border-zinc-800 bg-zinc-900/50 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
                {staff.employeeCode}
              </span>

              <StatusBadge status={staff.status} />
            </div>

            <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
              {staff.firstName} {staff.lastName}
            </h2>

            <p className="mt-0.5 text-xs text-zinc-500">
              {staff.role}
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================
          KPI
      ====================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* ATTENDANCE */}
        <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Attendance Hours
            </span>

            <h4 className="mt-1 font-mono text-lg font-bold text-white">
              {totalHours.toFixed(2)}h
            </h4>

            <p className="text-[10px] text-zinc-600">
              {completedAttendance.length} completed shifts
            </p>
          </div>

          <Clock3
            className="text-emerald-400"
            size={20}
          />
        </div>

        {/* OVERTIME */}
        <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Overtime
            </span>

            <h4 className="mt-1 font-mono text-lg font-bold text-white">
              {overtimeHours.toFixed(2)}h
            </h4>

            <p className="text-[10px] text-zinc-600">
              Recorded overtime
            </p>
          </div>

          <History
            className="text-amber-400"
            size={20}
          />
        </div>

        {/* LATEST PAY */}
        <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Latest Net Pay
            </span>

            <h4 className="mt-1 font-mono text-lg font-bold text-emerald-400">
              {money(latestEmployeePayslip?.netPay)}
            </h4>

            <p className="text-[10px] text-zinc-600">
              Latest payroll record
            </p>
          </div>

          <WalletCards
            className="text-emerald-400"
            size={20}
          />
        </div>

        {/* LEAVE */}
        <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Leave
            </span>

            <h4 className="mt-1 font-mono text-lg font-bold text-white">
              {approvedLeaves}
            </h4>

            <p className="text-[10px] text-zinc-600">
              {pendingLeaves} pending
            </p>
          </div>

          <CalendarDays
            className="text-sky-400"
            size={20}
          />
        </div>
      </div>

      {/* ======================================================
          MAIN GRID
      ====================================================== */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ====================================================
            LEFT
        ==================================================== */}

        <div className="space-y-6 lg:col-span-7">
          {/* ==================================================
              EMPLOYEE INFORMATION
          ================================================== */}

          <Section
            title="Employee Information"
            icon={<UserRound size={15} />}
          >
            <div className="grid grid-cols-1 gap-5 text-xs sm:grid-cols-2">
              <InfoItem
                label="Employee Name"
                value={`${staff.firstName} ${staff.lastName}`}
              />

              <InfoItem
                label="Employee Code"
                value={staff.employeeCode}
              />

              <InfoItem
                label="Role"
                value={staff.role}
              />

              <InfoItem
                label="Status"
                value={<StatusBadge status={staff.status} />}
              />

              <InfoItem
                label="Restaurant"
                value={
                  restaurantName ??
                  "Unknown restaurant"
                }
              />

              <InfoItem
                label="Joined"
                value={formatDate(staff.createdAt)}
              />

              <InfoItem
                label="Last Updated"
                value={formatDateTime(
                  staff.updatedAt,
                )}
              />

              <InfoItem
                label="Record State"
                value={
                  staff.deletedAt
                    ? "Deleted"
                    : "Active record"
                }
              />
            </div>
          </Section>

          {/* ==================================================
              COMPENSATION
          ================================================== */}

          <Section
            title="Compensation & Wage History"
            icon={<Banknote size={15} />}
          >
            {currentWage && (
              <div className="mb-5 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04] p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <InfoItem
                    label="Current Pay Type"
                    value={currentWage.payType}
                  />

                  <InfoItem
                    label={
                      currentWage.payType ===
                      "SALARY"
                        ? "Salary"
                        : "Hourly Wage"
                    }
                    value={
                      currentWage.payType ===
                      "SALARY"
                        ? money(
                            currentWage.salaryAmount,
                          )
                        : money(
                            currentWage.hourlyWage,
                          )
                    }
                  />

                  <InfoItem
                    label="Overtime Rate"
                    value={money(
                      currentWage.overtimeRate,
                    )}
                  />
                </div>

                <div className="mt-4 border-t border-zinc-800 pt-3 text-[10px] text-zinc-500">
                  Effective from{" "}
                  <span className="text-zinc-300">
                    {formatDate(
                      currentWage.effectiveStartDate,
                    )}
                  </span>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              {wages.length === 0 ? (
                <EmptyState message="No wage history found." />
              ) : (
                <table className="w-full min-w-[600px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-600">
                      <th className="pb-3">
                        Pay Type
                      </th>

                      <th className="pb-3">
                        Rate / Salary
                      </th>

                      <th className="pb-3">
                        Overtime
                      </th>

                      <th className="pb-3">
                        Effective
                      </th>

                      <th className="pb-3">
                        Ended
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {wages.map((wage) => (
                      <tr
                        key={wage.id}
                        className="border-b border-zinc-800/60 last:border-0"
                      >
                        <td className="py-3 text-zinc-300">
                          {wage.payType}
                        </td>

                        <td className="py-3 font-mono text-white">
                          {wage.payType ===
                          "SALARY"
                            ? money(
                                wage.salaryAmount,
                              )
                            : money(
                                wage.hourlyWage,
                              )}
                        </td>

                        <td className="py-3 font-mono text-zinc-400">
                          {money(
                            wage.overtimeRate,
                          )}
                        </td>

                        <td className="py-3 text-zinc-400">
                          {formatDate(
                            wage.effectiveStartDate,
                          )}
                        </td>

                        <td className="py-3 text-zinc-500">
                          {wage.effectiveEndDate
                            ? formatDate(
                                wage.effectiveEndDate,
                              )
                            : "Current"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Section>

          {/* ==================================================
              ATTENDANCE
          ================================================== */}

          <Section
            title="Attendance & Timecards"
            icon={<Clock3 size={15} />}
          >
            <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-zinc-500">
                    Attendance Period
                  </p>

                  <p className="mt-1 text-[10px] text-zinc-600">
                    Review this employee&apos;s
                    attendance for the selected period
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div>
                    <label className="mb-1 block text-[9px] font-mono uppercase tracking-wider text-zinc-600">
                      From
                    </label>

                    <input
                      type="date"
                      value={attendanceStartDate}
                      onChange={(event) =>
                        setAttendanceStartDate(
                          event.target.value,
                        )
                      }
                      className="h-9 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-300 outline-none transition hover:border-zinc-700 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/10"
                    />
                  </div>

                  <span className="hidden pb-2 text-xs text-zinc-700 sm:block">
                    →
                  </span>

                  <div>
                    <label className="mb-1 block text-[9px] font-mono uppercase tracking-wider text-zinc-600">
                      To
                    </label>

                    <input
                      type="date"
                      value={attendanceEndDate}
                      min={attendanceStartDate}
                      onChange={(event) =>
                        setAttendanceEndDate(
                          event.target.value,
                        )
                      }
                      className="h-9 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-300 outline-none transition hover:border-zinc-700 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {attendanceStartDate >
            attendanceEndDate ? (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-400">
                Start date cannot be after
                the end date.
              </div>
            ) : attendanceLoading ? (
              <LoadingState label="Loading attendance..." />
            ) : filteredAttendance.length === 0 ? (
              <EmptyState message="No attendance records found for the selected period." />
            ) : (
              <>
                <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <KpiBox
                    label="Shifts"
                    value={filteredAttendance.length}
                  />

                  <KpiBox
                    label="Completed"
                    value={completedAttendance.length}
                    valueClass="text-emerald-400"
                  />

                  <KpiBox
                    label="Worked Hours"
                    value={`${totalHours.toFixed(2)}h`}
                  />

                  <KpiBox
                    label="Overtime"
                    value={`${overtimeHours.toFixed(2)}h`}
                    valueClass="text-amber-400"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-600">
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Shift</th>
                        <th className="pb-3">Clock In</th>
                        <th className="pb-3">Clock Out</th>
                        <th className="pb-3">Hours</th>
                        <th className="pb-3">Regular</th>
                        <th className="pb-3">Overtime</th>
                        <th className="pb-3">Payroll</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredAttendance.map((record) => (
                        <tr
                          key={record.id}
                          className="border-b border-zinc-800/60 transition-colors last:border-0 hover:bg-zinc-950/60"
                        >
                          <td className="py-3 text-zinc-300">
                            {formatDate(
                              record.clockInAt,
                            )}
                          </td>

                          <td className="py-3 text-zinc-400">
                            {record.shiftType}
                          </td>

                          <td className="py-3 font-mono text-zinc-300">
                            {formatDateTime(
                              record.clockInAt,
                            )}
                          </td>

                          <td className="py-3 font-mono">
                            {record.clockOutAt ? (
                              <span className="text-zinc-300">
                                {formatDateTime(
                                  record.clockOutAt,
                                )}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-amber-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                Active
                              </span>
                            )}
                          </td>

                          <td className="py-3 font-mono font-semibold text-white">
                            {numberValue(
                              record.totalHours,
                            ).toFixed(2)}
                            h
                          </td>

                          <td className="py-3 font-mono text-zinc-400">
                            {numberValue(
                              record.regularHours,
                            ).toFixed(2)}
                            h
                          </td>

                          <td className="py-3 font-mono text-amber-400">
                            {numberValue(
                              record.overtimeHours,
                            ).toFixed(2)}
                            h
                          </td>

                          <td className="py-3">
                            {record.isProcessedForPay ? (
                              <StatusBadge status="APPROVED" />
                            ) : (
                              <span className="inline-flex rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
                                Unprocessed
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Section>

          {/* ==================================================
              SHIFT SCHEDULE
          ================================================== */}

          <Section
            title="Shift Schedule"
            icon={<CalendarDays size={15} />}
          >
            <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-zinc-500">
                    Schedule Period
                  </p>

                  <p className="mt-1 text-[10px] text-zinc-600">
                    View employee shifts for the
                    selected period
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div>
                    <label className="mb-1 block text-[9px] font-mono uppercase tracking-wider text-zinc-600">
                      From
                    </label>

                    <input
                      type="date"
                      value={shiftStartDate}
                      onChange={(event) =>
                        setShiftStartDate(
                          event.target.value,
                        )
                      }
                      className="h-9 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-300 outline-none transition hover:border-zinc-700 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/10"
                    />
                  </div>

                  <span className="hidden pb-2 text-xs text-zinc-700 sm:block">
                    →
                  </span>

                  <div>
                    <label className="mb-1 block text-[9px] font-mono uppercase tracking-wider text-zinc-600">
                      To
                    </label>

                    <input
                      type="date"
                      value={shiftEndDate}
                      min={shiftStartDate}
                      onChange={(event) =>
                        setShiftEndDate(
                          event.target.value,
                        )
                      }
                      className="h-9 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-300 outline-none transition hover:border-zinc-700 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {shiftStartDate > shiftEndDate ? (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                <p className="text-xs text-rose-400">
                  Start date cannot be after the end date.
                </p>
              </div>
            ) : shiftLoading ? (
              <LoadingState label="Loading shift schedules..." />
            ) : shiftError ? (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                <p className="text-xs text-rose-400">
                  {shiftError}
                </p>
              </div>
            ) : schedules.length === 0 ? (
              <EmptyState message="No scheduled shifts found for the selected period." />
            ) : (
              <div className="space-y-2">
                {schedules.map((schedule) => {
                  const shiftName =
                    schedule.shiftTemplate?.name ??
                    schedule.shiftTemplate?.type ??
                    "Scheduled Shift";

                  return (
                    <div
                      key={schedule.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-950/70"
                    >
                      <div className="hidden grid-cols-5 gap-4 md:grid md:items-center">
                        <div>
                          <span className="mb-1 block text-[9px] font-mono uppercase tracking-wider text-zinc-600">
                            Date
                          </span>

                          <span className="text-xs font-medium text-zinc-300">
                            {formatDate(
                              schedule.scheduledStart,
                            )}
                          </span>
                        </div>

                        <div>
                          <span className="mb-1 block text-[9px] font-mono uppercase tracking-wider text-zinc-600">
                            Start
                          </span>

                          <span className="font-mono text-xs text-white">
                            {formatTime(
                              schedule.scheduledStart,
                            )}
                          </span>
                        </div>

                        <div>
                          <span className="mb-1 block text-[9px] font-mono uppercase tracking-wider text-zinc-600">
                            End
                          </span>

                          <span className="font-mono text-xs text-white">
                            {formatTime(
                              schedule.scheduledEnd,
                            )}
                          </span>
                        </div>

                        <div>
                          <span className="mb-1 block text-[9px] font-mono uppercase tracking-wider text-zinc-600">
                            Shift
                          </span>

                          <span className="text-xs text-zinc-300">
                            {shiftName}
                          </span>
                        </div>

                        <div className="text-right">
                          <StatusBadge
                            status={schedule.status}
                          />
                        </div>
                      </div>

                      <div className="space-y-4 md:hidden">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {shiftName}
                            </p>

                            <p className="mt-1 text-[10px] text-zinc-500">
                              {formatDate(
                                schedule.scheduledStart,
                              )}
                            </p>
                          </div>

                          <StatusBadge
                            status={schedule.status}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock3
                            size={14}
                            className="text-emerald-400"
                          />

                          <span className="font-mono text-xs text-zinc-300">
                            {formatTime(
                              schedule.scheduledStart,
                            )}
                          </span>

                          <span className="text-zinc-700">
                            →
                          </span>

                          <span className="font-mono text-xs text-zinc-300">
                            {formatTime(
                              schedule.scheduledEnd,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        </div>

        {/* ====================================================
            RIGHT
        ==================================================== */}

        <div className="space-y-6 lg:col-span-5">
          {/* ==================================================
              LEAVE HISTORY
          ================================================== */}

          <Section
            title="Leave History"
            icon={<CalendarDays size={15} />}
          >
            <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-zinc-500">
                    Leave Period
                  </p>

                  <p className="mt-1 text-[10px] text-zinc-600">
                    View leave records overlapping
                    the selected period
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div>
                    <label className="mb-1 block text-[9px] font-mono uppercase tracking-wider text-zinc-600">
                      From
                    </label>

                    <input
                      type="date"
                      value={leaveStartDate}
                      onChange={(event) =>
                        setLeaveStartDate(
                          event.target.value,
                        )
                      }
                      className="h-9 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-300 outline-none transition hover:border-zinc-700 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/10"
                    />
                  </div>

                  <span className="hidden pb-2 text-xs text-zinc-700 sm:block">
                    →
                  </span>

                  <div>
                    <label className="mb-1 block text-[9px] font-mono uppercase tracking-wider text-zinc-600">
                      To
                    </label>

                    <input
                      type="date"
                      value={leaveEndDate}
                      min={leaveStartDate}
                      onChange={(event) =>
                        setLeaveEndDate(
                          event.target.value,
                        )
                      }
                      className="h-9 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-300 outline-none transition hover:border-zinc-700 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {leaveStartDate > leaveEndDate ? (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                <p className="text-xs text-rose-400">
                  Start date cannot be after the end date.
                </p>
              </div>
            ) : leaveLoading ? (
              <LoadingState label="Loading leave records..." />
            ) : leaveError ? (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                <p className="text-xs text-rose-400">
                  {leaveError}
                </p>
              </div>
            ) : leaves.length === 0 ? (
              <EmptyState message="No leave records found for the selected period." />
            ) : (
              <div className="space-y-3">
                {leaves.map((leave) => (
                  <div
                    key={leave.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-950/70"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-white">
                          {leave.type}
                        </p>

                        <p className="mt-1 text-[10px] text-zinc-500">
                          {formatDate(
                            leave.startDate,
                          )}{" "}
                          →{" "}
                          {formatDate(
                            leave.endDate,
                          )}
                        </p>
                      </div>

                      <StatusBadge
                        status={leave.status}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 border-t border-zinc-800 pt-4 sm:grid-cols-3">
                      <InfoItem
                        label="Paid Leave"
                        value={
                          leave.isPaidLeave
                            ? "Yes"
                            : "No"
                        }
                      />

                      <InfoItem
                        label="Days"
                        value={
                          leave.totalDays ?? "—"
                        }
                      />

                      <InfoItem
                        label="Status"
                        value={leave.status}
                      />
                    </div>

                    {leave.reason && (
                      <div className="mt-4 border-t border-zinc-800 pt-3">
                        <p className="text-[9px] font-mono uppercase tracking-wider text-zinc-600">
                          Reason
                        </p>

                        <p className="mt-1 text-xs text-zinc-400">
                          {leave.reason}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* ==================================================
              PAYROLL HISTORY
          ================================================== */}

          <Section
            title="Payroll History"
            icon={<WalletCards size={15} />}
          >
            <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-zinc-500">
                    Payroll Period
                  </p>

                  <p className="mt-1 text-[10px] text-zinc-600">
                    View this employee&apos;s payroll and complete
                    payslip details for the selected period
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div>
                    <label className="mb-1 block text-[9px] font-mono uppercase tracking-wider text-zinc-600">
                      From
                    </label>

                    <input
                      type="date"
                      value={payrollStartDate}
                      onChange={(event) =>
                        setPayrollStartDate(
                          event.target.value,
                        )
                      }
                      className="h-9 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-300 outline-none transition hover:border-zinc-700 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/10"
                    />
                  </div>

                  <span className="hidden pb-2 text-xs text-zinc-700 sm:block">
                    →
                  </span>

                  <div>
                    <label className="mb-1 block text-[9px] font-mono uppercase tracking-wider text-zinc-600">
                      To
                    </label>

                    <input
                      type="date"
                      value={payrollEndDate}
                      min={payrollStartDate}
                      onChange={(event) =>
                        setPayrollEndDate(
                          event.target.value,
                        )
                      }
                      className="h-9 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-300 outline-none transition hover:border-zinc-700 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {payrollStartDate > payrollEndDate ? (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                <p className="text-xs text-rose-400">
                  Start date cannot be after the end date.
                </p>
              </div>
            ) : payrollLoading ? (
              <LoadingState label="Loading payroll records..." />
            ) : payrollError ? (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                <p className="text-xs text-rose-400">
                  {payrollError}
                </p>
              </div>
            ) : payrollRuns.length === 0 ? (
              <EmptyState message="No payroll runs found for the selected period." />
            ) : (
              <div className="space-y-4">
                {payrollRuns.map((run) => {
                  const employeePayslip =
                    run.payslips?.find(
                      (payslip) =>
                        payslip.staffId === staffId,
                    );

                  if (!employeePayslip) {
                    return null;
                  }

                  return (
                    <div
                      key={run.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-950/70"
                    >
                      {/* PAYROLL RUN HEADER */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-semibold text-white">
                              Payroll Period
                            </p>

                            <StatusBadge
                              status={run.status}
                            />
                          </div>

                          <p className="mt-1 font-mono text-[10px] text-zinc-500">
                            {formatDate(
                              run.periodStartDate,
                            )}{" "}
                            →{" "}
                            {formatDate(
                              run.periodEndDate,
                            )}
                          </p>

                          <p className="mt-2 break-all font-mono text-[9px] text-zinc-700">
                            Run ID: {run.id}
                          </p>
                        </div>

                        {/* PAYSLIP ID IS NOW PART OF PAYROLL */}
                        <div className="shrink-0 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
                          <p className="text-[9px] font-mono uppercase tracking-wider text-zinc-600">
                            Payslip ID
                          </p>

                          <p className="mt-1 break-all font-mono text-[10px] text-zinc-400 sm:max-w-[240px]">
                            {employeePayslip.id}
                          </p>
                        </div>
                      </div>

                      {/* COMPLETE PAYSLIP INFORMATION */}
                      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                          <div>
                            <p className="text-[9px] font-mono uppercase tracking-[0.14em] text-zinc-600">
                              Employee Payroll Details
                            </p>

                            <p className="mt-1 text-[11px] text-zinc-400">
                              Complete payroll calculation for this employee
                            </p>
                          </div>

                          <StatusBadge
                            status={employeePayslip.status}
                          />
                        </div>

                        {/* HOURS */}
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                          <InfoItem
                            label="Regular Hours"
                            value={`${numberValue(
                              employeePayslip.regularHours,
                            ).toFixed(2)}h`}
                          />

                          <InfoItem
                            label="Overtime"
                            value={`${numberValue(
                              employeePayslip.overtimeHours,
                            ).toFixed(2)}h`}
                          />

                          <InfoItem
                            label="Paid Leave Hours"
                            value={`${numberValue(
                              employeePayslip.paidLeaveHours,
                            ).toFixed(2)}h`}
                          />
                        </div>

                        {/* EARNINGS */}
                        <div className="mt-4 border-t border-zinc-800 pt-4">
                          <p className="mb-3 text-[9px] font-mono uppercase tracking-wider text-zinc-600">
                            Earnings
                          </p>

                          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                            <InfoItem
                              label="Regular Pay"
                              value={money(
                                employeePayslip.regularPay,
                              )}
                            />

                            <InfoItem
                              label="Overtime Pay"
                              value={money(
                                employeePayslip.overtimePay,
                              )}
                            />

                            <InfoItem
                              label="Gross Pay"
                              value={money(
                                employeePayslip.grossPay,
                              )}
                            />
                          </div>
                        </div>

                        {/* DEDUCTIONS + NET */}
                        <div className="mt-4 border-t border-zinc-800 pt-4">
                          <p className="mb-3 text-[9px] font-mono uppercase tracking-wider text-zinc-600">
                            Deductions & Net Pay
                          </p>

                          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                            <InfoItem
                              label="Tax Deductions"
                              value={money(
                                employeePayslip.taxDeductions,
                              )}
                            />

                            <InfoItem
                              label="Other Deductions"
                              value={money(
                                employeePayslip.otherDeductions,
                              )}
                            />

                            <InfoItem
                              label="Net Pay"
                              value={
                                <span className="font-mono font-bold text-emerald-400">
                                  {money(
                                    employeePayslip.netPay,
                                  )}
                                </span>
                              }
                            />
                          </div>
                        </div>

                        {/* PAYMENT */}
                        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-zinc-800 pt-4 sm:grid-cols-2">
                          <InfoItem
                            label="Payment Method"
                            value={
                              employeePayslip.paymentMethod ??
                              "—"
                            }
                          />

                          <InfoItem
                            label="Payslip Status"
                            value={
                              <StatusBadge
                                status={
                                  employeePayslip.status
                                }
                              />
                            }
                          />
                        </div>

                        {/* CREATED DATE */}
                        {employeePayslip.createdAt && (
                          <div className="mt-4 border-t border-zinc-800 pt-3">
                            <p className="text-[9px] font-mono uppercase tracking-wider text-zinc-600">
                              Payroll Record Created
                            </p>

                            <p className="mt-1 font-mono text-[10px] text-zinc-400">
                              {formatDateTime(
                                employeePayslip.createdAt,
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* ==================================================
              OPERATIONAL RECORD STATUS
          ================================================== */}

          <Section
            title="Operational Record Status"
            icon={<CheckCircle2 size={15} />}
          >
            <div className="space-y-2">
              <RecordStatus
                label="Employee record"
                active={Boolean(staff)}
              />

              <RecordStatus
                label="Current compensation"
                active={Boolean(currentWage)}
              />

              <RecordStatus
                label="Attendance records"
                active={attendance.length > 0}
              />

              <RecordStatus
                label="Shift schedules"
                active={
                  shiftLoading ||
                  schedules.length > 0
                }
              />

              <RecordStatus
                label="Leave records"
                active={leaves.length > 0}
              />

              <RecordStatus
                label="Payroll records"
                active={payrollRuns.length > 0}
              />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SMALL COMPONENTS
// ============================================================

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <span className="block text-[10px] text-zinc-600">
        {label}
      </span>

      <div className="text-xs font-medium text-zinc-200">
        {value}
      </div>
    </div>
  );
}

function RecordStatus({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2.5">
      <span className="text-xs text-zinc-400">
        {label}
      </span>

      {active ? (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
          <CheckCircle2 size={12} />
          Available
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-[10px] text-zinc-600">
          <XCircle size={12} />
          No records
        </span>
      )}
    </div>
  );
}

function LoadingState({
  label,
}: {
  label: string;
}) {
  return (
    <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/40">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Loader2
          size={15}
          className="animate-spin text-emerald-400"
        />

        <span>{label}</span>
      </div>
    </div>
  );
}

function KpiBox({
  label,
  value,
  valueClass = "text-white",
}: {
  label: string;
  value: string | number;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
      <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-600">
        {label}
      </span>

      <p
        className={`mt-1 font-mono text-lg font-semibold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}