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
  restaurantName,
  tab,
  onTabChange,
  savingSchedule,
  refreshing,
  onRefresh,
  canManageTemplates,
}: {
  restaurantName: string;
  tab: AttendanceTab;
  onTabChange: (tab: AttendanceTab) => void;
  savingSchedule: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  canManageTemplates: boolean;
}) {
  return (
    <header className="overflow-hidden rounded-2xl border border-zinc-700/75 bg-zinc-950 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between gap-3 border-b border-emerald-400/20 bg-linear-to-r from-teal-800 to-slate-800 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-300 text-emerald-950">
            <CalendarClock size={19} aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold tracking-tight text-white">
              Attendance Reports
            </h1>
            <p className="mt-0.5 break-words text-xs text-teal-100">
              {restaurantName}
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
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/20 bg-white/5 text-white enabled:hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-50"
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
        className="flex flex-wrap gap-1 bg-[#18191d] p-2"
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
              className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium focus-visible:outline-2 focus-visible:outline-emerald-300 ${tab === id ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-100" : "border-transparent text-zinc-300 hover:bg-white/8"}`}
            >
              <Icon size={15} aria-hidden />
              {label}
            </button>
          ))}
      </nav>
    </header>
  );
}
