"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import AttendanceOverview, {
  type AttendanceTab,
} from "@/elements/staffattendance/AttendanceOverview";
import MonthlyTracker from "@/elements/staffattendance/MonthlyTracker";
import ShiftPlanner from "@/elements/staffattendance/ShiftPlanner";
import ShiftRoster from "@/elements/staffattendance/ShiftRoster";
import ShiftTemplates from "@/elements/staffattendance/ShiftTemplates";
import EditShiftDialog from "@/elements/staffattendance/EditShiftDialog";
import {
  monthQuery,
  moveMonth,
  restaurantDate,
} from "@/elements/staffattendance/report-dates";
import {
  attendanceError,
  clockOut,
  getAttendance,
  getLeaves,
  getShiftSchedules,
  type AttendanceShift,
  type LeaveRecord,
  type ShiftSchedule,
} from "@/lib/hr-api";
import { useOrganizationStore } from "@/store/organization-store";

type Report = {
  schedules: ShiftSchedule[];
  punches: AttendanceShift[];
  approvedLeave: LeaveRecord[];
};

export default function AttendanceReport() {
  const hydrated = useOrganizationStore((state) => state.isHydrated);
  const restaurant = useOrganizationStore((state) => state.selectedRestaurant);
  const user = useOrganizationStore((state) => state.currentUser?.systemUser);
  const error = useOrganizationStore((state) => state.error);
  const restaurantId = user?.managedRestaurantId ?? restaurant?.id;
  const location = restaurant?.id === restaurantId ? restaurant : null;

  if (!hydrated || !user || !restaurantId || !location) {
    return (
      <p
        role="status"
        className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300"
      >
        {hydrated
          ? error || "No restaurant is assigned or selected for this account."
          : "Loading restaurant…"}
      </p>
    );
  }

  return (
    <RestaurantReport
      key={restaurantId}
      restaurantId={restaurantId}

      timeZone={location.timezone || "UTC"}
      canManageTemplates={user.role === "RESTAURANT_ADMIN"}
    />
  );
}

