import {
  ClipboardList,
  LogOut,
  Search,
  LoaderCircle,
  Clock3,
} from "lucide-react";
import { useState } from "react";
import type { AttendanceShift } from "@/lib/hr-api";

interface AttendanceLogBoardProps {
  onDuty: AttendanceShift[];
  completed: AttendanceShift[];
  timeZone: string;
  blocked: boolean;
  pendingId: string | null;
  onPunchOut: (shiftId: string) => void;
  now: Date | null;
}

export default function AttendanceLogBoard({
  onDuty,
  completed,
  timeZone,
  blocked,
  pendingId,
  onPunchOut,
  now,
}: AttendanceLogBoardProps) {
  const [view, setView] = useState("On duty");
  const [search, setSearch] = useState("");
  const dateTime = new Intl.DateTimeFormat("en-IN", {
    timeZone,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  const groups = [
    {
      label: "On duty",
      shifts: onDuty,
      empty: "No staff are clocked in.",
      color: "bg-emerald-400/10 text-emerald-200",
    },
    {
      label: "Clocked out today",
      shifts: [...completed].sort(
        (a, b) =>
          Date.parse(b.clockOutAt ?? "") - Date.parse(a.clockOutAt ?? ""),
      ),
      empty: "No shifts have ended today.",
      color: "bg-violet-400/10 text-violet-200",
    },
  ];

  return (
    <section
      aria-labelledby="attendance-log"
      className="min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 shadow-lg shadow-black/20"
    >
      <div className="flex items-center gap-3 bg-linear-to-r from-violet-500/15 via-violet-500/5 to-zinc-950 px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-300/20 text-violet-200">
          <ClipboardList size={18} aria-hidden />
        </span>
        <h2
          id="attendance-log"
          className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-300"
        >
          Attendance log
        </h2>
      </div>
      <div className="space-y-3 border-y border-zinc-800 p-4">
        <div
          role="group"
          aria-label="Attendance view"
          className="grid grid-cols-2 gap-1 rounded-xl border border-zinc-800 bg-zinc-950 p-1"
        >
          {groups.map(({ label, shifts }) => (
            <button
              key={label}
              type="button"
              aria-pressed={view === label}
              onClick={() => setView(label)}
              className={`flex min-h-9 items-center justify-center gap-2 rounded-lg px-2 text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-emerald-400 ${view === label ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-200"}`}
            >
              {label}
              <span className="rounded-md bg-zinc-950/70 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">
                {shifts.length}
              </span>
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 focus-within:border-emerald-300">
          <Search size={15} className="shrink-0 text-zinc-400" aria-hidden />
          <span className="sr-only">
            Search attendance by name or employee code
          </span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find staff to clock out or review…"
            className="h-9 min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-zinc-500"
          />
        </label>
      </div>
      {groups
        .filter(({ label }) => label === view)
        .map(({ label, shifts, empty }) => {
          const query = search.trim().toLowerCase();
          const visible = shifts.filter((shift) =>
            `${shift.staff.firstName} ${shift.staff.lastName} ${shift.staff.employeeCode}`
              .toLowerCase()
              .includes(query),
          );
          return (
            <div key={label}>
              {visible.length ? (
                <ul className="divide-y divide-zinc-800/80">
                  {visible.map((shift) => {
                    const name = `${shift.staff.firstName} ${shift.staff.lastName}`;
                    const minutes = now
                      ? Math.max(
                          0,
                          Math.floor(
                            (now.getTime() - Date.parse(shift.clockInAt)) /
                              60_000,
                          ),
                        )
                      : null;
                    return (
                      <li
                        key={shift.id}
                        className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3.5 transition-colors hover:bg-zinc-900/60"
                      >
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <span
                            aria-hidden
                            className="grid size-10 shrink-0 place-items-center rounded-xl border border-violet-400/15 bg-violet-400/10 text-xs font-semibold text-violet-300"
                          >
                            {shift.staff.firstName.slice(0, 1)}
                            {shift.staff.lastName.slice(0, 1)}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold leading-5 text-zinc-100">
                              {name}
                            </p>
                            <p className="mt-0.5 text-[10px] text-zinc-500">
                              {shift.staff.employeeCode}
                            </p>
                            <p className="mt-2 text-[11px] text-zinc-400">
                              In{" "}
                              <time dateTime={shift.clockInAt}>
                                {dateTime.format(new Date(shift.clockInAt))}
                              </time>
                              {shift.clockOutAt && (
                                <>
                                  {" "}
                                  · Out{" "}
                                  <time dateTime={shift.clockOutAt}>
                                    {dateTime.format(
                                      new Date(shift.clockOutAt),
                                    )}
                                  </time>
                                </>
                              )}
                            </p>
                            {!shift.clockOutAt &&
                              minutes !== null &&
                              Number.isFinite(minutes) && (
                                <p className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-400">
                                  <Clock3 size={11} aria-hidden />{" "}
                                  {Math.floor(minutes / 60)}h {minutes % 60}m
                                  elapsed
                                </p>
                              )}
                          </div>
                        </div>
                        {!shift.clockOutAt && (
                          <button
                            type="button"
                            disabled={blocked}
                            onClick={() => onPunchOut(shift.id)}
                            aria-label={`Clock out ${name}`}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 text-[11px] font-semibold text-amber-200 enabled:hover:bg-amber-300/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:opacity-50"
                          >
                            {pendingId === shift.id ? (
                              <LoaderCircle
                                size={14}
                                className="motion-safe:animate-spin"
                                aria-hidden
                              />
                            ) : (
                              <LogOut size={14} aria-hidden />
                            )}
                            {pendingId === shift.id ? "Saving…" : "Clock out"}
                          </button>
                        )}
                        {shift.clockOutAt && shift.totalHours != null && (
                          <span className="text-[11px] font-semibold text-violet-200">
                            {Number(shift.totalHours).toLocaleString("en-IN", {
                              maximumFractionDigits: 2,
                            })}{" "}
                            hr
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="px-4 py-6 text-xs text-zinc-500">
                  {query ? "No staff match your search." : empty}
                </p>
              )}
            </div>
          );
        })}
    </section>
  );
}
