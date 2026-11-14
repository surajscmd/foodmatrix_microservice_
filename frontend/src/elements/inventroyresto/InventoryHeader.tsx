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
  restaurantName: string;
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
  restaurantName,
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
    <div className="overflow-hidden rounded-2xl border border-zinc-700/75 bg-zinc-950 shadow-lg shadow-black/25">
      <header className="flex flex-wrap items-center justify-between gap-3 bg-linear-to-r from-[#213d34] via-[#212f29] to-[#232429] px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-emerald-300/40 bg-emerald-300/15 text-emerald-200">
            <Boxes aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold tracking-tight text-white">
              Restaurant inventory
            </h1>
            <p className="mt-0.5 break-words text-xs text-zinc-200">
              {restaurantName}
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
        className="flex gap-1 overflow-x-auto border-t border-white/10 bg-[#18191d] p-2 sm:px-4"
      >
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={section === id}
            disabled={busy || tabsDisabled}
            onClick={() => onSection(id)}
            className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-300 ${section === id ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-100" : "border-transparent text-zinc-300 enabled:hover:bg-white/8 enabled:hover:text-white disabled:opacity-50"}`}
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
