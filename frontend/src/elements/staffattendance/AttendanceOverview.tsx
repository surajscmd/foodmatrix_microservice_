import {
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Plus,
  RefreshCw,
} from "lucide-react";

const tabs = [
  { id: "roster", label: "Daily roster", icon: ClipboardList },
  { id: "monthly-tracker", label: "Monthly tracker", icon: CalendarDays },
  { id: "add-shift", label: "Add shift", icon: Plus },
  { id: "templates", label: "Shift templates", icon: CalendarClock },
] as const;

export type AttendanceTab = (typeof tabs)[number]["id"];

export default function AttendanceOverview({
  tab,
  onTabChange,
  savingSchedule,
  refreshing,
  onRefresh,
  canManageTemplates,
}: {
  tab: AttendanceTab;
  onTabChange: (tab: AttendanceTab) => void;
  savingSchedule: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  canManageTemplates: boolean;
}) {
  return (
    <header className="space-y-5">
      <div className="flex items-center justify-between gap-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="h-4 w-1 rounded-full bg-emerald-400" />
          <div className="min-w-0">
            <h1 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
              Attendance Reports
            </h1>
            <p className="mt-0.5 text-[10px] text-zinc-500">
              Daily rosters, attendance history and shift planning
            </p>
          </div>
        </div>
        {tab !== "add-shift" && tab !== "templates" && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh attendance report"
            title="Refresh attendance report"
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-zinc-800 bg-zinc-900/70 text-zinc-400 enabled:hover:border-emerald-400/30 enabled:hover:text-emerald-400 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={refreshing ? "motion-safe:animate-spin" : ""}
              aria-hidden
            />
          </button>
        )}
      </div>
      <nav
        aria-label="Attendance views"
        className="flex flex-wrap gap-2 rounded-xl border border-zinc-800 bg-zinc-950/80 p-2"
      >
        {tabs
          .filter(({ id }) => id !== "templates" || canManageTemplates)
          .map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              aria-pressed={tab === id}
              disabled={savingSchedule && tab !== id}
              className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-50 ${tab === id ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-transparent text-zinc-500 hover:border-zinc-800 hover:bg-zinc-900 hover:text-zinc-200"}`}
            >
              <Icon size={15} aria-hidden />
              {label}
            </button>
          ))}
      </nav>
    </header>
  );
}
