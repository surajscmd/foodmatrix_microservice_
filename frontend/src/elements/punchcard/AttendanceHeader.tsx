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
  restaurantName,
  now,
  timeZone,
  onDuty,
  ready,
  completed,
  showCounts,
  refreshing,
  busy,
  onRefresh,
}: AttendanceHeaderProps) {
  const metrics = [
    { label: "On duty", value: onDuty, icon: Users, color: "bg-emerald-400/15 text-emerald-300" },
    { label: "Ready to clock in", value: ready, icon: LogIn, color: "bg-teal-400/15 text-teal-300" },
    { label: "Clocked out today", value: completed, icon: UserCheck, color: "bg-violet-400/15 text-violet-300" },
  ];

  return (
    <header className="overflow-hidden rounded-2xl border border-zinc-700/75 bg-zinc-950 shadow-lg shadow-black/20">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-400/20 bg-linear-to-r from-teal-800 to-slate-800 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-300 text-emerald-950">
            <Clock3 size={19} aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold tracking-tight text-white">Punch Clock</h1>
            <p className="mt-0.5 break-words text-xs text-teal-100">{restaurantName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {now && <div className="text-right">
            <time dateTime={now.toISOString()} className="block text-sm font-semibold tabular-nums text-white">
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
      <dl className="grid divide-y divide-white/10 bg-[#18191d] @md:grid-cols-3 @md:divide-x @md:divide-y-0">
        {metrics.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-2.5 px-4 py-2.5">
            <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${color}`}><Icon size={14} aria-hidden /></span>
            <dt className="flex-1 text-xs font-medium text-zinc-300">{label}</dt>
            <dd className="text-sm font-semibold tabular-nums text-white">{showCounts ? value : "—"}</dd>
          </div>
        ))}
      </dl>
    </header>
  );
}
