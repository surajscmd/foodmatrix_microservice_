"use client";

import { Clock, MapPin, User, LogOut } from "lucide-react";

import type { Shift, AttendanceLog } from "@/utils/types";

interface ShiftRosterProps {
  shifts: Shift[];

  attendanceLogs: AttendanceLog[];

  searchTerm: string;

  onPunchOut: (attendanceId: string) => void;
}

export default function ShiftRoster({
  shifts,

  attendanceLogs,

  searchTerm,

  onPunchOut,
}: ShiftRosterProps) {
  const filteredShifts = shifts.filter(
    (shift) =>
      shift.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shift.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shift.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const activePunch = (employeeId: string) => {
    return attendanceLogs.find(
      (log) => log.employeeId === employeeId && !log.checkOut,
    );
  };

  return (
    <div
      className="
      rounded-2xl
      border
      border-zinc-800
      bg-zinc-900/30
      overflow-hidden
    "
    >
      {/* HEADER */}

      <div
        className="
        px-5
        py-4
        border-b
        border-zinc-800
        flex
        items-center
        justify-between
      "
      >
        <span
          className="
          text-xs
          uppercase
          tracking-wider
          font-mono
          text-zinc-300
        "
        >
          Registered Shifts
        </span>

        <span
          className="
          text-[10px]
          font-mono
          text-zinc-500
        "
        >
          Live Terminal Sync
        </span>
      </div>

      {filteredShifts.length === 0 ? (
        <div
          className="
            py-12
            text-center
            text-xs
            text-zinc-500
            font-mono
          "
        >
          No shifts found.
        </div>
      ) : (
        <div
          className="
            divide-y
            divide-zinc-800
          "
        >
          {filteredShifts.map((shift) => {
            const punch = activePunch(shift.employeeId);

            return (
              <div
                key={shift.id}
                className="
                        p-5
                        flex
                        flex-col
                        lg:flex-row
                        lg:items-center
                        justify-between
                        gap-4
                        hover:bg-zinc-900/60
                        transition
                      "
              >
                {/* EMPLOYEE */}

                <div
                  className="
                        flex
                        items-center
                        gap-3
                      "
                >
                  <div
                    className="
                          w-10
                          h-10
                          rounded-xl
                          bg-zinc-950
                          border
                          border-zinc-800
                          flex
                          items-center
                          justify-center
                        "
                  >
                    <User
                      className="
                            w-4
                            h-4
                            text-zinc-400
                          "
                    />
                  </div>

                  <div>
                    <div
                      className="
                            flex
                            items-center
                            gap-2
                          "
                    >
                      <span
                        className="
                              text-sm
                              text-white
                              font-medium
                            "
                      >
                        {shift.employeeName}
                      </span>

                      <span
                        className="
                              text-[10px]
                              px-2
                              py-0.5
                              rounded-md
                              bg-zinc-800
                              text-zinc-400
                              border
                              border-zinc-700
                            "
                      >
                        {shift.role}
                      </span>
                    </div>

                    <div
                      className="
                            flex
                            items-center
                            gap-1.5
                            mt-1
                            text-xs
                            text-zinc-500
                          "
                    >
                      <MapPin
                        className="
                              w-3
                              h-3
                            "
                      />

                      {shift.restaurantName}
                    </div>
                  </div>
                </div>

                {/* TIME */}

                <div
                  className="
                        flex
                        items-center
                        gap-2
                      "
                >
                  <Clock
                    className="
                          w-4
                          h-4
                          text-zinc-500
                        "
                  />

                  <div>
                    <p
                      className="
                            text-xs
                            text-zinc-200
                            font-mono
                          "
                    >
                      {shift.startTime}
                      {" - "}
                      {shift.endTime}
                    </p>

                    <p
                      className="
                            text-[10px]
                            text-zinc-500
                          "
                    >
                      {shift.date}
                    </p>
                  </div>
                </div>

                {/* STATUS */}

                <div
                  className="
                        flex
                        items-center
                        gap-3
                      "
                >
                  {punch ? (
                    <>
                      <span
                        className="
                              inline-flex
                              items-center
                              gap-2
                              rounded-full
                              px-3
                              py-1
                              text-[10px]
                              bg-emerald-500/10
                              text-emerald-400
                              border
                              border-emerald-500/20
                            "
                      >
                        <span
                          className="
                                w-1.5
                                h-1.5
                                rounded-full
                                bg-emerald-400
                                animate-pulse
                              "
                        />
                        ON DUTY
                      </span>

                      <button
                        onClick={() => onPunchOut(punch.id)}
                        className="
                                rounded-lg
                                p-2
                                border
                                border-zinc-800
                                text-zinc-400
                                hover:text-red-400
                                hover:border-red-500/30
                                transition
                              "
                        title="Punch Out"
                      >
                        <LogOut
                          className="
                                w-4
                                h-4
                              "
                        />
                      </button>
                    </>
                  ) : (
                    <span
                      className="
                              rounded-full
                              px-3
                              py-1
                              text-[10px]
                              bg-zinc-800
                              text-zinc-400
                              border
                              border-zinc-700
                            "
                    >
                      SCHEDULED
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
