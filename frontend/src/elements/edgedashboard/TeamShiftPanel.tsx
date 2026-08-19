import {
  Users,
  Clock3,
  CalendarDays,
  ArrowRight,
  PlayCircle,
  CheckCircle2,
} from "lucide-react";

interface Shift {
  id: string;
  employeeName: string;
  role: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface TeamShiftPanelProps {
  shifts: Shift[];
}

export default function TeamShiftPanel({
  shifts,
}: TeamShiftPanelProps) {
  const activeEmployees = shifts.filter(
    (shift) => shift.status === "In Progress",
  );

  const statusConfig = (status: string) => {
    switch (status) {
      case "In Progress":
        return {
          icon: PlayCircle,
          color: "text-emerald-400",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/20",
        };

      case "Scheduled":
        return {
          icon: CalendarDays,
          color: "text-amber-400",
          bg: "bg-amber-500/10",
          border: "border-amber-500/20",
        };

      case "Completed":
        return {
          icon: CheckCircle2,
          color: "text-zinc-400",
          bg: "bg-zinc-700/20",
          border: "border-zinc-700",
        };

      default:
        return {
          icon: Clock3,
          color: "text-zinc-400",
          bg: "bg-zinc-700/20",
          border: "border-zinc-700",
        };
    }
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
      {/* Header */}

      <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
            <Users size={18} />
          </div>

          <div>
            <h2 className="font-semibold text-white">
              Team Shifts
            </h2>

            <p className="text-xs text-zinc-500">
              {activeEmployees.length} employees on duty
            </p>
          </div>
        </div>

        <button className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:border-emerald-500/30 hover:text-emerald-400">
          View Schedule

          <ArrowRight size={14} />
        </button>
      </div>

      {/* Shift Cards */}

      <div className="space-y-3 p-5">
        {shifts.map((shift) => {
          const status = statusConfig(shift.status);
          const Icon = status.icon;

          return (
            <div
              key={shift.id}
              className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 transition-all hover:border-zinc-700"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white">
                    {shift.employeeName}
                  </h3>

                  <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
                    {shift.role}
                  </p>
                </div>

                <div
                  className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${status.bg} ${status.border} ${status.color}`}
                >
                  <Icon size={14} />

                  {shift.status}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Clock3 size={15} />

                  {shift.startTime} — {shift.endTime}
                </div>

                <span className="text-xs text-zinc-600">
                  Shift #{shift.id}
                </span>
              </div>

              {/* Timeline */}

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full ${
                    shift.status === "Completed"
                      ? "w-full bg-zinc-500"
                      : shift.status === "In Progress"
                      ? "w-2/3 bg-emerald-400"
                      : "w-1/4 bg-amber-400"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}