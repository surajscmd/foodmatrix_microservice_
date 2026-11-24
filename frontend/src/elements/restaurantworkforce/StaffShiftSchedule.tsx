import { useCallback, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";
import { getShiftSchedules } from "@/lib/hr-api";
import {
  monthQuery,
  moveMonth,
  restaurantDate,
} from "@/elements/staffattendance/report-dates";
import {
  Empty,
  ErrorNote,
  secondary,
  Status,
  useWorkforceQuery,
} from "./shared";

const monthFormat = new Intl.DateTimeFormat("en-IN", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export default function StaffShiftSchedule({
  staffId,
  restaurantId,
  today,
  timeZone,
}: {
  staffId: string;
  restaurantId: string;
  today: string;
  timeZone: string;
}) {
  const currentMonth = today.slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [revision, setRevision] = useState(0);
  const load = useCallback(async () => {
    const { data } = await getShiftSchedules({
      restaurantId,
      staffId,
      ...monthQuery(month),
    });
    const first = `${month}-01`;
    const next = `${moveMonth(month, 1)}-01`;
    return data.filter(
      (shift) =>
        restaurantDate(shift.scheduledStart, timeZone) < next &&
        restaurantDate(
          new Date(Date.parse(shift.scheduledEnd) - 1),
          timeZone,
        ) >= first,
    );
  }, [month, restaurantId, staffId, timeZone]);
  const { data, loading, error } = useWorkforceQuery(
    `${restaurantId}/${staffId}/${month}/${revision}`,
    load,
    "Unable to load this employee’s shift schedule.",
  );
  const day = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone,
  });
  const time = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-400/15 bg-linear-to-r from-emerald-500/15 via-emerald-500/5 to-zinc-950 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-400">
            <CalendarClock size={17} aria-hidden />
          </span>
          <div>
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
              Scheduled shifts
            </h3>
            <p className="mt-1 text-[10px] text-zinc-500">
              {timeZone.replaceAll("_", " ")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {month !== currentMonth && (
            <button
              type="button"
              className={secondary}
              onClick={() => setMonth(currentMonth)}
            >
              This month
            </button>
          )}
          <button
            type="button"
            className={secondary + " px-2"}
            onClick={() => setMonth(moveMonth(month, -1))}
            aria-label="Previous month"
          >
            <ChevronLeft size={15} aria-hidden />
          </button>
          <span
            className="min-w-28 text-center text-xs font-medium text-zinc-200"
            aria-live="polite"
          >
            {monthFormat.format(new Date(`${month}-01T00:00:00Z`))}
          </span>
          <button
            type="button"
            className={secondary + " px-2"}
            onClick={() => setMonth(moveMonth(month, 1))}
            aria-label="Next month"
          >
            <ChevronRight size={15} aria-hidden />
          </button>
        </div>
      </header>
      {loading && <Empty>Loading scheduled shifts…</Empty>}
      {error && (
        <div className="space-y-2 p-4">
          <ErrorNote>{error}</ErrorNote>
          <button
            type="button"
            className={secondary}
            onClick={() => setRevision((value) => value + 1)}
          >
            Retry
          </button>
        </div>
      )}
      {data?.length === 0 && <Empty>No shifts scheduled for this month.</Empty>}
      {!!data?.length && (
        <ul className="divide-y divide-zinc-800/80">
          {data.map((shift) => {
            const start = new Date(shift.scheduledStart);
            const end = new Date(shift.scheduledEnd);
            const overnight =
              restaurantDate(start, timeZone) !== restaurantDate(end, timeZone);
            return (
              <li
                key={shift.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 py-3 even:bg-white/[0.02] @md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
              >
                <div className="min-w-0">
                  <p className="break-words text-xs font-semibold text-white">
                    {shift.shiftTemplate?.name ?? "Shift"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-400">
                    {day.format(start)}
                  </p>
                </div>
                <p className="col-span-2 row-start-2 text-xs tabular-nums text-zinc-300 @md:col-span-1 @md:row-start-auto">
                  {time.format(start)} – {time.format(end)}
                  {overnight && (
                    <span className="ml-1.5 text-[11px] text-zinc-400">
                      ({day.format(end)})
                    </span>
                  )}
                </p>
                <div className="col-start-2 row-start-1 justify-self-end @md:col-start-3">
                  <Status value={shift.status} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
