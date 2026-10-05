"use client";

import {
  Activity,
  Building2,
  CircleDollarSign,
  Star,
  TrendingUp,
} from "lucide-react";

import type { Restaurant } from "@/utils/types/organization";

interface FranchiseKPIsProps {
  restaurants: Restaurant[];
  averageRating?: number | null;
  totalRevenue?: number | null;
}

export default function FranchiseKPIs({
  restaurants,
  averageRating = null,
  totalRevenue = null,
}: FranchiseKPIsProps) {
  const operationalCount = restaurants.filter(
    (restaurant) => restaurant.status === "ACTIVE",
  ).length;

  const inactiveCount = restaurants.length - operationalCount;

  const operationalPercentage =
    restaurants.length > 0
      ? Math.round((operationalCount / restaurants.length) * 100)
      : 0;

  const cards = [
    {
      label: "Deployments Total",
      value: `${restaurants.length}`,
      suffix: "nodes",
      description:
        restaurants.length === 1
          ? "restaurant deployed"
          : "restaurants deployed",
      icon: Building2,
      iconClass: "text-sky-400",
      iconBg: "bg-sky-500/10 border-sky-500/10",
      valueClass: "text-white",
      accent: "from-sky-500/40 via-sky-500/10 to-transparent",
      footer: `${inactiveCount} inactive`,
      footerClass: inactiveCount > 0 ? "text-zinc-500" : "text-emerald-400",
    },
    {
      label: "Operational Heartbeat",
      value: `${operationalCount}`,
      suffix: "live",
      description:
        operationalCount === restaurants.length
          ? "all nodes operational"
          : `${operationalPercentage}% of nodes operational`,
      icon: Activity,
      iconClass: "text-emerald-400",
      iconBg: "bg-emerald-500/10 border-emerald-500/10",
      valueClass: "text-emerald-400",
      accent: "from-emerald-500/40 via-emerald-500/10 to-transparent",
      footer:
        operationalCount === restaurants.length
          ? "System stable"
          : "Attention required",
      footerClass:
        operationalCount === restaurants.length
          ? "text-emerald-400"
          : "text-amber-400",
    },
    {
      label: "Avg Rating Index",
      value: averageRating === null ? "N/A" : averageRating.toFixed(1),
      suffix: averageRating === null ? "" : "/ 5.0",
      description:
        averageRating === null
          ? "customer analytics unavailable"
          : "franchise-wide rating signal",
      icon: Star,
      iconClass: "text-amber-400",
      iconBg: "bg-amber-500/10 border-amber-500/10",
      valueClass: "text-amber-400",
      accent: "from-amber-500/40 via-amber-500/10 to-transparent",
      footer:
        averageRating === null ? "Analytics pending" : "Live rating index",
      footerClass: "text-zinc-500",
    },
    {
      label: "Monthly Franchise Cap",
      value:
        totalRevenue === null
          ? "N/A"
          : `$${(totalRevenue / 1_000_000).toFixed(2)}M`,
      suffix: "",
      description:
        totalRevenue === null
          ? "revenue analytics unavailable"
          : "aggregated monthly revenue",
      icon: CircleDollarSign,
      iconClass: "text-violet-400",
      iconBg: "bg-violet-500/10 border-violet-500/10",
      valueClass: "text-white",
      accent: "from-violet-500/40 via-violet-500/10 to-transparent",
      footer:
        totalRevenue === null ? "Order analytics pending" : "Revenue signal",
      footerClass: "text-zinc-500",
    },
  ];

  return (
    <>
      <div className="space-y-4">
        {/* Section heading */}
        <div className="flex items-center gap-3">
          <div className="h-4 w-1 rounded-full bg-emerald-400" />

          <div>
            <p className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-zinc-400">
              Franchise Overview
            </p>

            <p className="text-[10px] text-zinc-600 mt-0.5">
              Current network health and performance
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-zinc-900/70"
              >
                {/* Ambient accent */}
                <div
                  className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${card.accent} opacity-70`}
                />

                {/* Header */}
                <div className="relative flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-zinc-500">
                      {card.label}
                    </span>

                    <p className="mt-1 text-[10px] text-zinc-600">
                      {card.description}
                    </p>
                  </div>

                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${card.iconBg}`}
                  >
                    <Icon className={`h-4 w-4 ${card.iconClass}`} />
                  </div>
                </div>

                {/* Main value */}
                <div className="relative mt-5 flex items-end gap-2">
                  <span
                    className={`text-3xl font-semibold tracking-tight ${card.valueClass}`}
                  >
                    {card.value}
                  </span>

                  {card.suffix && (
                    <span className="mb-1 text-[11px] font-mono uppercase tracking-wide text-zinc-500">
                      {card.suffix}
                    </span>
                  )}
                </div>

                {/* Footer */}
                <div className="relative mt-5 flex items-center justify-between border-t border-zinc-800/80 pt-3">
                  <span
                    className={`text-[9px] font-mono uppercase tracking-wider ${card.footerClass}`}
                  >
                    {card.footer}
                  </span>

                  <TrendingUp className="h-3 w-3 text-zinc-700 transition-colors group-hover:text-zinc-500" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
