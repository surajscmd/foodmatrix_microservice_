"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  History,
  Loader2,
  MapPin,
  UserRound,
  WalletCards,
  XCircle,
} from "lucide-react";

import {
  getAttendance,
  getCurrentWage,
  getLeaves,
  getPayrollRuns,
  getPayslipsByStaff,
  getShiftSchedules,
  getStaffById,
  getWages,
  type AttendanceShift,
  type LeaveRecord,
  type PayrollRun,
  type Payslip,
  type ShiftSchedule,
  type Staff,
  type WageHistory,
} from "@/lib/hr-api";

interface StaffInformationViewProps {
  staffId: string;
  restaurantName?: string;
  onBack: () => void;
}

function formatDate(
  value?: string | null,
) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

function formatDateTime(
  value?: string | null,
) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function money(
  value?: string | number | null,
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
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

function numberValue(
  value?: string | number | null,
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
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
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

    case "PENDING":
    case "SCHEDULED":
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

function StatusBadge({
  status,
}: {
  status?: string;
}) {
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
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 ${className}`}
    >
      <div className="mb-5 flex items-center gap-2 border-b border-zinc-800 pb-3">
        <span className="text-emerald-400">
          {icon}
        </span>

        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
          {title}
        </h3>
      </div>

      {children}
    </section>
  );
}

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 py-8 text-center">
      <p className="text-xs text-zinc-600">
        {message}
      </p>
    </div>
  );
}

export default function StaffInformationView({
  staffId,
  restaurantName,
  onBack,
}: StaffInformationViewProps) {
  const [staff, setStaff] =
    useState<Staff | null>(null);

  const [currentWage, setCurrentWage] =
    useState<WageHistory | null>(null);

  const [wages, setWages] =
    useState<WageHistory[]>([]);

  const [attendance, setAttendance] =
    useState<AttendanceShift[]>([]);

  const [schedules, setSchedules] =
    useState<ShiftSchedule[]>([]);

  const [leaves, setLeaves] =
    useState<LeaveRecord[]>([]);

  const [payslips, setPayslips] =
    useState<Payslip[]>([]);

  const [payrollRuns, setPayrollRuns] =
    useState<PayrollRun[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * ---------------------------------------------------------
   * LOAD COMPLETE STAFF DATA
   * ---------------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setError(null);

        /*
         * First get staff because restaurantId is
         * required for the payroll scope.
         */
        const staffResponse =
          await getStaffById(staffId);

        if (cancelled) return;

        const employee =
          staffResponse.data;

        setStaff(employee);

        /*
         * Fetch every employee-related operational
         * resource independently.
         *
         * allSettled means one unavailable resource
         * does not destroy the complete employee view.
         */
        const results =
          await Promise.allSettled([
            getCurrentWage(staffId),

            getWages(
              staffId,
              1,
              100,
            ),

            getAttendance({
              staffId,
            }),

            getShiftSchedules({
              staffId,
            }),

            getLeaves({
              staffId,
            }),

            getPayslipsByStaff(
              staffId,
            ),

            getPayrollRuns(
              employee.restaurantId,
            ),
          ]);

        if (cancelled) return;

        const [
          currentWageResult,
          wagesResult,
          attendanceResult,
          schedulesResult,
          leavesResult,
          payslipsResult,
          payrollResult,
        ] = results;

        if (
          currentWageResult.status ===
          "fulfilled"
        ) {
          setCurrentWage(
            currentWageResult.value.data,
          );
        }

        if (
          wagesResult.status ===
          "fulfilled"
        ) {
          setWages(
            wagesResult.value.data?.data ??
              [],
          );
        }

        if (
          attendanceResult.status ===
          "fulfilled"
        ) {
          setAttendance(
            attendanceResult.value.data ??
              [],
          );
        }

        if (
          schedulesResult.status ===
          "fulfilled"
        ) {
          setSchedules(
            schedulesResult.value.data ??
              [],
          );
        }

        if (
          leavesResult.status ===
          "fulfilled"
        ) {
          setLeaves(
            leavesResult.value.data ??
              [],
          );
        }

        if (
          payslipsResult.status ===
          "fulfilled"
        ) {
          setPayslips(
            payslipsResult.value.data ??
              [],
          );
        }

        if (
          payrollResult.status ===
          "fulfilled"
        ) {
          /*
           * Payroll runs are restaurant-wide.
           * Keep only runs containing this employee's
           * payslip.
           */
          const employeePayrollRuns =
            (
              payrollResult.value.data ??
              []
            ).filter((run) =>
              run.payslips?.some(
                (payslip) =>
                  payslip.staffId ===
                  staffId,
              ),
            );

          setPayrollRuns(
            employeePayrollRuns,
          );
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

  /*
   * ---------------------------------------------------------
   * DERIVED DATA
   * ---------------------------------------------------------
   */

  const completedAttendance =
    useMemo(
      () =>
        attendance.filter(
          (record) =>
            record.clockOutAt !== null,
        ),
      [attendance],
    );

  const totalHours = useMemo(
    () =>
      attendance.reduce(
        (total, record) =>
          total +
          numberValue(record.totalHours),
        0,
      ),
    [attendance],
  );

  const overtimeHours = useMemo(
    () =>
      attendance.reduce(
        (total, record) =>
          total +
          numberValue(
            record.overtimeHours,
          ),
        0,
      ),
    [attendance],
  );

  const approvedLeaves =
    leaves.filter(
      (leave) =>
        leave.status === "APPROVED",
    ).length;

  const pendingLeaves =
    leaves.filter(
      (leave) =>
        leave.status === "PENDING",
    ).length;

  const latestPayslip =
    payslips[0] ?? null;

  const latestPayroll =
    payrollRuns[0] ?? null;

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500">
          <Loader2
            className="animate-spin text-emerald-400"
            size={18}
          />

          <span className="text-xs">
            Loading complete employee
            information...
          </span>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * ERROR
   * ---------------------------------------------------------
   */

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

  return (
    <div className="space-y-6 animate-fade-in p-6">

      {/* =====================================================
          HEADER
          ===================================================== */}

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

              <StatusBadge
                status={staff.status}
              />
            </div>

            <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
              {staff.firstName}{" "}
              {staff.lastName}
            </h2>

            <p className="mt-0.5 text-xs text-zinc-500">
              {staff.role}
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          KPI
          ===================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

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

          <Clock3 className="text-emerald-400" size={20} />
        </div>

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

        <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Latest Net Pay
            </span>

            <h4 className="mt-1 font-mono text-lg font-bold text-emerald-400">
              {money(
                latestPayslip?.netPay,
              )}
            </h4>

            <p className="text-[10px] text-zinc-600">
              Latest payslip
            </p>
          </div>

          <WalletCards
            className="text-emerald-400"
            size={20}
          />
        </div>

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

      {/* =====================================================
          MAIN GRID
          ===================================================== */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

        {/* LEFT */}
        <div className="space-y-6 lg:col-span-7">

          {/* EMPLOYEE INFORMATION */}

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
                value={
                  <StatusBadge
                    status={staff.status}
                  />
                }
              />

              <InfoItem
                label="Restaurant"
                value={
                  restaurantName ??
                  staff.restaurantId
                }
              />

              <InfoItem
                label="Joined"
                value={formatDate(
                  staff.createdAt,
                )}
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

          {/* COMPENSATION */}

          <Section
            title="Compensation & Wage History"
            icon={<Banknote size={15} />}
          >
            {currentWage && (
              <div className="mb-5 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04] p-4">

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                  <InfoItem
                    label="Current Pay Type"
                    value={
                      currentWage.payType
                    }
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
                      <th className="pb-3">Pay Type</th>
                      <th className="pb-3">Rate / Salary</th>
                      <th className="pb-3">Overtime</th>
                      <th className="pb-3">Effective</th>
                      <th className="pb-3">Ended</th>
                    </tr>
                  </thead>

                  <tbody>
                    {wages.map(
                      (wage) => (
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
                      ),
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </Section>

          {/* ATTENDANCE */}

          <Section
            title="Attendance & Timecards"
            icon={<Clock3 size={15} />}
          >
            {attendance.length === 0 ? (
              <EmptyState message="No attendance records found for this employee." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-600">
                      <th className="pb-3">
                        Date
                      </th>
                      <th className="pb-3">
                        Shift
                      </th>
                      <th className="pb-3">
                        Clock In
                      </th>
                      <th className="pb-3">
                        Clock Out
                      </th>
                      <th className="pb-3">
                        Hours
                      </th>
                      <th className="pb-3">
                        Regular
                      </th>
                      <th className="pb-3">
                        Overtime
                      </th>
                      <th className="pb-3">
                        Payroll
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {attendance.map(
                      (record) => (
                        <tr
                          key={record.id}
                          className="border-b border-zinc-800/60 last:border-0"
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

                          <td className="py-3 font-mono text-zinc-300">
                            {formatDateTime(
                              record.clockOutAt,
                            )}
                          </td>

                          <td className="py-3 font-mono text-white">
                            {numberValue(
                              record.totalHours,
                            ).toFixed(2)}
                            h
                          </td>

                          <td className="py-3 font-mono text-zinc-400">
                            {numberValue(
                              record.regularHours,
                            ).toFixed(2)}
                          </td>

                          <td className="py-3 font-mono text-amber-400">
                            {numberValue(
                              record.overtimeHours,
                            ).toFixed(2)}
                          </td>

                          <td className="py-3">
                            {record.isProcessedForPay ? (
                              <span className="text-emerald-400">
                                Processed
                              </span>
                            ) : (
                              <span className="text-zinc-600">
                                Unprocessed
                              </span>
                            )}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {/* SHIFTS */}

          <Section
            title="Shift Schedule"
            icon={<CalendarDays size={15} />}
          >
            {schedules.length === 0 ? (
              <EmptyState message="No scheduled shifts found." />
            ) : (
              <div className="space-y-2">
                {schedules.map(
                  (schedule) => (
                    <div
                      key={schedule.id}
                      className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 sm:grid-cols-5 sm:items-center"
                    >
                      <div>
                        <span className="block text-[10px] text-zinc-600">
                          Date
                        </span>

                        <span className="text-xs text-zinc-300">
                          {formatDate(
                            schedule.scheduledStart,
                          )}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[10px] text-zinc-600">
                          Start
                        </span>

                        <span className="font-mono text-xs text-white">
                          {formatDateTime(
                            schedule.scheduledStart,
                          )}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[10px] text-zinc-600">
                          End
                        </span>

                        <span className="font-mono text-xs text-white">
                          {formatDateTime(
                            schedule.scheduledEnd,
                          )}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[10px] text-zinc-600">
                          Template
                        </span>

                        <span className="text-xs text-zinc-300">
                          {schedule
                            .shiftTemplate
                            ?.name ??
                            schedule
                              .shiftTemplate
                              ?.type ??
                            "—"}
                        </span>
                      </div>

                      <div className="sm:text-right">
                        <StatusBadge
                          status={
                            schedule.status
                          }
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </Section>
        </div>

        {/* RIGHT */}
        <div className="space-y-6 lg:col-span-5">

          {/* LEAVE */}

          <Section
            title="Leave History"
            icon={<CalendarDays size={15} />}
          >
            {leaves.length === 0 ? (
              <EmptyState message="No leave records found." />
            ) : (
              <div className="space-y-3">
                {leaves.map(
                  (leave) => (
                    <div
                      key={leave.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4"
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
                          status={
                            leave.status
                          }
                        />
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-zinc-800 pt-3">
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
                            leave.totalDays ??
                            "—"
                          }
                        />
                      </div>

                      {leave.reason && (
                        <p className="mt-3 border-t border-zinc-800 pt-3 text-[10px] text-zinc-500">
                          {leave.reason}
                        </p>
                      )}
                    </div>
                  ),
                )}
              </div>
            )}
          </Section>

          {/* PAYROLL */}

          <Section
            title="Payroll History"
            icon={<WalletCards size={15} />}
          >
            {payrollRuns.length === 0 ? (
              <EmptyState message="No payroll runs containing this employee were found." />
            ) : (
              <div className="space-y-3">
                {payrollRuns.map(
                  (run) => {
                    const employeePayslip =
                      run.payslips?.find(
                        (payslip) =>
                          payslip.staffId ===
                          staffId,
                      );

                    return (
                      <div
                        key={run.id}
                        className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">

                          <div>
                            <p className="text-xs font-semibold text-white">
                              Payroll Period
                            </p>

                            <p className="mt-1 font-mono text-[10px] text-zinc-500">
                              {formatDate(
                                run.periodStartDate,
                              )}{" "}
                              →{" "}
                              {formatDate(
                                run.periodEndDate,
                              )}
                            </p>
                          </div>

                          <StatusBadge
                            status={
                              run.status
                            }
                          />
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">

                          <InfoItem
                            label="Gross"
                            value={money(
                              employeePayslip?.grossPay ??
                                run.totalGrossPay,
                            )}
                          />

                          <InfoItem
                            label="Taxes"
                            value={money(
                              employeePayslip?.taxDeductions,
                            )}
                          />

                          <InfoItem
                            label="Net Pay"
                            value={money(
                              employeePayslip?.netPay ??
                                run.totalNetPay,
                            )}
                          />
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </Section>

          {/* PAYSLIPS */}

          <Section
            title="Payslips"
            icon={<FileText size={15} />}
          >
            {payslips.length === 0 ? (
              <EmptyState message="No payslips found for this employee." />
            ) : (
              <div className="space-y-3">
                {payslips.map(
                  (payslip) => (
                    <div
                      key={payslip.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">

                        <div>
                          <p className="font-mono text-[10px] text-zinc-500">
                            Payslip
                          </p>

                          <p className="mt-1 text-xs font-semibold text-white">
                            {payslip.id}
                          </p>
                        </div>

                        <StatusBadge
                          status={
                            payslip.status
                          }
                        />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">

                        <InfoItem
                          label="Regular Hours"
                          value={`${numberValue(
                            payslip.regularHours,
                          ).toFixed(2)}h`}
                        />

                        <InfoItem
                          label="Overtime"
                          value={`${numberValue(
                            payslip.overtimeHours,
                          ).toFixed(2)}h`}
                        />

                        <InfoItem
                          label="Regular Pay"
                          value={money(
                            payslip.regularPay,
                          )}
                        />

                        <InfoItem
                          label="Overtime Pay"
                          value={money(
                            payslip.overtimePay,
                          )}
                        />

                        <InfoItem
                          label="Gross Pay"
                          value={money(
                            payslip.grossPay,
                          )}
                        />

                        <InfoItem
                          label="Tax Deductions"
                          value={money(
                            payslip.taxDeductions,
                          )}
                        />

                        <InfoItem
                          label="Other Deductions"
                          value={money(
                            payslip.otherDeductions,
                          )}
                        />

                        <InfoItem
                          label="Net Pay"
                          value={money(
                            payslip.netPay,
                          )}
                        />
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3 text-[10px] text-zinc-500">
                        <span>
                          Payment:{" "}
                          <span className="text-zinc-300">
                            {
                              payslip.paymentMethod
                            }
                          </span>
                        </span>

                        {payslip.createdAt && (
                          <span>
                            {formatDate(
                              payslip.createdAt,
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </Section>

          {/* PAYROLL / DATA HEALTH */}

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
                active={Boolean(
                  currentWage,
                )}
              />

              <RecordStatus
                label="Attendance records"
                active={
                  attendance.length > 0
                }
              />

              <RecordStatus
                label="Shift schedules"
                active={
                  schedules.length > 0
                }
              />

              <RecordStatus
                label="Leave records"
                active={
                  leaves.length > 0
                }
              />

              <RecordStatus
                label="Payroll records"
                active={
                  payrollRuns.length > 0
                }
              />

              <RecordStatus
                label="Payslips"
                active={
                  payslips.length > 0
                }
              />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}


/* =========================================================
   SMALL COMPONENTS
   ========================================================= */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
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