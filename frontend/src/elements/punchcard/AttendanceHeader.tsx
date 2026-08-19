"use client";

import {
  Activity,
  AlertCircle,
  Check,
  Terminal,
  UserCheck,
} from "lucide-react";

import type { AttendanceLog, Employee } from "@/utils/types";

interface AttendanceHeaderProps {
  employees: Employee[];
  attendanceLogs: AttendanceLog[];
}

export default function AttendanceHeader({
  employees,
  attendanceLogs,
}: AttendanceHeaderProps) {
  const activePunches = attendanceLogs.filter((log) => !log.checkOut).length;

  const completedPunches = attendanceLogs.filter(
    (log) => !!log.checkOut,
  ).length;

  const latePunches = attendanceLogs.filter(
    (log) => log.status === "Late",
  ).length;

  return (
    <>
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center">
              <Terminal className="w-6 h-6 text-emerald-400" />
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-[0.25em] font-mono text-zinc-500">
                Workforce Operations
              </span>

              <h1 className="mt-1 text-2xl font-bold text-white">
                Attendance & Punch Clock
              </h1>
            </div>
          </div>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-500">
            Monitor employee attendance, biometric punch activity,
            shift lifecycle and workforce availability in real time
            across restaurant operations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
            <span className="block text-[10px] uppercase font-mono text-zinc-500">
              Terminal
            </span>

            <span className="text-sm font-semibold text-white">
              TRM-PUNCH-09
            </span>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
            <span className="block text-[10px] uppercase font-mono text-emerald-400">
              Status
            </span>

            <span className="text-sm font-semibold text-emerald-300">
              Online
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================
          KPI CARDS
      ====================================================== */}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Active */}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>

            <span className="text-[10px] uppercase font-mono text-emerald-400">
              Live
            </span>
          </div>

          <h2 className="mt-4 text-3xl font-bold text-white">
            {activePunches}
          </h2>

          <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
            Employees On Duty
          </p>
        </div>

        {/* Completed */}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Check className="w-5 h-5 text-blue-400" />
            </div>

            <span className="text-[10px] uppercase font-mono text-blue-400">
              Closed
            </span>
          </div>

          <h2 className="mt-4 text-3xl font-bold text-white">
            {completedPunches}
          </h2>

          <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
            Completed Shifts
          </p>
        </div>

        {/* Late */}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-400" />
            </div>

            <span className="text-[10px] uppercase font-mono text-amber-400">
              Alerts
            </span>
          </div>

          <h2 className="mt-4 text-3xl font-bold text-white">
            {latePunches}
          </h2>

          <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
            Late Arrivals
          </p>
        </div>

        {/* Employees */}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-purple-400" />
            </div>

            <span className="text-[10px] uppercase font-mono text-purple-400">
              Staff
            </span>
          </div>

          <h2 className="mt-4 text-3xl font-bold text-white">
            {employees.length}
          </h2>

          <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
            Registered Employees
          </p>
        </div>
      </div>
    </>
  );
}