import {
  Boxes,
  ClipboardList,
  History,
  Plus,
  RefreshCw,
  Truck,
} from "lucide-react";
import { button, primary } from "./inventory-view";

const sections = [
  { id: "stock", label: "Stock on hand", icon: Boxes },
  { id: "requests", label: "Requests", icon: ClipboardList },
  { id: "deliveries", label: "Deliveries", icon: Truck },
  { id: "movements", label: "Stock movements", icon: History },
] as const;

export type Section = (typeof sections)[number]["id"];

interface Props {
  section: Section;
  refreshing: boolean;
  busy: boolean;
  showRequest: boolean;
  requestDisabled: boolean;
  tabsDisabled: boolean;
  onSection: (section: Section) => void;
  onRefresh: () => void;
  onRequest: () => void;
}

export default function InventoryHeader({
  section,
  refreshing,
  busy,
  showRequest,
  requestDisabled,
  tabsDisabled,
  onSection,
  onRefresh,
  onRequest,
}: Props) {
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="h-4 w-1 rounded-full bg-emerald-400" />
          <div className="min-w-0">
            <h1 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
              Restaurant inventory
            </h1>
            <p className="mt-0.5 text-[10px] text-zinc-500">
              Stock balances, warehouse requests and delivery tracking
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={button}
            title="Refresh inventory"
            aria-label="Refresh inventory"
            disabled={busy || refreshing}
            onClick={onRefresh}
          >
            <RefreshCw
              aria-hidden="true"
              className={`size-4 ${refreshing ? "motion-safe:animate-spin" : ""}`}
            />
          </button>
          {showRequest && (
            <button
              type="button"
              className={primary}
              disabled={busy || requestDisabled}
              onClick={onRequest}
            >
              <Plus aria-hidden="true" className="size-4" /> New request
            </button>
          )}
        </div>
      </header>
      <nav
        aria-label="Inventory views"
        className="flex gap-2 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/80 p-2"
      >
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={section === id}
            disabled={busy || tabsDisabled}
            onClick={() => onSection(id)}
            className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-300 disabled:opacity-50 ${section === id ? "border-emerald-400 bg-emerald-400 text-zinc-950" : "border-transparent text-zinc-400 enabled:hover:border-zinc-700 enabled:hover:bg-zinc-900 enabled:hover:text-white"}`}
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
