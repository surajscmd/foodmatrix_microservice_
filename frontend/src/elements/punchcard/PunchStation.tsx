import { CalendarClock, LogIn, Search, LoaderCircle } from "lucide-react";
import { useState } from "react";
import type { ShiftSchedule } from "@/lib/hr-api";

interface PunchStationProps {
  schedules: ShiftSchedule[];
  timeZone: string;
  blocked: boolean;
  pendingId: string | null;
  onPunchIn: (schedule: ShiftSchedule) => void;
}

export default function PunchStation({
  schedules,
  timeZone,
  blocked,
  pendingId,
  onPunchIn,
}: PunchStationProps) {
  const [query, setQuery] = useState("");
  const search = query.trim().toLowerCase();
  const visible = schedules
    .filter(({ staff }) =>
      `${staff.firstName} ${staff.lastName} ${staff.employeeCode} ${staff.role}`
        .toLowerCase()
        .includes(search),
    )
    .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));
  const time = new Intl.DateTimeFormat("en-IN", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <section
      aria-labelledby="punch-station"
      className="min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 shadow-lg shadow-black/20"
    >
      <div className="border-b border-zinc-800/80 bg-linear-to-r from-emerald-500/15 via-emerald-500/5 to-zinc-950 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-300/15 text-emerald-200">
            <CalendarClock size={18} aria-hidden />
          </span>
          <div>
            <h2
              id="punch-station"
              className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-300"
            >
              Clock in
            </h2>
            <p className="text-[10px] text-zinc-500">
              Find your name and start your scheduled shift
            </p>
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 focus-within:border-emerald-300">
          <Search size={15} className="shrink-0 text-zinc-400" aria-hidden />
          <span className="sr-only">Search scheduled staff</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search staff by name or code"
            className="h-9 min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-zinc-400"
          />
        </label>
      </div>

      {visible.length ? (
        <ul className="divide-y divide-zinc-800/80">
          {visible.map((schedule) => {
            const { firstName, lastName, employeeCode, role } = schedule.staff;
            const start = time.format(new Date(schedule.scheduledStart));
            return (
              <li
                key={schedule.id}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3.5 transition-colors hover:bg-zinc-900/60"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span
                    aria-hidden
                    className="grid size-10 shrink-0 place-items-center rounded-xl border border-emerald-400/15 bg-emerald-400/10 text-xs font-semibold text-emerald-300"
                  >
                    {firstName.slice(0, 1)}
                    {lastName.slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold leading-5 text-zinc-100">
                      {firstName} {lastName}
                    </p>
                    <p className="mt-0.5 text-[10px] text-zinc-500">
                      {employeeCode} · {role.replaceAll("_", " ")}
                    </p>
                    <p className="mt-2 inline-flex flex-wrap items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/70 px-2 py-1 text-[10px] tabular-nums text-zinc-300">
                      {schedule.shiftTemplate?.name &&
                        `${schedule.shiftTemplate.name} · `}
                      {start}–{time.format(new Date(schedule.scheduledEnd))}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={blocked}
                  onClick={() => onPunchIn(schedule)}
                  aria-label={`Clock in ${firstName} ${lastName} for the ${start} shift`}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 px-3 text-[11px] font-semibold text-zinc-950 shadow-[0_4px_16px_rgba(52,211,153,0.1)] enabled:hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:opacity-50"
                >
                  {pendingId === schedule.id ? (
                    <LoaderCircle
                      size={14}
                      className="motion-safe:animate-spin"
                      aria-hidden
                    />
                  ) : (
                    <LogIn size={14} aria-hidden />
                  )}
                  {pendingId === schedule.id ? "Saving…" : "Clock in"}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="px-4 py-6 text-center text-xs text-zinc-500">
          {search
            ? "No rostered staff match your search."
            : "No shifts are available to clock in."}
        </p>
      )}
    </section>
  );
}
