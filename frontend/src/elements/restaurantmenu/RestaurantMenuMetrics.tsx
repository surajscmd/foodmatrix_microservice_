import { CheckCircle2, CircleOff, Layers3, TrendingUp } from "lucide-react";
import type { RestaurantMenuAvailabilityCounts } from "@/lib/catalog-api";

const cards = [
  {
    id: "all",
    label: "All items",
    description: "restaurant menu items in the current selection",
    icon: Layers3,
    accent: "from-sky-500/40 via-sky-500/10 to-transparent",
    color: "text-sky-400",
    iconBg: "border-sky-500/10 bg-sky-500/10",
    valueClass: "text-white",
  },
  {
    id: "available",
    label: "Available",
    description: "menu items currently available to order",
    icon: CheckCircle2,
    accent: "from-emerald-500/40 via-emerald-500/10 to-transparent",
    color: "text-emerald-400",
    iconBg: "border-emerald-500/10 bg-emerald-500/10",
    valueClass: "text-emerald-400",
  },
  {
    id: "unavailable",
    label: "Unavailable",
    description: "menu items currently unavailable to order",
    icon: CircleOff,
    accent: "from-rose-500/40 via-rose-500/10 to-transparent",
    color: "text-rose-400",
    iconBg: "border-rose-500/10 bg-rose-500/10",
    valueClass: "text-rose-400",
  },
] as const;

export default function RestaurantMenuMetrics({
  counts,
}: {
  counts?: RestaurantMenuAvailabilityCounts;
}) {
  const values = counts && {
    all: counts.available + counts.unavailable,
    ...counts,
  };

  return (
    <div
      role="group"
      aria-label="Menu availability summary"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
    >
      {cards.map(
        ({
          id,
          label,
          description,
          icon: Icon,
          accent,
          color,
          iconBg,
          valueClass,
        }) => {
          const count = values?.[id];

          return (
            <div
              key={id}
              className="group relative min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-left"
            >
              <span
                aria-hidden
                className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${accent} opacity-70`}
              />
              <span className="relative flex items-start justify-between">
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
              </span>
              <span className="relative mt-5 flex items-end gap-2">
                <span
                  className={`text-3xl font-semibold tracking-tight tabular-nums ${valueClass}`}
                >
                  {count ?? "—"}
                </span>
                <span className="mb-1 font-mono text-[11px] uppercase tracking-wide text-zinc-500">
                  items
                </span>
              </span>
              <span className="relative mt-5 flex items-center justify-between border-t border-zinc-800/80 pt-3">
                <span
                  className={`font-mono text-[9px] uppercase tracking-wider ${color}`}
                >
                  Menu availability
                </span>
                <TrendingUp
                  className="h-3 w-3 text-zinc-700 transition-colors group-hover:text-zinc-500"
                  aria-hidden
                />
              </span>
            </div>
          );
        },
      )}
    </div>
  );
}
