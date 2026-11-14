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
    <section aria-labelledby="punch-station" className="min-w-0 overflow-hidden rounded-2xl border border-cyan-300/25 bg-slate-900">
      <div className="border-b border-white/10 bg-linear-to-r from-cyan-950 to-slate-900 p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cyan-300/20 text-cyan-200"><CalendarClock size={18} aria-hidden /></span>
          <div>
            <h2 id="punch-station" className="text-base font-semibold text-white">Clock in</h2>
            <p className="text-xs text-cyan-100/85">Select a shift from the roster</p>
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 rounded-lg border border-white/15 bg-slate-950/65 px-3 focus-within:border-cyan-300">
          <Search size={15} className="shrink-0 text-slate-400" aria-hidden />
          <span className="sr-only">Search scheduled staff</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
            placeholder="Search staff by name or code"
            className="h-9 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-400" />
        </label>
      </div>

      {visible.length ? (
        <ul className="divide-y divide-white/10">
          {visible.map((schedule) => {
            const { firstName, lastName, employeeCode, role } = schedule.staff;
            const start = time.format(new Date(schedule.scheduledStart));
            return (
              <li key={schedule.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 hover:bg-white/5">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{firstName} {lastName}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{employeeCode} · {role}</p>
                  <p className="mt-1 text-xs text-cyan-100">
                    {schedule.shiftTemplate?.name && `${schedule.shiftTemplate.name} · `}
                    {start}–{time.format(new Date(schedule.scheduledEnd))}
                  </p>
                </div>
                <button type="button" disabled={blocked} onClick={() => onPunchIn(schedule)}
                  aria-label={`Clock in ${firstName} ${lastName} for the ${start} shift`}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-cyan-300 px-3 text-xs font-semibold text-cyan-950 hover:bg-cyan-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:opacity-50">
                  <LogIn size={14} aria-hidden />{pendingId === schedule.id ? "Saving…" : "Clock in"}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="px-4 py-8 text-center text-sm text-slate-300">
          {search ? "No rostered staff match your search." : "No shifts are available to clock in."}
        </p>
      )}
    </section>
  );
}
