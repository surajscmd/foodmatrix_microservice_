"use client";

import {
  initialRestaurants,
  initialShifts,
  initialAttendance,
  initialEmployees,
} from "@/utils/mockData";

import AttendanceReport from "@/components/restaurantparts/AttendanceReport";
import type { Shift } from "@/utils/types";

export default function AttendancePage() {
  const handleAddShifts = (shifts: Partial<Shift>[]) => {
    console.log("New shifts added:", shifts);
  };

  const handlePunchOut = (attendanceId: string) => {
    console.log("Punch out:", attendanceId);
  };

  return (
    <AttendanceReport
      employees={initialEmployees}
      restaurants={initialRestaurants}
      shifts={initialShifts}
      attendanceLogs={initialAttendance}
      onAddShifts={handleAddShifts}
      onPunchOut={handlePunchOut}
      searchTerm=""
    />
  );
}