import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { AttendanceShift, ShiftSchedule } from "@/lib/hr-api";
import { restaurantDate } from "./report-dates";
import WorkforceTableStatus from "@/elements/restaurantworkforce/WorkforceTableStatus";

const pageSize = 6;
const control =
  "inline-flex min-h-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 text-xs text-zinc-300 hover:border-emerald-400/30 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-40";

export default function MonthlyDayDetails({
  day,
  schedules,
  punches,
  timeZone,
  onOpenRoster,
}: {
  day: string;
  schedules: ShiftSchedule[];
  punches: AttendanceShift[];
  timeZone: string;
  onOpenRoster: () => void;
}) {
  const [view, setView] = useState<"scheduled" | "attendance" | "open">(
    "scheduled",
  );
  const [search, setSearch] = useState("");
  const [paging, setPaging] = useState({ day, page: 1 });
  const page = paging.day === day ? paging.page : 1;
  const setPage = (page: number) => setPaging({ day, page });
  const open = punches.filter((entry) => !entry.clockOutAt);
  const tabs = [
    { id: "scheduled", label: "Scheduled", count: schedules.length },
    { id: "attendance", label: "Attendance", count: punches.length },
    { id: "open", label: "Clocked in", count: open.length },
  ] as const;
  const time = new Intl.DateTimeFormat("en-IN", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  });
  const dateTime = new Intl.DateTimeFormat("en-IN", {
    timeZone,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  const displayEnd = (start: string, end: string) =>
    (restaurantDate(start, timeZone) === restaurantDate(end, timeZone)
      ? time
      : dateTime
    ).format(new Date(end));
  const query = search.trim().toLowerCase();
  const matches = (staff: AttendanceShift["staff"]) =>
    `${staff.firstName} ${staff.lastName} ${staff.employeeCode}`
      .toLowerCase()
      .includes(query);
  const planned = [...schedules]
    .filter((entry) => matches(entry.staff))
    .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));
  const recorded = [...(view === "open" ? open : punches)]
    .filter((entry) => matches(entry.staff))
    .sort((a, b) => a.clockInAt.localeCompare(b.clockInAt));
  const total = view === "scheduled" ? planned.length : recorded.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pages);
  const start = (currentPage - 1) * pageSize;

  function identity(staff: AttendanceShift["staff"]) {
    return (
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-lg border border-zinc-800 bg-zinc-900 text-[10px] font-semibold uppercase text-emerald-400"
        >
          {staff.firstName[0]}
          {staff.lastName[0]}
        </span>
        <div className="min-w-0">
          <p className="break-words text-xs font-medium leading-5 text-zinc-100">
            {staff.firstName} {staff.lastName}
          </p>
          <p className="mt-0.5 font-mono text-[9px] text-zinc-500">
            {staff.employeeCode}
          </p>
        </div>
      </div>
    );
  }

  return (
    <section
      aria-label="Selected day details"
      className="min-w-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/70"
    >
      <header className="border-b border-emerald-400/15 bg-linear-to-r from-emerald-500/10 via-emerald-500/5 to-zinc-950 px-3 py-3">
        <h3 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
          {new Date(`${day}T00:00:00Z`).toLocaleDateString("en-IN", {
            timeZone: "UTC",
            weekday: "long",
            day: "numeric",
            month: "short",
          })}
        </h3>
      </header>
      <div
        role="group"
        aria-label="Day record type"
        className="grid grid-cols-3 gap-1 border-b border-zinc-800 p-2"
      >
        {tabs.map(({ id, label, count }) => (
          <button
            key={id}
            type="button"
            aria-pressed={view === id}
            onClick={() => {
              setView(id);
              setPage(1);
            }}
            className={`flex min-h-9 flex-wrap items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-emerald-300 ${view === id ? "bg-emerald-400/10 text-emerald-300" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"}`}
          >
            {label}
            <span className="rounded bg-zinc-900 px-1 font-mono text-[9px]">
              {count}
            </span>
          </button>
        ))}
      </div>
      <div className="border-b border-zinc-800 px-3 py-2.5">
        <label className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 focus-within:border-emerald-400/40">
          <Search size={13} className="text-zinc-500" aria-hidden />
          <span className="sr-only">
            Search selected day by staff name or code
          </span>
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Find staff…"
            className="h-8 min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-zinc-600"
          />
        </label>
        <p className="mt-2 text-[10px] leading-4 text-zinc-500">
          {view === "scheduled"
            ? "Planned shift times and schedule status."
            : view === "open"
              ? "Clock-ins started this day with no clock-out recorded."
              : "Recorded clock-in and clock-out times."}
        </p>
      </div>
      {total === 0 ? (
        <p
          role="status"
          className="px-3 py-8 text-center text-xs text-zinc-500"
        >
          {query
            ? "No staff match your search."
            : view === "scheduled"
              ? "No shifts scheduled for this date."
              : view === "open"
                ? "No open clock-ins for this date."
                : "No attendance recorded for this date."}
        </p>
      ) : (
        <ul className="max-h-[24rem] divide-y divide-zinc-800/70 overflow-y-auto overscroll-contain">
          {view === "scheduled"
            ? planned.slice(start, start + pageSize).map((entry) => (
                <li
                  key={entry.id}
                  className="space-y-2 px-3 py-3 transition-colors hover:bg-zinc-900/80"
                >
                  <div className="flex items-start justify-between gap-2">
                    {identity(entry.staff)}
                    <WorkforceTableStatus value={entry.status} />
                  </div>
                  <p className="text-[11px] tabular-nums text-sky-200">
                    {time.format(new Date(entry.scheduledStart))} –{" "}
                    {displayEnd(entry.scheduledStart, entry.scheduledEnd)}
                  </p>
                  {entry.shiftTemplate?.name && (
                    <p className="text-[10px] text-zinc-500">
                      {entry.shiftTemplate.name}
                    </p>
                  )}
                </li>
              ))
            : recorded.slice(start, start + pageSize).map((entry) => (
                <li
                  key={entry.id}
                  className="space-y-2 px-3 py-3 transition-colors hover:bg-zinc-900/80"
                >
                  <div className="flex items-start justify-between gap-2">
                    {identity(entry.staff)}
                    {!entry.clockOutAt && (
                      <span className="shrink-0 text-[9px] text-amber-300">
                        Clocked in
                      </span>
                    )}
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <dt className="text-zinc-500">In</dt>
                      <dd className="mt-0.5 tabular-nums text-zinc-200">
                        {time.format(new Date(entry.clockInAt))}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500">Out</dt>
                      <dd className="mt-0.5 tabular-nums text-zinc-200">
                        {entry.clockOutAt
                          ? displayEnd(entry.clockInAt, entry.clockOutAt)
                          : "Not recorded"}
                      </dd>
                    </div>
                  </dl>
                  {entry.clockOutAt && entry.totalHours != null && (
                    <p className="text-[10px] text-emerald-300">
                      {Number(entry.totalHours).toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      })}{" "}
                      hours worked
                    </p>
                  )}
                </li>
              ))}
        </ul>
      )}
      <footer className="space-y-3 border-t border-zinc-800 p-3">
        {total > pageSize && (
          <nav
            aria-label="Day details pages"
            className="flex items-center justify-between gap-2"
          >
            <button
              type="button"
              className={control}
              aria-label="Previous records"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft size={14} aria-hidden />
            </button>
            <span aria-live="polite" className="text-[10px] text-zinc-500">
              {start + 1}–{Math.min(start + pageSize, total)} of {total}
            </span>
            <button
              type="button"
              className={control}
              aria-label="Next records"
              disabled={currentPage === pages}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRight size={14} aria-hidden />
            </button>
          </nav>
        )}
        <button
          type="button"
          onClick={onOpenRoster}
          className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/20 focus-visible:outline-2 focus-visible:outline-emerald-300"
        >
          View daily roster <ArrowRight size={13} aria-hidden />
        </button>
      </footer>
    </section>
  );
}
