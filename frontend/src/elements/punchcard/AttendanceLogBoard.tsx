"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Check, Clock, Search } from "lucide-react";

import type { AttendanceLog } from "@/utils/types";

interface AttendanceLogBoardProps {
  attendanceLogs: AttendanceLog[];
  searchTerm: string;
  onPunchOut: (attendanceLogId: string) => void;
}

export default function AttendanceLogBoard({
  attendanceLogs,
  searchTerm: globalSearch,
  onPunchOut,
}: AttendanceLogBoardProps) {
  const [localSearch, setLocalSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "active" | "completed">(
    "all",
  );

  const searchQuery = localSearch || globalSearch;

  const filteredLogs = useMemo(() => {
    return attendanceLogs.filter((log) => {
      const matchesSearch =
        log.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.restaurantName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterMode === "active") return !log.checkOut;

      if (filterMode === "completed") return !!log.checkOut;

      return true;
    });
  }, [attendanceLogs, searchQuery, filterMode]);

  return (
    <div className="lg:col-span-7 rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      {/* =======================================
          Header
      ======================================= */}

      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 p-5 border-b border-zinc-800">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-mono text-zinc-500">
            Workforce Activity
          </span>

          <h2 className="mt-1 text-sm font-semibold text-white">
            Live Attendance Log Board
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />

            <input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search employee..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-10 pr-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/30"
            />
          </div>

          <div className="flex rounded-xl border border-zinc-800 overflow-hidden">
            {["all", "active", "completed"].map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode as any)}
                className={`px-4 py-2 text-xs uppercase font-bold transition-colors ${
                  filterMode === mode
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* =======================================
          Attendance List
      ======================================= */}

      <div className="divide-y divide-zinc-800 max-h-[620px] overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="py-20 text-center text-zinc-500">
            No attendance records found.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const checkIn = new Date(log.checkIn);
            const checkOut = log.checkOut ? new Date(log.checkOut) : null;

            return (
              <div
                key={log.id}
                className="flex items-center justify-between p-5 hover:bg-zinc-900/40 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">
                      {log.employeeName}
                    </h3>

                    {log.status === "Late" && (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] uppercase text-amber-400">
                        <AlertCircle className="w-3 h-3" />
                        Late
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-xs text-zinc-500">
                    {log.restaurantName}
                  </p>

                  <div className="mt-2 flex items-center gap-5 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      In :
                      {checkIn.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    {checkOut && (
                      <span>
                        Out :
                        {checkOut.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {!checkOut ? (
                  <button
                    onClick={() => onPunchOut(log.id)}
                    className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold uppercase text-slate-950 hover:bg-rose-400 transition-colors"
                  >
                    Swipe Out
                  </button>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs font-bold text-emerald-400">
                    <Check className="w-4 h-4" />
                    Completed
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
