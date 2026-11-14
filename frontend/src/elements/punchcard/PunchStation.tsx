import { CalendarClock, LogIn, Search } from "lucide-react";
import { useState } from "react";
import type { ShiftSchedule } from "@/lib/hr-api";

interface PunchStationProps {
  schedules: ShiftSchedule[];
  timeZone: string;
  blocked: boolean;
  pendingId: string | null;
  onPunchIn: (schedule: ShiftSchedule) => void;
}

export default function PunchStation({ schedules, timeZone, blocked, pendingId, onPunchIn }: PunchStationProps) {
  const [query, setQuery] = useState("");
  const search = query.trim().toLowerCase();
  const visible = schedules.filter(({ staff }) =>
    `${staff.firstName} ${staff.lastName} ${staff.employeeCode} ${staff.role}`.toLowerCase().includes(search),
  );
  const time = new Intl.DateTimeFormat("en-IN", { timeZone, hour: "numeric", minute: "2-digit" });

  return (
    <section aria-labelledby="punch-station" className="min-w-0 overflow-hidden rounded-2xl border border-zinc-700/75 bg-zinc-950 shadow-lg shadow-black/20">
      <div className="border-b border-white/10 bg-linear-to-r from-emerald-950 to-zinc-900 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-300/15 text-emerald-200"><CalendarClock size={18} aria-hidden /></span>
          <div>
            <h2 id="punch-station" className="text-sm font-semibold text-white">Clock in</h2>
            <p className="text-xs text-zinc-300">Select a shift from the roster</p>
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 focus-within:border-emerald-300">
          <Search size={15} className="shrink-0 text-zinc-400" aria-hidden />
          <span className="sr-only">Search scheduled staff</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
            placeholder="Search staff by name or code"
            className="h-9 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-400" />
        </label>
      </div>

      {visible.length ? (
        <ul className="divide-y divide-white/10">
          {visible.map((schedule) => {
            const { firstName, lastName, employeeCode, role } = schedule.staff;
            const start = time.format(new Date(schedule.scheduledStart));
            return (
              <li key={schedule.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2.5 hover:bg-zinc-900">
                <div>
                  <p className="text-sm font-semibold text-zinc-100">{firstName} {lastName}</p>
                  <p className="mt-0.5 text-xs text-zinc-400">{employeeCode} · {role}</p>
                  <p className="mt-1 text-xs text-emerald-200">
                    {schedule.shiftTemplate?.name && `${schedule.shiftTemplate.name} · `}
                    {start}–{time.format(new Date(schedule.scheduledEnd))}
                  </p>
                </div>
                <button type="button" disabled={blocked} onClick={() => onPunchIn(schedule)}
                  aria-label={`Clock in ${firstName} ${lastName} for the ${start} shift`}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-300 px-3 text-xs font-semibold text-emerald-950 enabled:hover:bg-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:opacity-50">
                  <LogIn size={14} aria-hidden />{pendingId === schedule.id ? "Saving…" : "Clock in"}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="px-4 py-6 text-center text-sm text-zinc-400">
          {search ? "No rostered staff match your search." : "No shifts are available to clock in."}
        </p>
      )}
    </section>
  );
}
