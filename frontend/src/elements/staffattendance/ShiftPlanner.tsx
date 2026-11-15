import { CalendarPlus, RefreshCw } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import {
  attendanceError,
  createShiftSchedule,
  getActiveShiftTemplates,
  getStaffByRestaurant,
  type ShiftTemplate,
  type Staff,
} from "@/lib/hr-api";
import { restaurantDateTime } from "./report-dates";

const field =
  "h-10 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-white scheme-dark focus:border-emerald-400 focus:outline-none disabled:opacity-50";
const fieldLabel = "grid min-w-0 gap-1.5 text-xs font-medium text-zinc-300";

type Pattern = "single" | "weekday" | "weekly" | "daily";

function shiftDates(day: string, pattern: Pattern) {
  if (pattern === "single") return [day];
  const first = new Date(`${day.slice(0, 7)}-01T00:00:00Z`);
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
  const dates: string[] = [];
  for (
    const date = new Date(first);
    date.getUTCMonth() === first.getUTCMonth();
    date.setUTCDate(date.getUTCDate() + 1)
  ) {
    const weekDay = date.getUTCDay();
    if (
      pattern === "daily" ||
      (pattern === "weekday" && weekDay >= 1 && weekDay <= 5) ||
      (pattern === "weekly" && weekDay === weekday)
    ) {
      dates.push(date.toISOString().slice(0, 10));
    }
  }
  return dates;
}

