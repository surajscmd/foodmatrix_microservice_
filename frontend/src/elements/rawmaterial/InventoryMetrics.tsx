"use client";

import {
  Boxes,
  CheckCircle2,
  CircleOff,
  TrendingUp,
} from "lucide-react";

import type { WarehouseStockView } from "@/utils/types/inventory";

interface InventoryMetricsProps {
  items: WarehouseStockView[];
  loading: boolean;
  error: boolean;
}

export default function InventoryMetrics({
  items,
  loading,
  error,
}: InventoryMetricsProps) {
  const available = items.filter(
    (item) => Number(item.quantityOnHand) > 0,
  ).length;

  const empty = items.filter(
    (item) => Number(item.quantityOnHand) === 0,
  ).length;

  const cards = [
    {
      label: "Warehouse Inventory",
      value: items.length,
      suffix: "records",
      description: "registered warehouse stock records",
      icon: Boxes,
      iconClass: "text-sky-400",
      iconBg: "border-sky-500/10 bg-sky-500/10",
      valueClass: "text-white",
      accent: "from-sky-500/40 via-sky-500/10 to-transparent",
      footer: "Warehouse stock register",
      footerClass: "text-sky-400",
    },
    {
      label: "Available Stock",
      value: available,
      suffix: "available",
      description: "ingredients with positive stock balances",
      icon: CheckCircle2,
      iconClass: "text-emerald-400",
      iconBg: "border-emerald-500/10 bg-emerald-500/10",
      valueClass: "text-emerald-400",
      accent:
        "from-emerald-500/40 via-emerald-500/10 to-transparent",
      footer: "Warehouse availability",
      footerClass: "text-emerald-400",
    },
    {
      label: "Stock Exceptions",
      value: empty,
      suffix: "empty",
      description: "ingredients with zero stock balances",
      icon: CircleOff,
      iconClass: "text-rose-400",
      iconBg: "border-rose-500/10 bg-rose-500/10",
      valueClass: empty > 0 ? "text-rose-400" : "text-white",
      accent:
        "from-rose-500/40 via-rose-500/10 to-transparent",
      footer:
        empty > 0
          ? "Replenishment required"
          : "No empty warehouse balances",
      footerClass:
        empty > 0 ? "text-rose-400" : "text-zinc-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-zinc-900/70"
          >
            <div
              className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${card.accent} opacity-70`}
            />

            <div className="relative flex items-start justify-between">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                  {card.label}
                </span>

                <p className="mt-1 text-[10px] text-zinc-600">
                  {card.description}
                </p>
              </div>

              <div
                className={`ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${card.iconBg}`}
              >
                <Icon className={`h-4 w-4 ${card.iconClass}`} />
              </div>
            </div>

            <div className="relative mt-5 flex items-end gap-2">
              <span
                className={`text-3xl font-semibold tracking-tight ${card.valueClass}`}
              >
                {loading || error ? "—" : card.value}
              </span>

              <span className="mb-1 font-mono text-[11px] uppercase tracking-wide text-zinc-500">
                {card.suffix}
              </span>
            </div>

            <div className="relative mt-5 flex items-center justify-between border-t border-zinc-800/80 pt-3">
              <span
                className={`font-mono text-[9px] uppercase tracking-wider ${card.footerClass}`}
              >
                {loading
                  ? "Loading stock"
                  : error
                    ? "Stock unavailable"
                    : items.length === 0
                      ? "No warehouse records"
                      : card.footer}
              </span>

              <TrendingUp className="h-3 w-3 text-zinc-700 transition-colors group-hover:text-zinc-500" />
            </div>
          </div>
        );
      })}
    </div>
  );
}