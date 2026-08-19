"use client";

import { useState } from "react";

import type { Employee, Restaurant, Shift, AttendanceLog } from "@/utils/types";

import AttendanceOverview from "@/elements/staffattendance/AttendanceOverview";
import ShiftRoster from "@/elements/staffattendance/ShiftRoster";
import MonthlyTracker from "@/elements/staffattendance/MonthlyTracker";
import ShiftPlanner from "@/elements/staffattendance/ShiftPlanner";

type AttendanceTab = "roster" | "monthly-tracker" | "add-shift";

interface AttendanceScreenProps {
  employees: Employee[];

  restaurants: Restaurant[];

  shifts: Shift[];

  attendanceLogs: AttendanceLog[];

  onAddShifts: (shifts: Partial<Shift>[]) => void;

  onPunchOut: (attendanceId: string) => void;

  searchTerm: string;
}

export default function AttendanceReport({
  employees,

  restaurants,

  shifts,

  attendanceLogs,

  onAddShifts,

  onPunchOut,

  searchTerm,
}: AttendanceScreenProps) {
  const [activeTab, setActiveTab] = useState<AttendanceTab>("roster");

  const stats = {
    activePunches: attendanceLogs.filter((log) => !log.checkOut).length,

    completedPunches: attendanceLogs.filter((log) => Boolean(log.checkOut))
      .length,

    latePunches: attendanceLogs.filter((log) => log.status === "Late").length,

    totalShifts: shifts.length,
  };

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <AttendanceOverview
        stats={stats}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {activeTab === "roster" && (
        <ShiftRoster
          shifts={shifts}
          attendanceLogs={attendanceLogs}
          searchTerm={searchTerm}
          onPunchOut={onPunchOut}
        />
      )}

      {activeTab === "monthly-tracker" && (
        <MonthlyTracker
          employees={employees}
          shifts={shifts}
          attendanceLogs={attendanceLogs}
        />
      )}

      {activeTab === "add-shift" && (
        <ShiftPlanner
          employees={employees}
          restaurants={restaurants}
          onAddShifts={onAddShifts}
          setActiveTab={setActiveTab}
        />
      )}
    </div>
  );
}
