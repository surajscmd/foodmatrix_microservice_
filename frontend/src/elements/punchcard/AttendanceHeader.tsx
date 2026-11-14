import { Clock3, LogIn, RefreshCw, UserCheck, Users } from "lucide-react";

interface AttendanceHeaderProps {
  restaurantName: string;
  now: Date | null;
  timeZone: string;
  onDuty: number;
  ready: number;
  completed: number;
  showCounts: boolean;
  refreshing: boolean;
  busy: boolean;
  onRefresh: () => void;
}

export default function AttendanceHeader({
  restaurantName, now, timeZone, onDuty, ready, completed, showCounts, refreshing, busy, onRefresh,
}: AttendanceHeaderProps) {
  const metrics = [
    { label: "On duty", value: onDuty, icon: Users, color: "bg-emerald-400/15 text-emerald-300" },
    { label: "Ready to clock in", value: ready, icon: LogIn, color: "bg-cyan-400/15 text-cyan-300" },
    { label: "Clocked out today", value: completed, icon: UserCheck, color: "bg-violet-400/15 text-violet-300" },
  ];

  return (
    <header className="overflow-hidden rounded-2xl border border-teal-300/25 bg-linear-to-br from-teal-950 via-slate-900 to-indigo-950">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-300 text-teal-950">
            <Clock3 size={22} aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white">Punch Clock</h1>
            <p className="text-sm text-teal-100/90">{restaurantName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {now && <div className="text-right">
            <time dateTime={now.toISOString()} className="block text-lg font-semibold tabular-nums text-white">
              {now.toLocaleTimeString("en-IN", { timeZone, hour: "numeric", minute: "2-digit" })}
            </time>
            <p className="text-xs text-slate-300">
              {now.toLocaleDateString("en-IN", { timeZone, weekday: "short", day: "numeric", month: "short" })}
            </p>
          </div>}
          <button
            type="button"
            disabled={refreshing || busy}
            onClick={onRefresh}
            title="Refresh attendance"
            aria-label="Refresh attendance"
            className="grid size-9 place-items-center rounded-lg border border-white/20 bg-white/5 text-white hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-teal-300 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "motion-safe:animate-spin" : ""} aria-hidden />
          </button>
        </div>
      </div>
      <dl className="grid divide-y divide-white/10 border-t border-white/10 bg-slate-950/35 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {metrics.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-3 px-4 py-3">
            <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${color}`}><Icon size={16} aria-hidden /></span>
            <dt className="flex-1 text-xs font-medium text-slate-200">{label}</dt>
            <dd className="text-lg font-semibold tabular-nums text-white">{showCounts ? value : "—"}</dd>
          </div>
        ))}
      </dl>
    </header>
  );
}