export default function ShiftPlanner({
  restaurantId,
  timeZone,
  initialDay,
  onSavingChange,
  onSaved,
  onManageTemplates,
}: {
  restaurantId: string;
  timeZone: string;
  initialDay: string;
  onSavingChange: (saving: boolean) => void;
  onSaved: (date: string, count: number) => void;
  onManageTemplates?: () => void;
}) {
  const [options, setOptions] = useState<{
    staff: Staff[];
    templates: ShiftTemplate[];
  }>();
  const [loadError, setLoadError] = useState("");
  const [revision, setRevision] = useState(0);
  const [staffId, setStaffId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [day, setDay] = useState(initialDay);
  const [pattern, setPattern] = useState<Pattern>("single");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [confirmedDates, setConfirmedDates] = useState<string[]>([]);
  const template = options?.templates.find((item) => item.id === templateId);
  const dates = day ? shiftDates(day, pattern) : [];

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [first, templates] = await Promise.all([
          getStaffByRestaurant(restaurantId, 1, 50),
          getActiveShiftTemplates(restaurantId),
        ]);
        const remaining = await Promise.all(
          Array.from(
            { length: Math.max(0, first.data.pagination.totalPages - 1) },
            (_, index) => getStaffByRestaurant(restaurantId, index + 2, 50),
          ),
        );
        if (cancelled) return;
        const staff = [
          ...first.data.data,
          ...remaining.flatMap((page) => page.data.data),
        ]
          .filter((person) => person.status === "ACTIVE")
          .sort((a, b) => a.firstName.localeCompare(b.firstName));
        setOptions({ staff, templates });
      } catch (error) {
        if (!cancelled)
          setLoadError(
            attendanceError(error, "Unable to load staff or shift templates."),
          );
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [restaurantId, revision]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !staffId || !template || !dates.length) return;

    setSaveError("");
    const clockTimes = template.segments.map((segment, index, segments) => ({
      ...segment,
      startDay: segments
        .slice(0, index)
        .filter((entry) => entry.crossesMidnight).length,
    }));
    const first = clockTimes[0];
    const last = clockTimes.at(-1);
    if (!first || !last) {
      setSaveError("This template has no shift times.");
      return;
    }

    const tasks = dates
      .filter((date) => !confirmedDates.includes(date))
      .map((date) => {
        const end = new Date(`${date}T00:00:00Z`);
        end.setUTCDate(
          end.getUTCDate() + last.startDay + Number(last.crossesMidnight),
        );
        return {
          date,
          scheduledStart: restaurantDateTime(
            `${date}T${first.startTime}`,
            timeZone,
          ),
          scheduledEnd: restaurantDateTime(
            `${end.toISOString().slice(0, 10)}T${last.endTime}`,
            timeZone,
          ),
        };
      });

    setSaving(true);
    onSavingChange(true);
    const saved = [...confirmedDates];
    try {
      // Save in order and keep successful dates out of any retry.
      for (const { date, scheduledStart, scheduledEnd } of tasks) {
        if (
          !scheduledStart ||
          !scheduledEnd ||
          scheduledEnd <= scheduledStart
        ) {
          setSaveError(
            `${date}: The template times fall outside a valid shift in ${timeZone}.`,
          );
          return;
        }

        try {
          await createShiftSchedule({
            restaurantId,
            staffId,
            shiftTemplateId: template.id,
            scheduledStart,
            scheduledEnd,
          });
          saved.push(date);
        } catch (error) {
          setSaveError(
            `${date}: ${attendanceError(error, "Unable to confirm the shift was saved. Check the roster before retrying.")}`,
          );
          return;
        }
      }
      onSaved(day, saved.length);
    } finally {
      setConfirmedDates(saved);
      setSaving(false);
      onSavingChange(false);
    }
  }

  return (
    <section
      aria-labelledby="shift-planner"
      className="min-w-0 overflow-hidden rounded-2xl border border-zinc-700/75 bg-zinc-950"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-linear-to-r from-emerald-950 to-zinc-900 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-300/15 text-emerald-200">
            <CalendarPlus size={17} aria-hidden />
          </span>
          <h2 id="shift-planner" className="text-sm font-semibold text-white">
            Add shifts
          </h2>
        </div>
        <span className="text-xs text-zinc-300">
          {timeZone.replaceAll("_", " ")}
        </span>
      </div>
      {loadError && (
        <div className="flex flex-wrap items-center gap-3 p-4">
          <p role="alert" className="text-sm text-rose-200">
            {loadError}
          </p>
          <button
            type="button"
            onClick={() => {
              setLoadError("");
              setRevision((value) => value + 1);
            }}
            className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-zinc-700 px-3 text-xs font-medium text-white hover:bg-zinc-800"
          >
            <RefreshCw size={14} aria-hidden />
            Retry
          </button>
        </div>
      )}
      {!options && !loadError && (
        <p role="status" className="p-4 text-sm text-zinc-300">
          Loading staff and shift templates…
        </p>
      )}
      {options && (
        <form onSubmit={(event) => void save(event)}>
          <div className="space-y-3 p-4">
            {!options.templates.length && onManageTemplates && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-teal-400/20 bg-teal-400/8 px-3 py-2 text-xs text-teal-100">
                Create or activate a shift template to assign a shift.
                <button
                  type="button"
                  className="rounded-md bg-teal-300 px-2.5 py-1.5 font-medium text-teal-950 hover:bg-teal-200"
                  onClick={onManageTemplates}
                >
                  Manage templates
                </button>
              </div>
            )}
            <fieldset
              disabled={saving || confirmedDates.length > 0}
              className="grid min-w-0 gap-3 @lg:grid-cols-2 @5xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1.2fr)]"
            >
              <label className={fieldLabel}>
                Staff member
                <select
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  required
                  className={field}
                >
                  <option value="">
                    {options.staff.length ? "Select staff" : "No active staff"}
                  </option>
                  {options.staff.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.firstName} {person.lastName} ·{" "}
                      {person.employeeCode}
                    </option>
                  ))}
                </select>
              </label>
              <label className={fieldLabel}>
                Shift template
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  required
                  className={field}
                >
                  <option value="">
                    {options.templates.length
                      ? "Select template"
                      : "No active shift templates"}
                  </option>
                  {options.templates.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={fieldLabel}>
                Shift date
                <input
                  type="date"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  required
                  className={field}
                />
              </label>
              <label className={fieldLabel}>
                Repeat
                <select
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value as Pattern)}
                  className={field}
                >
                  <option value="single">One day</option>
                  <option value="weekly">Same weekday this month</option>
                  <option value="weekday">Weekdays this month</option>
                  <option value="daily">Every day this month</option>
                </select>
              </label>
            </fieldset>
            {template && (
              <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100 tabular-nums">
                <span className="font-medium text-emerald-200">
                  Template hours
                </span>
                {template.segments
                  .map(
                    (segment) =>
                      `${segment.startTime}–${segment.endTime}${segment.crossesMidnight ? " (+1 day)" : ""}`,
                  )
                  .join(" · ")}
              </p>
            )}
            {saveError && (
              <p role="alert" className="text-sm text-rose-200">
                {saveError}
              </p>
            )}
            {confirmedDates.length > 0 && (
              <p role="status" className="text-sm text-emerald-200">
                {confirmedDates.length} of {dates.length} shifts saved.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-800 bg-[#18191d] px-4 py-3">
            {confirmedDates.length > 0 && (
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  onSaved(confirmedDates[0] ?? day, confirmedDates.length)
                }
                className="min-h-10 rounded-lg border border-zinc-700 px-3 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
              >
                View saved shifts
              </button>
            )}
            <button
              type="submit"
              disabled={saving || !staffId || !template || !dates.length}
              className="min-h-10 w-full rounded-lg bg-emerald-300 px-4 text-sm font-semibold text-emerald-950 enabled:hover:bg-emerald-200 disabled:opacity-50 @lg:w-auto"
            >
              {saving
                ? "Saving…"
                : confirmedDates.length
                  ? "Retry remaining shifts"
                  : dates.length > 1
                    ? `Save ${dates.length} shifts`
                    : "Save shift"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
