import { ClipboardList, LogOut, Search } from "lucide-react";
import { useState } from "react";
import type { AttendanceShift, ShiftSchedule } from "@/lib/hr-api";

export default function ShiftRoster({
  schedules, punches, timeZone, pending, onClockOut,
}: {
  schedules: ShiftSchedule[];
  punches: AttendanceShift[];
  timeZone: string;
  pending: string | null;
  onClockOut: (shiftId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  const time = new Intl.DateTimeFormat("en-IN", { timeZone, day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

  const matches = ({ firstName, lastName, role, employeeCode }: AttendanceShift["staff"]) =>
    `${firstName} ${lastName} ${role} ${employeeCode}`.toLowerCase().includes(term);

  const roster = schedules.filter((shift) => matches(shift.staff));
  const attendance = punches.filter((shift) => matches(shift.staff));

  return (
    <section aria-labelledby="daily-roster" className="overflow-hidden rounded-2xl border border-zinc-700/75 bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-linear-to-r from-emerald-950 to-zinc-900 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-emerald-300/15 text-emerald-200"><ClipboardList size={17} aria-hidden /></span>
          <div>
            <h2 id="daily-roster" className="text-sm font-semibold text-white">Daily roster</h2>
            <p className="text-xs text-zinc-300">{schedules.length} rostered · {punches.filter((shift) => !shift.clockOutAt).length} open punches</p>
          </div>
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 focus-within:border-emerald-300">
          <Search size={15} className="text-zinc-400" aria-hidden />
          <span className="sr-only">Search roster and punches</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search staff"
            className="h-9 w-36 bg-transparent text-sm text-white outline-none placeholder:text-zinc-400" />
        </label>
      </div>
      <div className="grid divide-y divide-zinc-800 @3xl:grid-cols-2 @3xl:divide-x @3xl:divide-y-0">
        <div>
          <h3 className="border-b border-zinc-800 bg-[#18191d] px-4 py-2.5 text-xs font-semibold text-zinc-200">Scheduled shifts</h3>
          {roster.length ? (
            <ul className="divide-y divide-zinc-800">
              {roster.map((shift) => (
                <li key={shift.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-white">{shift.staff.firstName} {shift.staff.lastName} <span className="ml-1 text-xs text-zinc-400">{shift.staff.employeeCode}</span></p>
                    <p className="mt-0.5 text-xs text-zinc-400">{shift.shiftTemplate?.name ?? shift.staff.role} · {time.format(new Date(shift.scheduledStart))} – {time.format(new Date(shift.scheduledEnd))}</p>
                  </div>
                  <span className="text-xs text-zinc-300 capitalize">{shift.status.toLowerCase()}</span>
                </li>
              ))}
            </ul>
          ) : <p className="p-4 text-sm text-zinc-400">{term ? "No scheduled shifts match your search." : "No shifts scheduled for this date."}</p>}
        </div>
        <div>
          <h3 className="border-b border-zinc-800 bg-[#18191d] px-4 py-2.5 text-xs font-semibold text-zinc-200">Attendance punches</h3>
          {attendance.length ? (
            <ul className="divide-y divide-zinc-800">
              {attendance.map((shift) => {
                const name = `${shift.staff.firstName} ${shift.staff.lastName}`;
                return (
                  <li key={shift.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-white">{name}</p>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        In {time.format(new Date(shift.clockInAt))}
                        {shift.clockOutAt && ` · Out ${time.format(new Date(shift.clockOutAt))}`}
                      </p>
                    </div>
                    {shift.clockOutAt ? (
                      <span className="text-xs tabular-nums text-emerald-200">{shift.totalHours == null ? "Completed" : `${Number(shift.totalHours)} hr`}</span>
                    ) : (
                      <button type="button" disabled={pending !== null} onClick={() => onClockOut(shift.id)} aria-label={`Clock out ${name}`}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 text-xs font-semibold text-amber-200 enabled:hover:bg-amber-300/20 disabled:opacity-50">
                        <LogOut size={14} aria-hidden />{pending === shift.id ? "Saving…" : "Clock out"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : <p className="p-4 text-sm text-zinc-400">{term ? "No punches match your search." : "No clock-ins recorded for this date."}</p>}
        </div>
      </div>
    </section>
  );
}
