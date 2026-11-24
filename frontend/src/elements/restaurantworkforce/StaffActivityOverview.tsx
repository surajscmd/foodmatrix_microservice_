import { useCallback, useState, type ReactNode } from "react";
import { CalendarDays, Clock3, History, WalletCards } from "lucide-react";
import { getAttendance, getLeaves, getPayslips } from "@/lib/hr-api";
import {
  monthQuery,
  moveMonth,
  restaurantDate,
} from "@/elements/staffattendance/report-dates";
import { dayLabel, input, money, secondary, useWorkforceQuery } from "./shared";
import StaffDetailSection from "./StaffDetailSection";
import DetailMetricCard from "@/elements/shared/DetailMetricCard";
import WorkforceTableStatus from "./WorkforceTableStatus";

export default function StaffActivityOverview({
  staffId,
  currency,
  today,
  timeZone,
  children,
}: {
  staffId: string;
  currency: string;
  today: string;
  timeZone: string;
  children: ReactNode;
}) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const [revision, setRevision] = useState(0);
  const load = useCallback(async () => {
    const range = monthQuery(month);
    const [attendance, leaves, payslips] = await Promise.allSettled([
      getAttendance({ staffId, ...range }),
      getLeaves({ staffId, ...range }),
      getPayslips({ staffId }),
    ]);
    const start = `${month}-01`;
    const end = `${moveMonth(month, 1)}-01`;
    return {
      attendance:
        attendance.status === "fulfilled"
          ? attendance.value.data
              .filter((row) => {
                const day = restaurantDate(row.clockInAt, timeZone);
                return day >= start && day < end;
              })
              .sort((a, b) => b.clockInAt.localeCompare(a.clockInAt))
          : undefined,
      leaves:
        leaves.status === "fulfilled"
          ? leaves.value.data
              .filter(
                (row) =>
                  row.startDate.slice(0, 10) < end &&
                  row.endDate.slice(0, 10) >= start,
              )
              .sort((a, b) => b.startDate.localeCompare(a.startDate))
          : undefined,
      payslips:
        payslips.status === "fulfilled"
          ? [...payslips.value.data].sort((a, b) =>
              (b.payrollRun?.periodEndDate ?? b.createdAt ?? "").localeCompare(
                a.payrollRun?.periodEndDate ?? a.createdAt ?? "",
              ),
            )
          : undefined,
    };
  }, [month, staffId, timeZone]);
  const { data, loading, error } = useWorkforceQuery(
    `${staffId}/${month}/${revision}`,
    load,
    "Unable to load employee activity.",
  );
  const attendance = data?.attendance;
  const leaves = data?.leaves;
  const closed = attendance?.filter((row) => row.clockOutAt);
  const hours = (field: "totalHours" | "overtimeHours") =>
    closed?.reduce((sum, row) => {
      const amount = Number(row[field]);
      return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);
  const approved = leaves?.filter(
    (leave) => leave.status === "APPROVED",
  ).length;
  const pending = leaves?.filter((leave) => leave.status === "PENDING").length;
  const time = new Intl.DateTimeFormat("en-IN", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  });
  const metrics = [
    {
      label: "Attendance hours",
      value: attendance ? `${hours("totalHours")?.toFixed(2)}h` : "—",
      detail: attendance
        ? `${closed?.length} completed shifts`
        : "Attendance unavailable",
      icon: Clock3,
      tone: "emerald" as const,
    },
    {
      label: "Overtime",
      value: attendance ? `${hours("overtimeHours")?.toFixed(2)}h` : "—",
      detail: "Recorded overtime in selected month",
      icon: History,
      tone: "amber" as const,
    },
    {
      label: "Latest net pay",
      value: data?.payslips ? money(data.payslips[0]?.netPay, currency) : "—",
      detail:
        data?.payslips?.length === 0
          ? "No payslips recorded"
          : "Latest payroll record · all periods",
      icon: WalletCards,
      tone: "violet" as const,
    },
    {
      label: "Approved leave",
      value: approved ?? "—",
      detail: leaves
        ? `${pending} pending in selected month`
        : "Leave history unavailable",
      icon: CalendarDays,
      tone: "sky" as const,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-zinc-500">
          Attendance and leave for the selected month · {timeZone}
        </p>
        <label className="flex items-center gap-2 text-[11px] text-zinc-400">
          Month
          <input
            type="month"
            aria-label="Employee activity month"
            value={month}
            onChange={(event) => {
              if (/^\d{4}-\d{2}$/.test(event.target.value))
                setMonth(event.target.value);
            }}
            className={input + " w-auto"}
          />
        </label>
      </div>
      <div
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-busy={loading}
      >
        {metrics.map(({ label, value, detail, icon, tone }) => (
          <DetailMetricCard
            key={label}
            title={label}
            value={loading ? "—" : value}
            description={loading ? "Loading activity…" : detail}
            icon={icon}
            tone={tone}
          />
        ))}
      </div>
      {(error || (data && (!attendance || !leaves || !data.payslips))) && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-300"
        >
          <p>
            {error ||
              "Some employee activity is unavailable. Other details remain available."}
          </p>
          <button
            type="button"
            className={secondary}
            onClick={() => setRevision((value) => value + 1)}
          >
            Retry
          </button>
        </div>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="min-w-0 space-y-6 lg:col-span-7">{children}</div>
        <div className="min-w-0 space-y-6 lg:col-span-5">
          <StaffDetailSection title="Attendance & timecards" icon={Clock3}>
            {loading ? (
              <p role="status" className="text-xs text-zinc-500">
                Loading attendance…
              </p>
            ) : !attendance?.length ? (
              <p className="rounded-xl border border-dashed border-zinc-800 p-6 text-center text-xs text-zinc-500">
                {attendance
                  ? "No attendance records in this month."
                  : "Attendance unavailable."}
              </p>
            ) : (
              <div className="max-h-96 overflow-auto">
                <table className="w-full min-w-72 text-left text-xs">
                  <caption className="sr-only">Employee attendance</caption>
                  <thead className="border-b border-zinc-800 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                    <tr>
                      <th className="py-2">Date</th>
                      <th className="px-2 py-2">Clock in / out</th>
                      <th className="py-2 text-right">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/70">
                    {attendance.map((row) => (
                      <tr key={row.id}>
                        <td className="py-3 text-zinc-300">
                          {dayLabel(restaurantDate(row.clockInAt, timeZone))}
                        </td>
                        <td className="px-2 py-3 text-[11px] tabular-nums text-zinc-400">
                          <p>
                            {time.format(new Date(row.clockInAt))} –{" "}
                            {row.clockOutAt
                              ? time.format(new Date(row.clockOutAt))
                              : "Clocked in"}
                          </p>
                          {row.clockOutAt &&
                            restaurantDate(row.clockOutAt, timeZone) !==
                              restaurantDate(row.clockInAt, timeZone) && (
                              <p className="mt-1 text-[10px] text-zinc-500">
                                Ended{" "}
                                {dayLabel(
                                  restaurantDate(row.clockOutAt, timeZone),
                                )}
                              </p>
                            )}
                        </td>
                        <td className="py-3 text-right font-mono text-zinc-200">
                          {row.clockOutAt && row.totalHours != null
                            ? Number(row.totalHours).toFixed(2)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </StaffDetailSection>
          <StaffDetailSection title="Leave history" icon={CalendarDays}>
            {loading ? (
              <p role="status" className="text-xs text-zinc-500">
                Loading leave history…
              </p>
            ) : !leaves?.length ? (
              <p className="rounded-xl border border-dashed border-zinc-800 p-6 text-center text-xs text-zinc-500">
                {leaves
                  ? "No leave records in this month."
                  : "Leave history unavailable."}
              </p>
            ) : (
              <ul className="max-h-96 divide-y divide-zinc-800/70 overflow-auto">
                {leaves.map((leave) => (
                  <li
                    key={leave.id}
                    className="space-y-2 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-medium text-zinc-200">
                        {leave.type}
                      </p>
                      <WorkforceTableStatus value={leave.status} />
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      {dayLabel(leave.startDate)} – {dayLabel(leave.endDate)} ·{" "}
                      {leave.isPaidLeave ? "Paid" : "Unpaid"}
                    </p>
                    {leave.reason && (
                      <p className="break-words text-[11px] leading-5 text-zinc-500">
                        {leave.reason}
                      </p>
                    )}
                    {leave.revokeReason && (
                      <p className="break-words text-[11px] leading-5 text-zinc-500">
                        Revocation: {leave.revokeReason}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </StaffDetailSection>
        </div>
      </div>
    </div>
  );
}
