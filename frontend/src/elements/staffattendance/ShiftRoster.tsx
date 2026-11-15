import {
  CalendarDays,
  ClipboardList,
  Clock3,
  LogIn,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";
import type { AttendanceShift, ShiftSchedule } from "@/lib/hr-api";
import { Empty, input, panel } from "@/elements/restaurantworkforce/shared";
import ShiftRosterTable from "./ShiftRosterTable";
import { restaurantDate } from "./report-dates";

export default function ShiftRoster({
  schedules,
  punches,
  timeZone,
  pending,
  onClockOut,
  onEditShift,
  onLeave,
}: {
  schedules: ShiftSchedule[];
  punches: AttendanceShift[];
  timeZone: string;
  pending: string | null;
  onClockOut: (shiftId: string) => void;
  onEditShift?: (shift: ShiftSchedule) => void;
  onLeave: ReadonlySet<string>;
}) {
  const [view, setView] = useState<"schedule" | "attendance" | "open">(
    "schedule",
  );
  const [query, setQuery] = useState("");
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const matches = ({
    firstName,
    lastName,
    role,
    employeeCode,
  }: AttendanceShift["staff"]) => {
    const searchable =
      `${firstName} ${lastName} ${role} ${employeeCode}`.toLowerCase();
    return terms.every((term) => searchable.includes(term));
  };
  const openPunches = punches.filter((punch) => !punch.clockOutAt);
  const views = [
    {
      id: "schedule",
      label: "Scheduled shifts",
      count: schedules.length,
      Icon: CalendarDays,
    },
    {
      id: "attendance",
      label: "All punches",
      count: punches.length,
      Icon: LogIn,
    },
    {
      id: "open",
      label: "Open punches",
      count: openPunches.length,
      Icon: Clock3,
    },
  ] as const;
  const clock = new Intl.DateTimeFormat("en-IN", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  });
  const dateClock = new Intl.DateTimeFormat("en-IN", {
    timeZone,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  function displayEnd(start: string, end: string) {
    const formatter =
      restaurantDate(start, timeZone) === restaurantDate(end, timeZone)
        ? clock
        : dateClock;
    return formatter.format(new Date(end));
  }

  const rows =
    view === "schedule"
      ? [...schedules]
          .filter((shift) => matches(shift.staff))
          .sort(
            (a, b) =>
              Date.parse(a.scheduledStart) - Date.parse(b.scheduledStart),
          )
          .map((shift) => {
            const start = Date.parse(shift.scheduledStart);
            const end = Date.parse(shift.scheduledEnd);
            const hasAttendance = punches.some((punch) => {
              if (punch.shiftScheduleId) return punch.shiftScheduleId === shift.id;
              return (
                punch.staffId === shift.staffId &&
                Date.parse(punch.clockInAt) < end &&
                (!punch.clockOutAt || Date.parse(punch.clockOutAt) > start)
              );
            });
            return {
              id: shift.id,
              staff: shift.staff,
              template: shift.shiftTemplate?.name,
              start: clock.format(new Date(start)),
              end: displayEnd(shift.scheduledStart, shift.scheduledEnd),
              status: shift.status,
              approvedLeave: onLeave.has(shift.staffId),
              action:
                onEditShift && shift.status === "SCHEDULED" && !hasAttendance
                  ? {
                      label: "Manage shift",
                      onClick: () => onEditShift(shift),
                      dialog: true,
                    }
                  : undefined,
            };
          })
      : [...(view === "open" ? openPunches : punches)]
          .filter((punch) => matches(punch.staff))
          .sort(
            (a, b) =>
              Number(Boolean(a.clockOutAt)) - Number(Boolean(b.clockOutAt)) ||
              Date.parse(a.clockInAt) - Date.parse(b.clockInAt),
          )
          .map((punch) => ({
            id: punch.id,
            staff: punch.staff,
            start: clock.format(new Date(punch.clockInAt)),
            end: punch.clockOutAt
              ? displayEnd(punch.clockInAt, punch.clockOutAt)
              : undefined,
            status: punch.clockOutAt ? "COMPLETED" : "CLOCKED IN",
            hours:
              punch.clockOutAt && punch.totalHours != null
                ? `${Number(punch.totalHours)} hr`
                : undefined,
            action: !punch.clockOutAt
              ? {
                  label: "Clock out",
                  onClick: () => onClockOut(punch.id),
                  disabled: pending !== null,
                  saving: pending === punch.id,
                }
              : undefined,
          }));

  return (
    <section aria-labelledby="daily-roster" className={panel + " @container"}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-300/15 bg-linear-to-r from-teal-900/60 via-[#172623] to-[#141821] px-4 py-3">
        <h2
          id="daily-roster"
          className="flex items-center gap-2.5 text-sm font-semibold text-white"
        >
          <span className="grid size-9 place-items-center rounded-xl border border-teal-300/20 bg-teal-300/12 text-teal-100">
            <ClipboardList size={17} aria-hidden />
          </span>
          Daily roster
        </h2>
        <div className="relative w-full @sm:w-60">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-2.5 text-zinc-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search roster by name, role, or employee code"
            placeholder="Search staff"
            className={
              input + " pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden"
            }
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="absolute inset-y-0 right-0 grid w-9 place-items-center rounded-r-lg text-zinc-400 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-300"
            >
              <X size={14} aria-hidden />
            </button>
          )}
        </div>
      </div>
      <nav
        aria-label="Roster views"
        className="flex flex-wrap gap-1 border-b border-white/8 bg-[#191c22] p-2"
      >
        {views.map(({ id, label, count, Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={view === id}
            onClick={() => setView(id)}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-emerald-300 ${view === id ? "border-emerald-400/25 bg-emerald-400/12 text-emerald-100" : "border-transparent text-zinc-300 hover:bg-white/8"}`}
          >
            <Icon size={14} aria-hidden />
            {label}
            <span
              className={`rounded-md px-1.5 py-0.5 text-[11px] tabular-nums ${id === "open" && count > 0 ? "bg-amber-300/15 text-amber-200" : "bg-white/8 text-zinc-300"}`}
            >
              {count}
            </span>
          </button>
        ))}
      </nav>
      {rows.length > 0 ? (
        <ShiftRosterTable rows={rows} scheduled={view === "schedule"} />
      ) : (
        <Empty>
          {terms.length
            ? "No staff match this search."
            : view === "schedule"
              ? "No shifts scheduled for this date."
              : view === "open"
                ? "No open punches for this date."
                : "No clock-ins recorded for this date."}
        </Empty>
      )}
    </section>
  );
}
