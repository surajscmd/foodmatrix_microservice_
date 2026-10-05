"use client";

import {
  Activity,
  Clock3,
  TrendingUp,
  UserRound,
  UserRoundX,
} from "lucide-react";

interface WorkforceMetricsProps {
  total: number;
  active: number;
  onLeave: number;
  suspended: number;
}

export default function WorkforceMetrics({
  total,
  active,
  onLeave,
  suspended,
}: WorkforceMetricsProps) {
  const inactiveCount = Math.max(total - active, 0);

  const activePercentage =
    total > 0 ? Math.round((active / total) * 100) : 0;

  const cards = [
    {
      label: "Workforce Total",
      value: `${total}`,
      suffix: "staff",
      description:
        total === 1
          ? "registered workforce"
          : "registered workforce",
      icon: UserRound,
      iconClass: "text-sky-400",
      iconBg: "bg-sky-500/10 border-sky-500/10",
      valueClass: "text-white",
      accent: "from-sky-500/40 via-sky-500/10 to-transparent",
      footer:
        inactiveCount === 0
          ? "All workforce active"
          : `${inactiveCount} inactive`,
      footerClass:
        inactiveCount === 0
          ? "text-emerald-400"
          : "text-zinc-500",
    },

    {
      label: "Operational Heartbeat",
      value: `${active}`,
      suffix: "live",
      description:
        active === total
          ? "all staff operational"
          : `${activePercentage}% of workforce active`,
      icon: Activity,
      iconClass: "text-emerald-400",
      iconBg: "bg-emerald-500/10 border-emerald-500/10",
      valueClass: "text-emerald-400",
      accent:
        "from-emerald-500/40 via-emerald-500/10 to-transparent",
      footer:
        active === total
          ? "Workforce stable"
          : "Attention required",
      footerClass:
        active === total
          ? "text-emerald-400"
          : "text-amber-400",
    },

    {
      label: "Leave Status",
      value: `${onLeave}`,
      suffix: "away",
      description:
        onLeave === 0
          ? "no active leave records"
          : "staff currently on leave",
      icon: Clock3,
      iconClass: "text-amber-400",
      iconBg: "bg-amber-500/10 border-amber-500/10",
      valueClass: "text-amber-400",
      accent:
        "from-amber-500/40 via-amber-500/10 to-transparent",
      footer:
        onLeave === 0
          ? "No leave impact"
          : "Leave impact",
      footerClass: "text-zinc-500",
    },

    {
      label: "Workforce Alerts",
      value: `${suspended}`,
      suffix: "flagged",
      description:
        suspended === 0
          ? "no workforce exceptions"
          : "requires operational attention",
      icon: UserRoundX,
      iconClass: "text-violet-400",
      iconBg:
        "bg-violet-500/10 border-violet-500/10",
      valueClass:
        suspended > 0
          ? "text-violet-400"
          : "text-white",
      accent:
        "from-violet-500/40 via-violet-500/10 to-transparent",
      footer:
        suspended === 0
          ? "No active alerts"
          : "Review required",
      footerClass:
        suspended === 0
          ? "text-zinc-500"
          : "text-amber-400",
    },
  ];

  return (
    <div className="space-y-4">
           {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
  );
}