"use client";

import AttendanceHeader from "@/elements/punchcard/AttendanceHeader";
import AttendanceLogBoard from "@/elements/punchcard/AttendanceLogBoard";
import PunchStation from "@/elements/punchcard/PunchStation";
import type { AttendanceLog, Employee } from "@/utils/types";

interface AttendanceScreenProps {
  employees: Employee[];
  attendanceLogs: AttendanceLog[];
  searchTerm: string;
  onPunchIn: (employeeId: string) => void;
  onPunchOut: (attendanceLogId: string) => void;
}

export default function AttendanceScreen({
  employees,
  attendanceLogs,
  searchTerm,
  onPunchIn,
  onPunchOut,
}: AttendanceScreenProps) {
  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* ======================================
          HEADER
      ====================================== */}

      <AttendanceHeader employees={employees} attendanceLogs={attendanceLogs} />

      {/* ======================================
          WORKSPACE
      ====================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <AttendanceLogBoard
          attendanceLogs={attendanceLogs}
          searchTerm={searchTerm}
          onPunchOut={onPunchOut}
        />

        <PunchStation
          employees={employees}
          attendanceLogs={attendanceLogs}
          searchTerm={searchTerm}
          onPunchIn={onPunchIn}
        />
      </div>
    </div>
  );
}
