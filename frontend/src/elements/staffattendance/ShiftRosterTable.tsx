import { CalendarClock, LogOut } from "lucide-react";
import type { AttendanceShift } from "@/lib/hr-api";

type RosterRow = {
  id: string;
  staff: AttendanceShift["staff"];
  template?: string;
  start: string;
  end?: string;
  hours?: string;
  status: string;
  approvedLeave?: boolean;
  action?: {
    label: string;
    onClick: () => void;
    dialog?: boolean;
    disabled?: boolean;
    saving?: boolean;
  };
};

const statusColor: Record<string, string> = {
  SCHEDULED: "border-sky-500/20 bg-sky-500/10 text-sky-400",
  COMPLETED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  "CLOCKED IN": "border-amber-500/20 bg-amber-500/10 text-amber-400",
  MISSED: "border-rose-500/20 bg-rose-500/10 text-rose-400",
};

export default function ShiftRosterTable({
  rows,
  scheduled,
}: {
  rows: RosterRow[];
  scheduled: boolean;
}) {
  const hasActions = rows.some((row) => row.action);

  return (
    <table className="w-full table-fixed text-left">
      <caption className="sr-only">
        {scheduled ? "Scheduled shifts" : "Attendance punches"}
      </caption>
      <thead className="border-b border-zinc-800 bg-zinc-950/80 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-600">
        <tr>
          <th scope="col" className="px-3 py-3 font-bold @2xl:px-5">
            Employee
          </th>
          <th
            scope="col"
            className="hidden w-[28%] px-3 py-3 text-center font-bold @2xl:table-cell"
          >
            {scheduled ? "Shift hours" : "Clock in / out"}
          </th>
          <th
            scope="col"
            className={`px-2 py-3 text-center font-bold @2xl:w-32 ${hasActions ? "w-36" : "w-28"}`}
          >
            Status
            {hasActions && <span className="@2xl:hidden"> &amp; actions</span>}
          </th>
          {hasActions && (
            <th
              scope="col"
              className="hidden w-36 px-3 py-3 text-center font-bold @2xl:table-cell"
            >
              Actions
            </th>
          )}
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-800/70">
        {rows.map((row) => {
          const { firstName, lastName, employeeCode, role } = row.staff;
          const name = `${firstName} ${lastName}`;
          const statusDot =
            row.status === "SCHEDULED"
              ? "bg-sky-400"
              : row.status === "COMPLETED"
                ? "bg-emerald-400"
                : row.status === "CLOCKED IN"
                  ? "bg-amber-400"
                  : row.status === "MISSED"
                    ? "bg-rose-400"
                    : "bg-zinc-500";
          const times = (
            <span>
              <span className="whitespace-nowrap">{row.start}</span>
              {row.end && (
                <>
                  {" "}
                  – <span className="whitespace-nowrap">{row.end}</span>
                </>
              )}
            </span>
          );
          const action = row.action;
          const Icon = action?.dialog ? CalendarClock : LogOut;
          const actionButton = action && (
            <button
              type="button"
              aria-label={`${action.label} for ${name}`}
              aria-haspopup={action.dialog ? "dialog" : undefined}
              disabled={action.disabled}
              onClick={action.onClick}
              className={`inline-flex min-h-8 max-w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-50 ${action.dialog ? "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-emerald-500/30 hover:bg-zinc-900 hover:text-emerald-300" : "border-amber-500/20 bg-amber-500/10 text-amber-400 enabled:hover:bg-amber-500/20"}`}
            >
              <Icon size={14} className="shrink-0" aria-hidden />
              <span>{action.saving ? "Saving…" : action.label}</span>
            </button>
          );

          return (
            <tr
              key={row.id}
              className="group align-middle transition-colors duration-200 hover:bg-zinc-900/80 focus-within:bg-zinc-900/80"
            >
              <th scope="row" className="px-3 py-4 font-normal @2xl:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden
                    className="relative hidden size-10 shrink-0 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-[11px] font-semibold uppercase text-emerald-400 transition-colors group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 @md:grid"
                  >
                    {firstName[0]}
                    {lastName[0]}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-zinc-950 ${statusDot}`}
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium leading-5 text-zinc-100">
                      {name}
                    </p>
                    <p className="mt-0.5 break-words text-[11px] text-zinc-400">
                      {row.template ?? role} ·{" "}
                      <span className="font-mono">{employeeCode}</span>
                    </p>
                    <p className="mt-0.5 text-xs tabular-nums text-zinc-300 @2xl:hidden">
                      {times}
                      {row.hours && (
                        <span className="text-zinc-400"> · {row.hours}</span>
                      )}
                    </p>
                  </div>
                </div>
              </th>
              <td className="hidden px-3 py-4 text-center text-xs tabular-nums text-zinc-200 @2xl:table-cell">
                {times}
                {row.hours && (
                  <p className="mt-0.5 text-[11px] text-zinc-400">
                    {row.hours} worked
                  </p>
                )}
              </td>
              <td className="px-2 py-4">
                <div className="flex flex-col items-center gap-1 text-center">
                  <span
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider ${statusColor[row.status] ?? "border-zinc-700 bg-zinc-800/50 text-zinc-400"}`}
                  >
                    <span
                      aria-hidden
                      className="size-1.5 rounded-full bg-current"
                    />
                    {row.status.toLowerCase().replaceAll("_", " ")}
                  </span>
                  {row.approvedLeave && (
                    <span className="rounded-lg border border-amber-300/20 bg-amber-300/10 px-2 py-0.5 text-[11px] text-amber-200">
                      Approved leave
                    </span>
                  )}
                  {actionButton && (
                    <div className="mt-0.5 @2xl:hidden">{actionButton}</div>
                  )}
                </div>
              </td>
              {hasActions && (
                <td className="hidden px-3 py-4 text-center @2xl:table-cell">
                  {actionButton}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