function RestaurantReport({
  restaurantId,
  timeZone,
  canManageTemplates,
}: {
  restaurantId: string;
  timeZone: string;
  canManageTemplates: boolean;
}) {
  const today = restaurantDate(new Date(), timeZone);
  const [day, setDay] = useState(today);
  const [tab, setTab] = useState<AttendanceTab>("roster");
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data?: Report;
    error?: string;
  }>();
  const [pending, setPending] = useState<string | null>(null);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [punchError, setPunchError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingShift, setEditingShift] = useState<ShiftSchedule>();
  const month = day.slice(0, 7);
  const requestKey = `${month}/${revision}`;
  const loading = result?.key !== requestKey;
  const data = loading ? undefined : result.data;

  useEffect(() => {
    let cancelled = false;
    const query = { restaurantId, ...monthQuery(month) };

    const leave = canManageTemplates
      ? getLeaves({ ...query, status: "APPROVED" }).then(({ data }) => data)
      : Promise.resolve([]);
    Promise.all([getShiftSchedules(query), getAttendance(query), leave])
      .then(([schedules, attendance, approvedLeave]) => {
        if (cancelled) return;
        setResult({
          key: requestKey,
          data: {
            approvedLeave,
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
          setResult({
            key: requestKey,
            error: attendanceError(
              error,
              "Unable to load the attendance report.",
            ),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [canManageTemplates, month, requestKey, restaurantId, timeZone]);

  async function handleClockOut(shiftId: string) {
    if (pending || loading) return;
    setPending(shiftId);
    setPunchError("");
    setNotice("");
    try {
      const { message } = await clockOut(shiftId);
      setNotice(message);
    } catch (error) {
      setPunchError(
        attendanceError(
          error,
          "Clock-out could not be confirmed. Check the refreshed record.",
        ),
      );
    } finally {
      setRevision((value) => value + 1);
      setPending(null);
    }
  }

  function handleSaved(date: string, count: number) {
    setDay(date);
    setRevision((value) => value + 1);
    setNotice(
      count === 1
        ? "Shift added to the roster."
        : `${count} shifts added to the roster.`,
    );
    setTab("roster");
  }

  return (
    <div className="@container mx-auto max-w-[1500px] space-y-5 motion-safe:animate-fade-in">
      <AttendanceOverview
        tab={tab}
        onTabChange={setTab}
        savingSchedule={savingSchedule}
        refreshing={loading}
        canManageTemplates={canManageTemplates}
        onRefresh={() => {
          setNotice("");
          setPunchError("");
          setRevision((value) => value + 1);
        }}
      />

      {notice && (
        <p
          role="status"
          className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-2.5 text-sm text-emerald-100"
        >
          {notice}
        </p>
      )}
      {punchError && (
        <p
          role="alert"
          className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-2.5 text-sm text-rose-100"
        >
          {punchError}
        </p>
      )}

      {tab === "templates" ? (
        <ShiftTemplates
          restaurantId={restaurantId}
          onUseTemplate={() => setTab("add-shift")}
        />
      ) : tab === "add-shift" ? (
        <ShiftPlanner
          restaurantId={restaurantId}
          timeZone={timeZone}
          initialDay={day}
          onSavingChange={setSavingSchedule}
          onSaved={handleSaved}
          onManageTemplates={
            canManageTemplates ? () => setTab("templates") : undefined
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-3">
            <label
              htmlFor="attendance-period"
              className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500"
            >
              {tab === "roster" ? "Roster date" : "Report month"}
            </label>
            <button
              type="button"
              aria-label={tab === "roster" ? "Previous day" : "Previous month"}
              className="grid size-9 place-items-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-emerald-400/30 hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-emerald-300"
              onClick={() =>
                setDay(
                  tab === "roster"
                    ? new Date(Date.parse(`${day}T00:00:00Z`) - 86_400_000)
                        .toISOString()
                        .slice(0, 10)
                    : `${moveMonth(month, -1)}-01`,
                )
              }
            >
              <ChevronLeft size={15} aria-hidden />
            </button>
            <input
              id="attendance-period"
              type={tab === "roster" ? "date" : "month"}
              value={tab === "roster" ? day : month}
              onChange={(event) => {
                const value = event.target.value;
                if (value)
                  setDay(
                    tab === "roster"
                      ? value
                      : value === today.slice(0, 7)
                        ? today
                        : `${value}-01`,
                  );
              }}
              className="h-9 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 text-xs text-zinc-100 scheme-dark focus:border-emerald-400 focus:outline-none"
            />
            <button
              type="button"
              aria-label={tab === "roster" ? "Next day" : "Next month"}
              className="grid size-9 place-items-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-emerald-400/30 hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-emerald-300"
              onClick={() =>
                setDay(
                  tab === "roster"
                    ? new Date(Date.parse(`${day}T00:00:00Z`) + 86_400_000)
                        .toISOString()
                        .slice(0, 10)
                    : `${moveMonth(month, 1)}-01`,
                )
              }
            >
              <ChevronRight size={15} aria-hidden />
            </button>
            {tab === "roster" && (
              <button
                type="button"
                onClick={() => setDay(today)}
                className="h-9 rounded-lg px-2.5 text-xs font-medium text-emerald-200 hover:bg-emerald-400/10"
              >
                Today
              </button>
            )}
            <span className="ml-auto text-xs text-zinc-400">
              {timeZone.replaceAll("_", " ")}
            </span>
          </div>

          {loading && (
            <p
              role="status"
              className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300"
            >
              Loading attendance and schedules…
            </p>
          )}
          {!loading && result.error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-100"
            >
              {result.error}
            </p>
          )}
          {data &&
            (tab === "roster" ? (
              <ShiftRoster
                schedules={data.schedules.filter(
                  (shift) =>
                    restaurantDate(shift.scheduledStart, timeZone) === day,
                )}
                punches={data.punches.filter(
                  (shift) => restaurantDate(shift.clockInAt, timeZone) === day,
                )}
                timeZone={timeZone}
                pending={pending}
                onClockOut={(id) => void handleClockOut(id)}
                onEditShift={canManageTemplates ? setEditingShift : undefined}
                onLeave={
                  new Set(
                    data.approvedLeave
                      .filter(
                        (leave) =>
                          leave.startDate.slice(0, 10) <= day &&
                          leave.endDate.slice(0, 10) >= day,
                      )
                      .map((leave) => leave.staffId),
                  )
                }
              />
            ) : (
              <MonthlyTracker
                schedules={data.schedules}
                punches={data.punches}
                day={day}
                timeZone={timeZone}
                onDayChange={setDay}
                onOpenRoster={() => setTab("roster")}
              />
            ))}
        </>
      )}
      {editingShift && (
        <EditShiftDialog
          shift={editingShift}
          timeZone={timeZone}
          onClose={() => setEditingShift(undefined)}
          onSaved={(message, date) => {
            if (date) setDay(date);
            setEditingShift(undefined);
            setNotice(message);
            setRevision((value) => value + 1);
          }}
        />
      )}
    </div>
  );
}
