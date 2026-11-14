"use client";

import { isAxiosError } from "axios";
import { useEffect, useState } from "react";

import AttendanceHeader from "@/elements/punchcard/AttendanceHeader";
import AttendanceLogBoard from "@/elements/punchcard/AttendanceLogBoard";
import PunchStation from "@/elements/punchcard/PunchStation";
import {
  clockIn,
  clockOut,
  getAttendance,
  getShiftSchedules,
  getStaffByRestaurant,
  type AttendanceShift,
  type ShiftSchedule,
  type Staff,
} from "@/lib/hr-api";
import { useOrganizationStore } from "@/store/organization-store";

type AttendanceData = {
  staff: Staff[];
  shifts: AttendanceShift[];
  schedules: ShiftSchedule[];
};

function hrError(error: unknown, fallback: string) {
  if (!isAxiosError(error)) return fallback;

  const message: unknown = error.response?.data?.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) {
    return message.filter((item) => typeof item === "string").join(" ") || fallback;
  }
  return fallback;
}

async function getRestaurantStaff(restaurantId: string) {
  const { data } = await getStaffByRestaurant(restaurantId, 1, 50);
  const remaining = await Promise.all(
    Array.from({ length: Math.max(0, data.pagination.totalPages - 1) }, (_, index) =>
      getStaffByRestaurant(restaurantId, index + 2, 50),
    ),
  );

  return [...data.data, ...remaining.flatMap((page) => page.data.data)];
}

function RestaurantPunchClock({
  restaurantId,
  restaurantName,
  timeZone,
}: {
  restaurantId: string;
  restaurantName: string;
  timeZone: string;
}) {
  const [now, setNow] = useState<Date | null>(null);
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [punchError, setPunchError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [loadedKey, setLoadedKey] = useState("");

  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const localDate = now && dateFormatter.format(now);
  const loadKey = localDate ? `${localDate}/${revision}` : "";
  const loading = !loadKey || loadedKey !== loadKey;

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const interval = window.setInterval(tick, 15_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!loadKey) return;
    let cancelled = false;

    async function load() {
      try {
        // The UTC window covers the restaurant's local day, including overnight schedules.
        const day = Date.parse(`${localDate}T00:00:00Z`);
        const oneDay = 86_400_000;
        const [staff, attendance, schedules] = await Promise.all([
          getRestaurantStaff(restaurantId),
          getAttendance({ restaurantId }),
          getShiftSchedules({
            restaurantId,
            startDate: new Date(day - oneDay).toISOString(),
            endDate: new Date(day + 2 * oneDay).toISOString(),
          }),
        ]);
        if (cancelled) return;

        setData({ staff, shifts: attendance.data, schedules: schedules.data });
        setLoadError("");
      } catch (error) {
        if (!cancelled) setLoadError(hrError(error, "Could not load attendance."));
      } finally {
        if (!cancelled) setLoadedKey(loadKey);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [loadKey, localDate, restaurantId]);

  async function savePunch(id: string, submit: () => ReturnType<typeof clockIn>) {
    if (pendingId || loading || loadError) return;

    setPendingId(id);
    setPunchError("");
    setNotice("");
    try {
      const { data: shift, message } = await submit();
      setData((previous) =>
        previous && {
          ...previous,
          shifts: [shift, ...previous.shifts.filter((entry) => entry.id !== shift.id)],
        },
      );
      setNotice(`${shift.staff.firstName} ${shift.staff.lastName} · ${message}`);
    } catch (error) {
      setPunchError(hrError(error, "Could not save the punch. Check the attendance log before trying again."));
      // A response can fail after HR has already written the attendance record.
      setRevision((value) => value + 1);
    } finally {
      setPendingId(null);
    }
  }

  const shifts = data?.shifts ?? [];
  const onDuty = shifts.filter((shift) => !shift.clockOutAt);
  const completedToday = shifts.filter(
    (shift) => shift.clockOutAt && dateFormatter.format(new Date(shift.clockOutAt)) === localDate,
  );
  const activeStaff = new Set(data?.staff.filter((staff) => staff.status === "ACTIVE").map((staff) => staff.id));
  const workingStaff = new Set(onDuty.map((shift) => shift.staffId));
  const available = now && data
    ? data.schedules.filter((schedule) => {
        const start = new Date(schedule.scheduledStart);
        const end = new Date(schedule.scheduledEnd);
        if (
          schedule.status !== "SCHEDULED" ||
          !activeStaff.has(schedule.staffId) ||
          workingStaff.has(schedule.staffId) ||
          end <= now ||
          start > now
        ) {
          return false;
        }

        // HR attendance records currently omit the schedule ID.
        return !completedToday.some((shift) => {
          const clockInAt = new Date(shift.clockInAt);
          return shift.staffId === schedule.staffId && clockInAt >= start && clockInAt < end;
        });
      })
    : [];

  const blocked = loading || !!loadError || pendingId !== null;

  return (
    <div className="@container space-y-4">
      <AttendanceHeader
        restaurantName={restaurantName}
        now={now}
        timeZone={timeZone}
        onDuty={workingStaff.size}
        ready={new Set(available.map((schedule) => schedule.staffId)).size}
        completed={completedToday.length}
        showCounts={!!data && !loadError}
        refreshing={loading}
        onRefresh={() => setRevision((value) => value + 1)}
        busy={pendingId !== null}
      />

      {loadError && <p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-2.5 text-sm text-rose-100">{loadError}</p>}
      {punchError && <p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-2.5 text-sm text-rose-100">{punchError}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-2.5 text-sm text-emerald-100">{notice}</p>}

      {data ? (
        <div className="grid items-start gap-4 @3xl:grid-cols-2">
          <PunchStation
            schedules={available}
            timeZone={timeZone}
            blocked={blocked}
            pendingId={pendingId}
            onPunchIn={(schedule) =>
              void savePunch(schedule.id, () => clockIn({
                restaurantId,
                staffId: schedule.staffId,
                shiftScheduleId: schedule.id,
              }))
            }
          />
          <AttendanceLogBoard
            onDuty={onDuty}
            completed={completedToday}
            timeZone={timeZone}
            blocked={blocked}
            pendingId={pendingId}
            onPunchOut={(shiftId) => void savePunch(shiftId, () => clockOut(shiftId))}
          />
        </div>
      ) : loading && (
        <p role="status" className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
          Loading staff, roster and attendance…
        </p>
      )}
    </div>
  );
}

export default function AttendancePunchScreen() {
  const hydrated = useOrganizationStore((state) => state.isHydrated);
  const restaurant = useOrganizationStore((state) => state.selectedRestaurant);
  const user = useOrganizationStore((state) => state.currentUser?.systemUser);
  const error = useOrganizationStore((state) => state.error);

  const restaurantId = user?.managedRestaurantId ?? restaurant?.id;
  if (!hydrated || !restaurantId || !user) {
    return (
      <p role="status" className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-200">
        {hydrated ? error || "No restaurant is assigned or selected for this account." : "Loading restaurant…"}
      </p>
    );
  }

  const location = restaurant?.id === restaurantId ? restaurant : null;

  return (
    <RestaurantPunchClock
      key={restaurantId}
      restaurantId={restaurantId}
      restaurantName={location?.name ?? "Restaurant attendance"}
      timeZone={location?.timezone || "UTC"}
    />
  );
}
