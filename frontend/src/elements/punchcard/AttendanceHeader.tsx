import { LogIn, RefreshCw, TrendingUp, UserCheck, Users } from "lucide-react";

interface AttendanceHeaderProps {
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
    {
      label: "On duty",
      value: onDuty,
      icon: Users,
      color: "text-sky-400",
      iconBg: "border-sky-500/10 bg-sky-500/10",
      valueClass: "text-white",
      accent: "from-sky-500/40 via-sky-500/10 to-transparent",
      description: "staff currently clocked in",
      suffix: "staff",
      footer: "Current attendance",
    },
    {
      label: "Ready to clock in",
      value: ready,
      icon: LogIn,
      color: "text-emerald-400",
      iconBg: "border-emerald-500/10 bg-emerald-500/10",
      valueClass: "text-emerald-400",
      accent: "from-emerald-500/40 via-emerald-500/10 to-transparent",
      description: "scheduled staff available to start",
      suffix: "staff",
      footer: "Available for clock-in",
    },
    {
      label: "Clocked out today",
      value: completed,
      icon: UserCheck,
      color: "text-rose-400",
      iconBg: "border-rose-500/10 bg-rose-500/10",
      valueClass: completed > 0 ? "text-rose-400" : "text-white",
      accent: "from-rose-500/40 via-rose-500/10 to-transparent",
      description: "attendance shifts ended today",
      suffix: "shifts",
      footer: "Today's clock-outs",
    },
  ];

  return (
    <header className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="h-4 w-1 rounded-full bg-emerald-400" />
          <div className="min-w-0">
            <h1 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
              Punch Clock
            </h1>
            <p className="mt-0.5 text-[10px] text-zinc-500">
              Shift attendance, staff clock-ins and clock-outs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {now && (
            <div className="text-right">
              <time
                dateTime={now.toISOString()}
                className="block font-mono text-xs font-semibold tabular-nums text-zinc-300"
              >
                {now.toLocaleTimeString("en-IN", {
                  timeZone,
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </time>
              <p className="mt-0.5 text-[10px] text-zinc-500">
                {now.toLocaleDateString("en-IN", {
                  timeZone,
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </div>
          )}
          <button
            type="button"
            disabled={refreshing || busy}
            onClick={onRefresh}
            title="Refresh attendance"
            aria-label="Refresh attendance"
            className="grid size-10 place-items-center rounded-xl border border-zinc-800 bg-zinc-900/70 text-zinc-400 transition-colors hover:border-emerald-400/30 hover:text-emerald-400 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "motion-safe:animate-spin" : ""}
              aria-hidden
            />
          </button>
        </div>
      </div>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map(
          ({
            label,
            value,
            icon: Icon,
            color,
            iconBg,
            valueClass,
            accent,
            description,
            suffix,
            footer,
          }) => (
            <div
              key={label}
              className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/70 motion-safe:hover:-translate-y-0.5"
            >
              <div
                aria-hidden
                className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b opacity-70 ${accent}`}
              />
              <dt className="relative flex items-start justify-between">
                <span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                    {label}
                  </span>
                  <span className="mt-1 block text-[10px] text-zinc-600">
                    {description}
                  </span>
                </span>
                <span
                  className={`ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${iconBg}`}
                >
                  <Icon className={`h-4 w-4 ${color}`} aria-hidden />
                </span>
              </dt>
              <dd className="relative mt-5 flex items-end gap-2">
                <span
                  className={`text-3xl font-semibold tracking-tight tabular-nums ${valueClass}`}
                >
                  {showCounts ? value : "—"}
                </span>
                <span className="mb-1 font-mono text-[11px] uppercase tracking-wide text-zinc-500">
                  {suffix}
                </span>
              </dd>
              <dd className="relative mt-5 flex items-center justify-between border-t border-zinc-800/80 pt-3">
                <span
                  className={`font-mono text-[9px] uppercase tracking-wider ${color}`}
                >
                  {showCounts
                    ? footer
                    : refreshing
                      ? "Loading attendance"
                      : "Attendance unavailable"}
                </span>
                <TrendingUp
                  className="h-3 w-3 text-zinc-700 transition-colors group-hover:text-zinc-500"
                  aria-hidden
                />
              </dd>
            </div>
          ),
        )}
      </dl>
    </header>
  );
}
