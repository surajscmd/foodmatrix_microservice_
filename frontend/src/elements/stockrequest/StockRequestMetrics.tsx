"use client";

import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  TrendingUp,
} from "lucide-react";

import type {
  OperationsStockRequest,
} from "@/utils/types/inventory";

interface StockRequestMetricsProps {
  requests: OperationsStockRequest[];
  loading: boolean;
  failed: boolean;
}

export default function StockRequestMetrics({
  requests,
  loading,
  failed,
}: StockRequestMetricsProps) {
  const pending = requests.filter(
    (request) => request.status === "REQUESTED",
  ).length;

  const approved = requests.filter(
    (request) =>
      request.status === "APPROVED" ||
      request.status === "FULFILLED",
  ).length;

  const cards = [
    {
      label: "Request Register",
      value: requests.length,
      description: "registered warehouse stock requests",
      footer: "Restaurant replenishment",
      icon: ClipboardList,
      color: "text-sky-400",
      iconBg: "border-sky-500/10 bg-sky-500/10",
      accent: "from-sky-500/40 via-sky-500/10 to-transparent",
    },
    {
      label: "Awaiting Review",
      value: pending,
      description: "requests awaiting a warehouse decision",
      footer: pending > 0 ? "Review required" : "No pending requests",
      icon: Clock3,
      color: "text-amber-400",
      iconBg: "border-amber-500/10 bg-amber-500/10",
      accent: "from-amber-500/40 via-amber-500/10 to-transparent",
    },
    {
      label: "Approved Requests",
      value: approved,
      description: "approved and fulfilled requests",
      footer: "Warehouse fulfillment",
      icon: CheckCircle2,
      color: "text-emerald-400",
      iconBg: "border-emerald-500/10 bg-emerald-500/10",
      accent:
        "from-emerald-500/40 via-emerald-500/10 to-transparent",
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
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                  {card.label}
                </p>

                <p className="mt-1 text-[10px] text-zinc-600">
                  {card.description}
                </p>
              </div>

              <div
                className={`ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${card.iconBg}`}
              >
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>

            <div className="relative mt-5 flex items-end gap-2">
              <span
                className={`text-3xl font-semibold tracking-tight ${card.color}`}
              >
                {loading || failed ? "—" : card.value}
              </span>

              <span className="mb-1 font-mono text-[11px] uppercase tracking-wide text-zinc-500">
                requests
              </span>
            </div>

            <div className="relative mt-5 flex items-center justify-between border-t border-zinc-800/80 pt-3">
              <span
                className={`font-mono text-[9px] uppercase tracking-wider ${card.color}`}
              >
                {failed
                  ? "Unable to load requests"
                  : loading
                    ? "Loading requests..."
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