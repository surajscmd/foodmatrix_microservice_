"use client";

import { useEffect, useState } from "react";

import AttendanceOverview, { type AttendanceTab } from "@/elements/staffattendance/AttendanceOverview";
import MonthlyTracker from "@/elements/staffattendance/MonthlyTracker";
import ShiftPlanner from "@/elements/staffattendance/ShiftPlanner";
import ShiftRoster from "@/elements/staffattendance/ShiftRoster";
import { monthQuery, restaurantDate } from "@/elements/staffattendance/report-dates";
import {
  attendanceError,
  clockOut,
  getAttendance,
  getShiftSchedules,
  type AttendanceShift,
  type ShiftSchedule,
} from "@/lib/hr-api";
import { useOrganizationStore } from "@/store/organization-store";

type Report = { schedules: ShiftSchedule[]; punches: AttendanceShift[] };

export default function AttendanceReport() {
  const hydrated = useOrganizationStore((state) => state.isHydrated);
  const restaurant = useOrganizationStore((state) => state.selectedRestaurant);
  const user = useOrganizationStore((state) => state.currentUser?.systemUser);
  const error = useOrganizationStore((state) => state.error);
  const restaurantId = user?.managedRestaurantId ?? restaurant?.id;
  const location = restaurant?.id === restaurantId ? restaurant : null;

  if (!hydrated || !user || !restaurantId || !location) {
    return (
      <p role="status" className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
        {hydrated ? error || "No restaurant is assigned or selected for this account." : "Loading restaurant…"}
      </p>
    );
  }

  return (
    <RestaurantReport
      key={restaurantId}
      restaurantId={restaurantId}
      restaurantName={location.name}
      timeZone={location.timezone || "UTC"}
    />
  );
}

function RestaurantReport({ restaurantId, restaurantName, timeZone }: {
  restaurantId: string;
  restaurantName: string;
  timeZone: string;
}) {
  const today = restaurantDate(new Date(), timeZone);
  const [day, setDay] = useState(today);
  const [tab, setTab] = useState<AttendanceTab>("roster");
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ key: string; data?: Report; error?: string }>();
  const [pending, setPending] = useState<string | null>(null);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [punchError, setPunchError] = useState("");
  const [notice, setNotice] = useState("");
  const month = day.slice(0, 7);
  const requestKey = `${month}/${revision}`;
  const loading = result?.key !== requestKey;
  const data = loading ? undefined : result.data;

  useEffect(() => {
    let cancelled = false;
    const query = { restaurantId, ...monthQuery(month) };

    Promise.all([getShiftSchedules(query), getAttendance(query)])
      .then(([schedules, attendance]) => {
        if (cancelled) return;
        setResult({
          key: requestKey,
          data: {
            schedules: schedules.data.filter((shift) =>
              restaurantDate(shift.scheduledStart, timeZone).startsWith(month),
            ),
            punches: attendance.data.filter((shift) =>
              restaurantDate(shift.clockInAt, timeZone).startsWith(month),
            ),
          },
        });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setResult({ key: requestKey, error: attendanceError(error, "Unable to load the attendance report.") });
        }
      });

    return () => { cancelled = true; };
  }, [month, requestKey, restaurantId, timeZone]);

  async function handleClockOut(shiftId: string) {
    if (pending || loading) return;
    setPending(shiftId);
    setPunchError("");
    setNotice("");
    try {
      const { message } = await clockOut(shiftId);
      setNotice(message);
    } catch (error) {
      setPunchError(attendanceError(error, "Clock-out could not be confirmed. Check the refreshed record."));
    } finally {
      setRevision((value) => value + 1);
      setPending(null);
    }
  }

  function handleSaved(date: string, count: number) {
    setDay(date);
    setRevision((value) => value + 1);
    setNotice(count === 1 ? "Shift added to the roster." : `${count} shifts added to the roster.`);
    setTab("roster");
  }

  return (
    <div className="@container space-y-4">
      <AttendanceOverview
        restaurantName={restaurantName}
        tab={tab}
        onTabChange={setTab}
        savingSchedule={savingSchedule}
        refreshing={loading}
        onRefresh={() => {
          setNotice("");
          setPunchError("");
          setRevision((value) => value + 1);
        }}
      />

      {notice && <p role="status" className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-2.5 text-sm text-emerald-100">{notice}</p>}
      {punchError && <p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-2.5 text-sm text-rose-100">{punchError}</p>}

      {tab === "add-shift" ? (
        <ShiftPlanner
          restaurantId={restaurantId}
          timeZone={timeZone}
          initialDay={day}
          onSavingChange={setSavingSchedule}
          onSaved={handleSaved}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-700/75 bg-zinc-950 px-4 py-2.5">
            <label htmlFor="attendance-period" className="text-xs font-medium text-zinc-300">
              {tab === "roster" ? "Roster date" : "Report month"}
            </label>
            <input
              id="attendance-period"
              type={tab === "roster" ? "date" : "month"}
              value={tab === "roster" ? day : month}
              onChange={(event) => {
                const value = event.target.value;
                if (value) setDay(tab === "roster" ? value : value === today.slice(0, 7) ? today : `${value}-01`);
              }}
              className="h-9 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 text-sm text-zinc-100 scheme-dark focus:border-emerald-400 focus:outline-none"
            />
            {tab === "roster" && (
              <button type="button" onClick={() => setDay(today)} className="h-9 rounded-lg px-2.5 text-xs font-medium text-emerald-200 hover:bg-emerald-400/10">
                Today
              </button>
            )}
            <span className="ml-auto text-xs text-zinc-400">{timeZone.replaceAll("_", " ")}</span>
          </div>

          {loading && <p role="status" className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">Loading attendance and schedules…</p>}
          {!loading && result.error && <p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-100">{result.error}</p>}
          {data && (tab === "roster" ? (
            <ShiftRoster
              schedules={data.schedules.filter((shift) => restaurantDate(shift.scheduledStart, timeZone) === day)}
              punches={data.punches.filter((shift) => restaurantDate(shift.clockInAt, timeZone) === day)}
              timeZone={timeZone}
              pending={pending}
              onClockOut={(id) => void handleClockOut(id)}
            />
          ) : (
            <MonthlyTracker schedules={data.schedules} punches={data.punches} day={day} timeZone={timeZone} onDayChange={setDay} />
          ))}
        </>
      )}
    </div>
  );
}
