import { ClipboardList, LogOut } from "lucide-react";
import type { AttendanceShift } from "@/lib/hr-api";

interface AttendanceLogBoardProps {
  onDuty: AttendanceShift[];
  completed: AttendanceShift[];
  timeZone: string;
  blocked: boolean;
  pendingId: string | null;
  onPunchOut: (shiftId: string) => void;
}

export default function AttendanceLogBoard({ onDuty, completed, timeZone, blocked, pendingId, onPunchOut }: AttendanceLogBoardProps) {
  const dateTime = new Intl.DateTimeFormat("en-IN", {
    timeZone, day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
  });
  const groups = [
    { label: "On duty", shifts: onDuty, empty: "No staff are clocked in.", color: "bg-emerald-400/10 text-emerald-200" },
    {
      label: "Clocked out today",
      shifts: [...completed].sort((a, b) => Date.parse(b.clockOutAt ?? "") - Date.parse(a.clockOutAt ?? "")),
      empty: "No shifts have ended today.",
      color: "bg-violet-400/10 text-violet-200",
    },
  ];

  return (
    <section aria-labelledby="attendance-log" className="min-w-0 overflow-hidden rounded-2xl border border-violet-300/25 bg-slate-900">
      <div className="flex items-center gap-3 bg-linear-to-r from-indigo-950 to-slate-900 p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-300/20 text-violet-200"><ClipboardList size={18} aria-hidden /></span>
        <h2 id="attendance-log" className="text-base font-semibold text-white">Attendance log</h2>
      </div>
      {groups.map(({ label, shifts, empty, color }) => (
        <div key={label}>
          <h3 className={`border-y border-white/10 px-4 py-2.5 text-xs font-semibold ${color}`}>{label}</h3>
          {shifts.length ? (
            <ul className="divide-y divide-white/10">
              {shifts.map((shift) => {
                const name = `${shift.staff.firstName} ${shift.staff.lastName}`;
                return (
                  <li key={shift.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 hover:bg-white/5">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{name}</p>
                      <p className="mt-0.5 text-xs text-slate-300">
                        {shift.staff.employeeCode} · In <time dateTime={shift.clockInAt}>{dateTime.format(new Date(shift.clockInAt))}</time>
                        {shift.clockOutAt && <> · Out <time dateTime={shift.clockOutAt}>{dateTime.format(new Date(shift.clockOutAt))}</time></>}
                      </p>
                    </div>
                    {!shift.clockOutAt && (
                      <button type="button" disabled={blocked} onClick={() => onPunchOut(shift.id)}
                        aria-label={`Clock out ${name}`}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 text-xs font-semibold text-amber-200 hover:bg-amber-300/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:opacity-50">
                        <LogOut size={14} aria-hidden />{pendingId === shift.id ? "Saving…" : "Clock out"}
                      </button>
                    )}
                    {shift.clockOutAt && shift.totalHours != null && (
                      <span className="text-xs font-semibold text-violet-200">{Number(shift.totalHours).toLocaleString("en-IN", { maximumFractionDigits: 2 })} hr</span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : <p className="px-4 py-4 text-sm text-slate-300">{empty}</p>}
        </div>
      ))}
    </section>
  );
}
