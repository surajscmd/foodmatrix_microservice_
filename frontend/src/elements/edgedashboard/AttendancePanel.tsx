import {
  UserCheck,
  Clock3,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

interface Attendance {
  id: string;
  employeeName: string;
  checkIn: string;
  checkOut?: string | null;
  status: string;
}

interface AttendancePanelProps {
  attendance: Attendance[];
}

export default function AttendancePanel({
  attendance,
}: AttendancePanelProps) {
  const onTimeCount = attendance.filter(
    (item) => item.status === "On Time",
  ).length;

  const lateCount = attendance.filter(
    (item) => item.status === "Late",
  ).length;

  const attendanceRate = Math.round(
    (onTimeCount / attendance.length) * 100,
  );

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
      {/* Header */}

      <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
            <UserCheck size={18} />
          </div>

          <div>
            <h2 className="font-semibold text-white">
              Workforce Attendance
            </h2>

            <p className="text-xs text-zinc-500">
              {"`Today's attendance summary`"}
            </p>
          </div>
        </div>

        <button className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:border-emerald-500/30 hover:text-emerald-400">
          View Report

          <ArrowRight size={14} />
        </button>
      </div>

      {/* Summary */}

      <div className="grid grid-cols-2 gap-4 p-5">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            On Time
          </p>

          <h3 className="mt-2 text-3xl font-bold text-emerald-400">
            {onTimeCount}
          </h3>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Late
          </p>

          <h3 className="mt-2 text-3xl font-bold text-amber-400">
            {lateCount}
          </h3>
        </div>
      </div>

      {/* Attendance Rate */}

      <div className="px-5 pb-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-zinc-400">
            Attendance Rate
          </span>

          <span className="font-semibold text-white">
            {attendanceRate}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all"
            style={{
              width: `${attendanceRate}%`,
            }}
          />
        </div>
      </div>

      {/* Employee List */}

      <div className="space-y-3 border-t border-zinc-800 p-5">
        {attendance.map((person) => (
          <div
            key={person.id}
            className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 transition-all hover:border-zinc-700"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-white">
                  {person.employeeName}
                </h3>

                <div className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
                  <Clock3 size={14} />

                  {new Date(person.checkIn).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              {person.status === "On Time" ? (
                <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 size={14} />

                  On Time
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
                  <AlertTriangle size={14} />

                  Late
                </div>
              )}
            </div>

            {person.checkOut && (
              <div className="mt-3 flex justify-between text-xs text-zinc-500">
                <span>
                  Check Out
                </span>

                <span>
                  {new Date(person.checkOut).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}