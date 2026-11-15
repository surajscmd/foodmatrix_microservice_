import { CalendarClock, LogOut } from "lucide-react";
import type { AttendanceShift } from "@/lib/hr-api";
import { secondary } from "@/elements/restaurantworkforce/shared";

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
  SCHEDULED: "border-sky-400/20 bg-sky-400/10 text-sky-200",
  COMPLETED: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  "CLOCKED IN": "border-amber-400/20 bg-amber-400/10 text-amber-200",
  MISSED: "border-rose-400/20 bg-rose-400/10 text-rose-200",
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
      <thead className="border-b border-white/8 bg-[#191c22] text-[11px] text-zinc-300">
        <tr>
          <th scope="col" className="px-3 py-2.5 font-medium @2xl:px-4">
            Employee
          </th>
          <th
            scope="col"
            className="hidden w-[28%] px-3 py-2.5 text-center font-medium @2xl:table-cell"
          >
            {scheduled ? "Shift hours" : "Clock in / out"}
          </th>
          <th
            scope="col"
            className={`px-2 py-2.5 text-center font-medium @2xl:w-32 ${hasActions ? "w-36" : "w-28"}`}
          >
            Status
            {hasActions && <span className="@2xl:hidden"> &amp; actions</span>}
          </th>
          {hasActions && (
            <th
              scope="col"
              className="hidden w-36 px-3 py-2.5 text-center font-medium @2xl:table-cell"
            >
              Actions
            </th>
          )}
        </tr>
      </thead>
      <tbody className="divide-y divide-white/8">
        {rows.map((row) => {
          const { firstName, lastName, employeeCode, role } = row.staff;
          const name = `${firstName} ${lastName}`;
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
              className={
                secondary +
                " max-w-full whitespace-nowrap" +
                (action.dialog
                  ? ""
                  : " border-amber-300/25 bg-amber-300/10 text-amber-100 enabled:hover:bg-amber-300/20")
              }
            >
              <Icon size={14} className="shrink-0" aria-hidden />
              <span>{action.saving ? "Saving…" : action.label}</span>
            </button>
          );

          return (
            <tr
              key={row.id}
              className="bg-[#111217] align-middle transition-colors even:bg-[#14161c] hover:bg-[#162522] focus-within:bg-[#162522]"
            >
              <th scope="row" className="px-3 py-2.5 font-normal @2xl:px-4">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden
                    className="hidden size-8 shrink-0 place-items-center rounded-lg border border-teal-300/20 bg-teal-300/10 text-[11px] font-semibold uppercase text-teal-100 @md:grid"
                  >
                    {firstName[0]}
                    {lastName[0]}
                  </span>
                  <div className="min-w-0">
                    <p className="break-words text-xs font-semibold text-white">
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
              <td className="hidden px-3 py-2.5 text-center text-xs tabular-nums text-zinc-200 @2xl:table-cell">
                {times}
                {row.hours && (
                  <p className="mt-0.5 text-[11px] text-zinc-400">
                    {row.hours} worked
                  </p>
                )}
              </td>
              <td className="px-2 py-2.5">
                <div className="flex flex-col items-center gap-1 text-center">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${statusColor[row.status] ?? "border-white/15 bg-white/5 text-zinc-300"}`}
                  >
                    {row.status.toLowerCase().replaceAll("_", " ")}
                  </span>
                  {row.approvedLeave && (
                    <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-0.5 text-[11px] text-amber-200">
                      Approved leave
                    </span>
                  )}
                  {actionButton && (
                    <div className="mt-0.5 @2xl:hidden">{actionButton}</div>
                  )}
                </div>
              </td>
              {hasActions && (
                <td className="hidden px-3 py-2.5 text-center @2xl:table-cell">
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
