import { ClipboardList, Layers3, Search, X } from "lucide-react";
import type {
  MenuCategory,
  RestaurantMenuAvailabilityCounts,
  RestaurantMenuFilters as Filters,
} from "@/lib/catalog-api";

export default function RestaurantMenuFilters({
  categories,
  categoryId,
  availability,
  availabilityCounts,
  search,
  onSearch,
  onChange,
  visibleRows,
  total,
  loading,
}: {
  categories: MenuCategory[];
  categoryId?: string;
  availability: Filters["availability"];
  availabilityCounts?: RestaurantMenuAvailabilityCounts;
  search: string;
  onSearch: (search: string) => void;
  onChange: (filters: Filters) => void;
  visibleRows: number;
  total?: number;
  loading: boolean;
}) {
  const categoryOptions = [{ id: "", name: "All categories" }, ...categories];

  return (
    <div className="border-b border-zinc-800">
      <div className="flex min-w-0 items-center gap-3 border-b border-emerald-400/15 bg-linear-to-r from-emerald-500/15 via-emerald-500/5 to-zinc-950 px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-400">
          <ClipboardList size={17} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
            Menu Items
          </h2>
          <p className="mt-1 text-[10px] text-zinc-500">
            {loading
              ? "Loading menu items…"
              : total === undefined
                ? "Menu item pricing and availability"
                : `Showing ${visibleRows} of ${total} menu items`}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-5">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute top-3 left-3 size-4 text-emerald-300/75"
            aria-hidden="true"
          />
          <input
            aria-label="Search by item, category or SKU"
            type="search"
            placeholder="Search menu items…"
            maxLength={120}
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 pr-9 pl-9 text-xs text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-emerald-400/60 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear menu search"
              onClick={() => onSearch("")}
              className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-300"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <select
          aria-label="Filter menu availability"
          value={availability ?? "all"}
          onChange={(event) => {
            const value = event.target.value;
            onChange({
              availability:
                value === "available" || value === "unavailable"
                  ? value
                  : undefined,
            });
          }}
          className="min-h-9 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-[11px] text-zinc-400 outline-none transition-colors focus:border-emerald-500/50"
        >
          <option value="all">
            All items (
            {availabilityCounts
              ? availabilityCounts.available + availabilityCounts.unavailable
              : "—"}
            )
          </option>
          <option value="available">
            Available ({availabilityCounts?.available ?? "—"})
          </option>
          <option value="unavailable">
            Unavailable ({availabilityCounts?.unavailable ?? "—"})
          </option>
        </select>
      </div>
      {categories.length > 0 && (
        <div className="flex items-start gap-2.5 border-t border-white/5 px-4 py-2.5">
          <Layers3
            aria-hidden="true"
            className="mt-2 size-4 shrink-0 text-emerald-400"
          />
          <div
            role="group"
            aria-label="Filter menu category"
            className="flex min-w-0 flex-wrap gap-1.5"
          >
            {categoryOptions.map(({ id, name }) => {
              const active = id === (categoryId ?? "");
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange({ categoryId: id || undefined })}
                  className={`max-w-full break-words rounded-lg border px-2.5 py-1.5 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-emerald-300 ${active ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-zinc-700 bg-zinc-900/75 text-zinc-300 hover:border-zinc-600 hover:text-white"}`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
