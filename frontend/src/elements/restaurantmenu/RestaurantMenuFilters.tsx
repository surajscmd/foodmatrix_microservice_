import { Layers3, Search, X } from "lucide-react";
import type {
  MenuCategory,
  RestaurantMenuAvailabilityCounts,
  RestaurantMenuFilters as Filters,
} from "@/lib/catalog-api";

const availabilityOptions = [
  { id: "all", label: "All items", badge: "border-zinc-500/50 bg-zinc-700 text-white" },
  { id: "available", label: "Available", badge: "border-emerald-400/35 bg-emerald-400/20 text-emerald-100" },
  { id: "unavailable", label: "Unavailable", badge: "border-amber-400/35 bg-amber-400/20 text-amber-100" },
] as const;

export default function RestaurantMenuFilters({
  categories,
  categoryId,
  availability,
  availabilityCounts,
  search,
  onSearch,
  onChange,
}: {
  categories: MenuCategory[];
  categoryId?: string;
  availability: Filters["availability"];
  availabilityCounts?: RestaurantMenuAvailabilityCounts;
  search: string;
  onSearch: (search: string) => void;
  onChange: (filters: Filters) => void;
}) {
  const categoryOptions = [
    { id: "", name: "All categories" },
    ...categories,
  ];
  const counts = availabilityCounts && {
    all: availabilityCounts.available + availabilityCounts.unavailable,
    ...availabilityCounts,
  };

  return (
    <div className="border-b border-zinc-800 bg-[#181a1f]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-3 left-3 size-4 text-emerald-300/75" aria-hidden="true" />
          <input
            aria-label="Search by item, category or SKU"
            type="search"
            placeholder="Search menu items…"
            maxLength={120}
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            className="h-10 w-full rounded-xl border border-zinc-700 bg-[#101217] pr-9 pl-9 text-sm text-zinc-100 outline-none placeholder:text-zinc-400 focus:border-emerald-400/60 [&::-webkit-search-cancel-button]:appearance-none"
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
        <div role="group" aria-label="Filter menu availability" className="flex flex-wrap gap-1 rounded-xl border border-white/8 bg-zinc-950/50 p-1">
          {availabilityOptions.map(({ id, label, badge }) => {
            const value = id === "all" ? undefined : id;
            const count = counts?.[id];
            return (
              <button
                key={id}
                type="button"
                aria-pressed={availability === value}
                onClick={() => onChange({ availability: value })}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-emerald-300 ${availability === value ? "bg-emerald-400/15 text-emerald-100" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"}`}
              >
                {label}
                <span
                  aria-hidden={count === undefined}
                  className={`min-w-6 rounded-md border px-1.5 py-0.5 text-center text-xs leading-none font-semibold tabular-nums ${badge}`}
                >
                  {count ?? "—"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {categories.length > 0 && (
        <div className="flex items-start gap-2.5 border-t border-white/5 px-4 py-2.5">
          <Layers3 aria-hidden="true" className="mt-2 size-4 shrink-0 text-emerald-300/70" />
          <div role="group" aria-label="Filter menu category" className="flex min-w-0 flex-wrap gap-1.5">
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
