"use client";

import { useState } from "react";

import { initialAttendance, initialEmployees } from "@/utils/mockData";

import type { AttendanceLog } from "@/utils/types";
import AttendanceScreen from "@/components/restaurantparts/AttendancePunchScreen";

export default function AttendancePage() {
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>(
    initialAttendance,
  );

  const [searchTerm] = useState("");

  function handlePunchIn(employeeId: string) {
    setAttendanceLogs((prev) => {
      const alreadyActive = prev.some(
        (log) => log.employeeId === employeeId && !log.checkOut,
      );

      if (alreadyActive) return prev;

      const employee = initialEmployees.find((emp) => emp.id === employeeId);

      if (!employee) return prev;

      const newLog: AttendanceLog = {
        id: `ATT-${Date.now()}`,
        employeeId: employee.id,
        employeeName: employee.name,
        restaurantId: employee.restaurantId,
        restaurantName: employee.restaurantName,
        checkIn: new Date().toISOString(),
        checkOut: null,
        status: "On Time",
      };

      return [newLog, ...prev];
    });
  }

  function handlePunchOut(attendanceLogId: string) {
    setAttendanceLogs((prev) =>
      prev.map((log) =>
        log.id === attendanceLogId
          ? {
              ...log,
              checkOut: new Date().toISOString(),
            }
          : log,
      ),
    );
  }

  return (
    <main className="h-full w-full">
      <AttendanceScreen
        employees={initialEmployees}
        attendanceLogs={attendanceLogs}
        searchTerm={searchTerm}
        onPunchIn={handlePunchIn}
        onPunchOut={handlePunchOut}
      />
    </main>
  );
}
