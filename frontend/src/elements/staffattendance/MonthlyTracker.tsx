import { CalendarDays, CalendarClock, LogIn } from "lucide-react";
import { useState } from "react";
import type { AttendanceShift, ShiftSchedule } from "@/lib/hr-api";
import { restaurantDate } from "./report-dates";
import MonthlyDayDetails from "./MonthlyDayDetails";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function MonthlyTracker({
  schedules,
  punches,
  day,
  timeZone,
  onDayChange,
  onOpenRoster,
}: {
  schedules: ShiftSchedule[];
  punches: AttendanceShift[];
  day: string;
  timeZone: string;
  onDayChange: (day: string) => void;
  onOpenRoster: () => void;
}) {
  const [staffId, setStaffId] = useState("");
  const staff = new Map(
    [...schedules, ...punches].map((shift) => [shift.staffId, shift.staff]),
  );
  const selectedStaff = staff.has(staffId) ? staffId : "";
  const month = day.slice(0, 7);
  const first = new Date(`${month}-01T00:00:00Z`);
  const offset = (first.getUTCDay() + 6) % 7;
  const days = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const filteredSchedules = schedules.filter(
    (shift) => !selectedStaff || shift.staffId === selectedStaff,
  );
  const filteredPunches = punches.filter(
    (shift) => !selectedStaff || shift.staffId === selectedStaff,
  );
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

  const selectedSchedules = filteredSchedules.filter(
    (shift) => restaurantDate(shift.scheduledStart, timeZone) === day,
  );
  const selectedPunches = filteredPunches.filter(
    (shift) => restaurantDate(shift.clockInAt, timeZone) === day,
  );
  const hours = filteredPunches.reduce(
    (sum, shift) =>
      sum + (shift.clockOutAt ? Number(shift.totalHours ?? 0) : 0),
    0,
  );

  return (
    <section
      aria-labelledby="monthly-tracker"
      className="@container min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-400/15 bg-linear-to-r from-emerald-500/15 via-emerald-500/5 to-zinc-950 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-400">
            <CalendarDays size={17} aria-hidden />
          </span>
          <div>
            <h2
              id="monthly-tracker"
              className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-300"
            >
              {first.toLocaleDateString("en-IN", {
                timeZone: "UTC",
                month: "long",
                year: "numeric",
              })}
            </h2>
            <p className="mt-1 text-[10px] text-zinc-500">
              {filteredPunches.length} clock-ins ·{" "}
              {hours.toLocaleString("en-IN", { maximumFractionDigits: 2 })}{" "}
              completed hours
            </p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-[11px] text-zinc-400">
          Staff
          <select
            value={selectedStaff}
            onChange={(e) => setStaffId(e.target.value)}
            className="h-9 max-w-52 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 text-xs text-zinc-400 scheme-dark outline-none focus:border-emerald-500/50"
          >
            <option value="">All staff</option>
            {[...staff.values()]
              .sort((a, b) => a.firstName.localeCompare(b.firstName))
              .map((person) => (
                <option key={person.id} value={person.id}>
                  {person.firstName} {person.lastName} · {person.employeeCode}
                </option>
              ))}
          </select>
        </label>
      </div>
      <div className="grid items-start gap-5 p-4 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,0.65fr)]">
        <div className="min-w-0">
          <div className="grid grid-cols-7 gap-1">
            {weekdays.map((weekday) => (
              <span
                key={weekday}
                className="pb-1 text-center text-[11px] font-medium text-zinc-400"
              >
                {weekday}
              </span>
            ))}
            {Array.from({ length: offset }, (_, index) => (
              <span key={`blank-${index}`} aria-hidden />
            ))}
            {Array.from({ length: days }, (_, index) => {
              const number = index + 1;
              const date = `${month}-${String(number).padStart(2, "0")}`;
              const scheduled = scheduleCounts.get(date) ?? 0;
              const clockIns = punchCounts.get(date) ?? 0;
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => onDayChange(date)}
                  aria-pressed={day === date}
                  aria-label={`${date}, ${scheduled} shifts, ${clockIns} clock-ins`}
                  className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg border py-1.5 tabular-nums transition-all duration-200 focus-visible:outline-2 focus-visible:outline-emerald-300 ${day === date ? "border-emerald-400/70 bg-gradient-to-b from-emerald-400/20 to-emerald-400/5 text-emerald-100 shadow-[inset_0_1px_0_rgba(52,211,153,0.2),0_4px_16px_rgba(16,185,129,0.08)]" : "border-zinc-800 bg-gradient-to-b from-zinc-900/70 to-zinc-950 text-zinc-200 hover:border-zinc-600 hover:from-zinc-800/70"}`}
                >
                  <span className="text-sm font-semibold leading-5">
                    {number}
                  </span>
                  {(scheduled > 0 || clockIns > 0) && (
                    <span
                      aria-hidden
                      className="flex flex-wrap justify-center gap-x-1.5 text-[10px] font-medium"
                    >
                      <span className="inline-flex items-center gap-1 text-sky-300">
                        <CalendarClock size={12} />
                        {scheduled}
                      </span>
                      <span className="inline-flex items-center gap-1 text-emerald-300">
                        <LogIn size={12} />
                        {clockIns}
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-[11px]">
            <span className="inline-flex items-center gap-1.5 text-sky-300">
              <CalendarClock size={12} aria-hidden /> Scheduled shifts
            </span>
            <span className="inline-flex items-center gap-1.5 text-emerald-300">
              <LogIn size={12} aria-hidden /> Recorded clock-ins
            </span>
          </div>
        </div>
        <MonthlyDayDetails
          key={selectedStaff}
          day={day}
          schedules={selectedSchedules}
          punches={selectedPunches}
          timeZone={timeZone}
          onOpenRoster={onOpenRoster}
        />
      </div>
    </section>
  );
}
