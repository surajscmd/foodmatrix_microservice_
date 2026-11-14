import { CalendarDays } from "lucide-react";
import { useState } from "react";
import type { AttendanceShift, ShiftSchedule } from "@/lib/hr-api";
import { restaurantDate } from "./report-dates";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function MonthlyTracker({
  schedules, punches, day, timeZone, onDayChange,
}: {
  schedules: ShiftSchedule[];
  punches: AttendanceShift[];
  day: string;
  timeZone: string;
  onDayChange: (day: string) => void;
}) {
  const [staffId, setStaffId] = useState("");
  const staff = new Map([...schedules, ...punches].map((shift) => [shift.staffId, shift.staff]));
  const selectedStaff = staff.has(staffId) ? staffId : "";
  const month = day.slice(0, 7);
  const first = new Date(`${month}-01T00:00:00Z`);
  const offset = (first.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const filteredSchedules = schedules.filter((shift) => !selectedStaff || shift.staffId === selectedStaff);
  const filteredPunches = punches.filter((shift) => !selectedStaff || shift.staffId === selectedStaff);
  const scheduleCounts = new Map<string, number>();
  const punchCounts = new Map<string, number>();

  for (const shift of filteredSchedules) {
    if (shift.status === "CANCELLED") continue;
    const date = restaurantDate(shift.scheduledStart, timeZone);
    scheduleCounts.set(date, (scheduleCounts.get(date) ?? 0) + 1);
  }
  for (const shift of filteredPunches) {
    const date = restaurantDate(shift.clockInAt, timeZone);
    punchCounts.set(date, (punchCounts.get(date) ?? 0) + 1);
  }

  const selectedSchedules = filteredSchedules.filter((shift) => restaurantDate(shift.scheduledStart, timeZone) === day);
  const selectedPunches = filteredPunches.filter((shift) => restaurantDate(shift.clockInAt, timeZone) === day);
  const hours = filteredPunches.reduce((sum, shift) => sum + Number(shift.totalHours ?? 0), 0);
  const time = new Intl.DateTimeFormat("en-IN", { timeZone, hour: "numeric", minute: "2-digit" });

  return (
    <section aria-labelledby="monthly-tracker" className="overflow-hidden rounded-2xl border border-zinc-700/75 bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-linear-to-r from-teal-950 to-zinc-900 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-teal-300/15 text-teal-200"><CalendarDays size={17} aria-hidden /></span>
          <div>
            <h2 id="monthly-tracker" className="text-sm font-semibold text-white">{first.toLocaleDateString("en-IN", { timeZone: "UTC", month: "long", year: "numeric" })}</h2>
            <p className="text-xs text-zinc-300">{filteredPunches.length} clock-ins · {hours.toLocaleString("en-IN", { maximumFractionDigits: 2 })} completed hours</p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-zinc-300">
          Staff
          <select value={selectedStaff} onChange={(e) => setStaffId(e.target.value)} className="h-9 max-w-52 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 text-sm text-zinc-100 scheme-dark">
            <option value="">All staff</option>
            {[...staff.values()].sort((a, b) => a.firstName.localeCompare(b.firstName)).map((person) => (
              <option key={person.id} value={person.id}>{person.firstName} {person.lastName} · {person.employeeCode}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-4 p-4 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,0.45fr)]">
        <div className="min-w-0">
          <div className="grid grid-cols-7 gap-1">
            {weekdays.map((weekday) => <span key={weekday} className="pb-1 text-center text-[11px] text-zinc-400">{weekday}</span>)}
            {Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} aria-hidden />)}
            {Array.from({ length: days }, (_, index) => {
              const number = index + 1;
              const date = `${month}-${String(number).padStart(2, "0")}`;
              const scheduled = scheduleCounts.get(date) ?? 0;
              const clockIns = punchCounts.get(date) ?? 0;
              return (
                <button key={date} type="button" onClick={() => onDayChange(date)} aria-pressed={day === date}
                  aria-label={`${date}, ${scheduled} shifts, ${clockIns} clock-ins`}
                  className={`flex min-h-11 flex-col items-center justify-center rounded-lg border py-1 text-xs tabular-nums focus-visible:outline-2 focus-visible:outline-emerald-300 ${day === date ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100" : "border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-zinc-600"}`}>
                  {number}
                  {(scheduled > 0 || clockIns > 0) && <span className="text-[10px]"><span className="text-teal-200">{scheduled}</span><span className="text-zinc-500"> / </span><span className="text-emerald-300">{clockIns}</span></span>}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-zinc-400"><span className="text-teal-200">Scheduled</span> / <span className="text-emerald-300">Clock-ins</span></p>
        </div>
        <div className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900/55">
          <h3 className="border-b border-zinc-800 px-3 py-2.5 text-sm font-semibold text-white">{new Date(`${day}T00:00:00Z`).toLocaleDateString("en-IN", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" })}</h3>
          {selectedSchedules.length + selectedPunches.length === 0 ? <p className="p-3 text-sm text-zinc-400">No shifts or punches for this date.</p> : (
            <ul className="divide-y divide-zinc-800">
              {selectedSchedules.map((shift) => (
                <li key={`schedule-${shift.id}`} className="px-3 py-2">
                  <p className="text-sm text-zinc-200">{shift.staff.firstName} {shift.staff.lastName}</p>
                  <p className="text-xs text-teal-200 capitalize">{shift.status.toLowerCase()} · {time.format(new Date(shift.scheduledStart))}–{time.format(new Date(shift.scheduledEnd))}</p>
                </li>
              ))}
              {selectedPunches.map((shift) => (
                <li key={`punch-${shift.id}`} className="px-3 py-2">
                  <p className="text-sm text-zinc-200">{shift.staff.firstName} {shift.staff.lastName}</p>
                  <p className="text-xs text-emerald-300">In {time.format(new Date(shift.clockInAt))}{shift.clockOutAt ? ` · Out ${time.format(new Date(shift.clockOutAt))}` : " · Open punch"}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
