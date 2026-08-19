"use client";

import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

import type { Employee, Shift, AttendanceLog } from "@/utils/types";

interface MonthlyTrackerProps {
  employees: Employee[];
  shifts: Shift[];
  attendanceLogs: AttendanceLog[];
}

type CalendarStatus = "Rest" | "Shift" | "Active" | "Done";

export default function MonthlyTracker({
  employees,
  shifts,
  attendanceLogs,
}: MonthlyTrackerProps) {
  const today = new Date();

  const [trackerEmpId, setTrackerEmpId] = useState(employees[0]?.id ?? "");

  const [trackerYear, setTrackerYear] = useState(today.getFullYear());

  const [trackerMonth, setTrackerMonth] = useState(today.getMonth());

  const [selectedDay, setSelectedDay] = useState<number | null>(
    today.getDate(),
  );

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const employee =
    employees.find((emp) => emp.id === trackerEmpId) || employees[0];

  /*
    Calendar Logic
    Sunday = 0
    Saturday = 6
  */

  const firstDay = new Date(trackerYear, trackerMonth, 1).getDay();

  const totalDays = new Date(trackerYear, trackerMonth + 1, 0).getDate();

  /*
     Always create 42 cells
     6 rows x 7 columns

     This is the important fix.
  */

  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDay + 1;

    if (day < 1 || day > totalDays) {
      return null;
    }

    return day;
  });

  const getDateString = (day: number) => {
    return (
      `${trackerYear}-` +
      `${String(trackerMonth + 1).padStart(2, "0")}-` +
      `${String(day).padStart(2, "0")}`
    );
  };

  const getDayData = (day: number) => {
    if (!employee) {
      return {
        shift: undefined,
        log: undefined,
      };
    }

    const date = getDateString(day);

    const shift = shifts.find(
      (item) => item.employeeId === employee.id && item.date === date,
    );

    const log = attendanceLogs.find(
      (item) =>
        item.employeeId === employee.id && item.checkIn.startsWith(date),
    );

    return {
      shift,
      log,
    };
  };
  const changeMonth = (direction: "next" | "prev") => {
    setSelectedDay(1);

    if (direction === "prev") {
      if (trackerMonth === 0) {
        setTrackerMonth(11);
        setTrackerYear((year) => year - 1);
      } else {
        setTrackerMonth((month) => month - 1);
      }
    }

    if (direction === "next") {
      if (trackerMonth === 11) {
        setTrackerMonth(0);

        setTrackerYear((year) => year + 1);
      } else {
        setTrackerMonth((month) => month + 1);
      }
    }
  };

  const getStatusStyle = (status: CalendarStatus) => {
    const styles = {
      Rest: "border-zinc-800 text-zinc-600",

      Shift: "border-cyan-500/30 bg-cyan-500/5 text-cyan-400",

      Active: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",

      Done: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
    };

    return styles[status];
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />

            <h3 className="text-sm font-semibold text-white">
              Monthly Attendance Tracker
            </h3>
          </div>

          <p className="text-xs text-zinc-500 mt-2">
            Audit employee shifts and terminal activity.
          </p>
        </div>

        <div className="flex gap-3">
          <select
            value={trackerEmpId}
            onChange={(e) => {
              setTrackerEmpId(e.target.value);

              setSelectedDay(1);
            }}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} • {emp.role}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-xl px-3">
            <button onClick={() => changeMonth("prev")}>
              <ChevronLeft className="w-4 h-4 text-zinc-400" />
            </button>

            <span className="text-xs font-mono text-zinc-300">
              {months[trackerMonth]} {trackerYear}
            </span>

            <button onClick={() => changeMonth("next")}>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CALENDAR LEFT SIDE */}

        <div className="lg:col-span-8 bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3 mb-4">
            <span className="text-xs font-mono uppercase text-zinc-300 font-bold">
              Attendance Calendar
            </span>

            <span className="text-[10px] text-zinc-500">
              Select day for audit
            </span>
          </div>

          {/* WEEK HEADER */}

          <div className="grid grid-cols-7 gap-2 mb-2">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
              <span
                key={day}
                className="text-center text-[9px] font-mono text-zinc-500"
              >
                {day}
              </span>
            ))}
          </div>

          {/* REAL CALENDAR GRID */}

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="
                      aspect-square
                      bg-zinc-950/20
                      border
                      border-transparent
                      rounded-xl
                      "
                  />
                );
              }

              const { shift, log } = getDayData(day);

              let status: CalendarStatus = "Rest";

              if (log) {
                status = log.checkOut ? "Done" : "Active";
              } else if (shift) {
                status = "Shift";
              }

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`
                    aspect-square
                    p-2
                    border
                    rounded-xl
                    flex
                    flex-col
                    justify-between
                    text-left
                    transition-all
                    cursor-pointer
                    ${getStatusStyle(status)}
                    ${
                      selectedDay === day
                        ? "ring-2 ring-emerald-400 border-transparent"
                        : ""
                    }
                    `}
                >
                  <span className="text-xs font-mono font-bold">{day}</span>

                  <span className="text-[8px] uppercase font-mono">
                    {status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        {/* AUDIT PANEL */}

        <div className="lg:col-span-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5 space-y-5">
          <div className="border-b border-zinc-800 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-mono text-emerald-400">
                Day Audit Console
              </span>

              <span className="text-[9px] px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-500">
                LIVE
              </span>
            </div>

            <h4 className="mt-2 text-sm text-white font-medium">
              {selectedDay
                ? `${months[trackerMonth]} ${selectedDay}, ${trackerYear}`
                : "Select a date"}
            </h4>
          </div>

          {selectedDay ? (
            (() => {
              const { shift, log } = getDayData(selectedDay);

              return (
                <div className="space-y-4">
                  {/* CURRENT STATUS */}

                  <AuditBox title="Current Status">
                    {log ? (
                      log.checkOut ? (
                        <div className="flex items-center gap-2 text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          Shift Completed
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Currently On Duty
                        </div>
                      )
                    ) : shift ? (
                      <div className="flex items-center gap-2 text-cyan-400">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        Scheduled Shift
                      </div>
                    ) : (
                      <span className="text-zinc-500">Rest Day</span>
                    )}
                  </AuditBox>

                  {/* SHIFT INFO */}

                  <AuditBox title="Planned Schedule">
                    {shift ? (
                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Time</span>

                          <span className="text-white font-mono">
                            {shift.startTime} - {shift.endTime}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-zinc-500">Location</span>

                          <span className="text-zinc-300">
                            {shift.restaurantName}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-500">
                        No assigned shift.
                      </span>
                    )}
                  </AuditBox>

                  {/* ATTENDANCE */}

                  <AuditBox title="Terminal Activity">
                    {log ? (
                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Punch In</span>

                          <span className="font-mono text-white">
                            {new Date(log.checkIn).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {log.checkOut && (
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Punch Out</span>

                            <span className="font-mono text-white">
                              {new Date(log.checkOut).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        )}

                        <div className="pt-3 border-t border-zinc-800 flex justify-between">
                          <span className="text-zinc-500">Status</span>

                          <span className="text-emerald-400 font-mono">
                            {log.status}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-500">
                        No punch record found.
                      </span>
                    )}
                  </AuditBox>

                  {/* VERIFICATION */}

                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[10px] font-mono">
                    {log && shift && (
                      <span className="text-emerald-400">
                        ✓ Scheduled attendance verified
                      </span>
                    )}

                    {shift && !log && (
                      <span className="text-amber-400">
                        ⚠ No punch recorded
                      </span>
                    )}

                    {!shift && !log && (
                      <span className="text-zinc-500">
                        No operational activity recorded
                      </span>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="py-12 text-center text-xs text-zinc-500">
              Select a day to view audit details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AuditBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3 space-y-2">
      <span className="text-[10px] uppercase font-mono text-zinc-500">
        {title}
      </span>

      {children}
    </div>
  );
}

// function TrackerCard({
//   title,
//   value,
//   subtitle,
// }: {
//   title: string;
//   value: string;
//   subtitle: string;
// }) {
//   return (
//     <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
//       <span className="text-[10px] uppercase font-mono text-zinc-500">
//         {title}
//       </span>

//       <h4 className="text-lg font-mono font-bold text-white mt-1">{value}</h4>

//       <p className="text-[10px] text-zinc-500">{subtitle}</p>
//     </div>
//   );
// }
