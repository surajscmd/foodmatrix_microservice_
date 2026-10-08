"use client";

import { useEffect, useState } from "react";
import {
  ClipboardList,
  CheckCircle2,
  CircleOff,
  TrendingUp,
} from "lucide-react";

import { getMenuItems } from "@/lib/catalog-api";

interface MenuMetricsProps {
  refreshKey: number;
}

interface MenuMetricsData {
  total: number;
  active: number;
  inactive: number;
}

const INITIAL_METRICS: MenuMetricsData = {
  total: 0,
  active: 0,
  inactive: 0,
};

export default function MenuMetrics({
  refreshKey,
}: MenuMetricsProps) {
  const [metrics, setMetrics] =
    useState<MenuMetricsData>(INITIAL_METRICS);

  useEffect(() => {
    let cancelled = false;

    const fetchMetrics = async () => {
      try {
        const response = await getMenuItems(1, 1000);

        if (cancelled) return;

        const items = response.data ?? [];

        const active = items.filter(
          (item) => item.isAvailable,
        ).length;

        const inactive = items.length - active;

        setMetrics({
          total:
            response.pagination?.total ?? items.length,
          active,
          inactive,
        });
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Failed to load menu metrics:",
          error,
        );

        setMetrics(INITIAL_METRICS);
      }
    };

    void fetchMetrics();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const { total, active, inactive } = metrics;

  const activePercentage =
    total > 0
      ? Math.round((active / total) * 100)
      : 0;

  const cards = [
    {
      label: "Menu Catalog",
      value: total,
      suffix: "items",
      description: "registered menu items",
      icon: ClipboardList,
      iconClass: "text-sky-400",
      iconBg: "bg-sky-500/10 border-sky-500/10",
      valueClass: "text-white",
      accent:
        "from-sky-500/40 via-sky-500/10 to-transparent",
      footer:
        total === 0
          ? "No menu data"
          : `${total} menu items registered`,
      footerClass:
        total === 0
          ? "text-zinc-500"
          : "text-sky-400",
    },

    {
      label: "Operational Menu",
      value: active,
      suffix: "live",
      description:
        total === 0
          ? "no menu records"
          : `${activePercentage}% of menu active`,
      icon: CheckCircle2,
      iconClass: "text-emerald-400",
      iconBg:
        "bg-emerald-500/10 border-emerald-500/10",
      valueClass: "text-emerald-400",
      accent:
        "from-emerald-500/40 via-emerald-500/10 to-transparent",
      footer:
        total === 0
          ? "No menu data"
          : active === total
            ? "Menu fully operational"
            : "Attention required",
      footerClass:
        total === 0
          ? "text-zinc-500"
          : active === total
            ? "text-emerald-400"
            : "text-amber-400",
    },

    {
      label: "Menu Exceptions",
      value: inactive,
      suffix: "inactive",
      description:
        inactive === 0
          ? "all menu items available"
          : "items currently unavailable",
      icon: CircleOff,
      iconClass: "text-rose-400",
      iconBg:
        "bg-rose-500/10 border-rose-500/10",
      valueClass:
        inactive > 0
          ? "text-rose-400"
          : "text-white",
      accent:
        "from-rose-500/40 via-rose-500/10 to-transparent",
      footer:
        inactive === 0
          ? "No menu impact"
          : "Review required",
      footerClass:
        inactive === 0
          ? "text-zinc-500"
          : "text-rose-400",
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
            {/* Ambient gradient */}
            <div
              className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${card.accent} opacity-70`}
            />

            {/* Header */}
            <div className="relative flex items-start justify-between">
              <div className="min-w-0">
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-zinc-500">
                  {card.label}
                </span>

                <p className="mt-1 text-[10px] text-zinc-600">
                  {card.description}
                </p>
              </div>

              <div
                className={`ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${card.iconBg}`}
              >
                <Icon
                  className={`h-4 w-4 ${card.iconClass}`}
                />
              </div>
            </div>

            {/* Main value */}
            <div className="relative mt-5 flex items-end gap-2">
              <span
                className={`text-3xl font-semibold tracking-tight ${card.valueClass}`}
              >
                {card.value}
              </span>

              <span className="mb-1 text-[11px] font-mono uppercase tracking-wide text-zinc-500">
                {card.suffix}
              </span>
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
  );
}