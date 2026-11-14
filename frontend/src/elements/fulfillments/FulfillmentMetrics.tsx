"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Package,
  TrendingUp,
  Truck,
} from "lucide-react";

import type { OperationsStockTransfer } from "@/utils/types/inventory";

interface Props {
  transfers: OperationsStockTransfer[];
  loading: boolean;
  failed: boolean;
}

export default function FulfillmentMetrics({
  transfers,
  loading,
  failed,
}: Props) {
  const preparing = transfers.filter((item) =>
    ["APPROVED", "PICKING", "READY_TO_SHIP"].includes(item.status),
  ).length;

  const travelling = transfers.filter((item) =>
    ["SHIPPED", "IN_TRANSIT"].includes(item.status),
  ).length;

  const completed = transfers.filter(
    (item) => item.status === "COMPLETED",
  ).length;

  const disputed = transfers.filter(
    (item) => item.status === "DISPUTED",
  ).length;

  const cards = [
    {
      label: "Preparing Dispatch",
      description: "approved, picking and ready to ship",
      value: preparing,
      footer: "Warehouse preparation",
      icon: Package,
      color: "text-sky-400",
      background: "border-sky-500/10 bg-sky-500/10",
      accent: "from-sky-500/40 via-sky-500/10 to-transparent",
    },
    {
      label: "On The Move",
      description: "shipped and in transit",
      value: travelling,
      footer: "Restaurant deliveries",
      icon: Truck,
      color: "text-amber-400",
      background: "border-amber-500/10 bg-amber-500/10",
      accent: "from-amber-500/40 via-amber-500/10 to-transparent",
    },
    {
      label: "Completed",
      description: "completed stock transfers",
      value: completed,
      footer: "Delivery confirmed",
      icon: CheckCircle2,
      color: "text-emerald-400",
      background: "border-emerald-500/10 bg-emerald-500/10",
      accent: "from-emerald-500/40 via-emerald-500/10 to-transparent",
    },
    {
      label: "Delivery Exceptions",
      description: "disputed transfers awaiting resolution",
      value: disputed,
      footer: disputed ? "Review required" : "No disputes",
      icon: AlertTriangle,
      color: "text-rose-400",
      background: "border-rose-500/10 bg-rose-500/10",
      accent: "from-rose-500/40 via-rose-500/10 to-transparent",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                  {card.label}
                </p>
                <p className="mt-1 text-[10px] text-zinc-600">
                  {card.description}
                </p>
              </div>

              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${card.background}`}
              >
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>

            <div className="relative mt-5 flex items-end gap-2">
              <span className={`text-3xl font-semibold ${card.color}`}>
                {loading || failed ? "—" : card.value}
              </span>
              <span className="mb-1 font-mono text-[10px] uppercase text-zinc-500">
                transfers
              </span>
            </div>

            <div className="relative mt-5 flex items-center justify-between border-t border-zinc-800/80 pt-3">
              <span
                className={`font-mono text-[9px] uppercase tracking-wider ${card.color}`}
              >
                {failed ? "Unable to load" : loading ? "Loading..." : card.footer}
              </span>
              <TrendingUp className="h-3 w-3 text-zinc-700" />
            </div>
          </div>
        );
      })}
    </div>
  );
}