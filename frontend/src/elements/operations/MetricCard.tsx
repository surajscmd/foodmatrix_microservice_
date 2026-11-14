"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  Activity,
} from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  description: string;
}

export default function MetricCard({
  title,
  value,
  change,
  description,
}: MetricCardProps) {
  const positive = change !== undefined && change > 0;
  const negative = change !== undefined && change < 0;

  const accentClass = positive
    ? "text-emerald-400"
    : negative
      ? "text-red-400"
      : "text-zinc-400";

  const iconBg = positive
    ? "bg-emerald-500/10 border-emerald-500/20"
    : negative
      ? "bg-red-500/10 border-red-500/20"
      : "bg-zinc-800/70 border-zinc-700";

  const ChangeIcon = positive
    ? ArrowUpRight
    : negative
      ? ArrowDownRight
      : Minus;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-zinc-900/80">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-500/5 blur-3xl transition-all duration-500 group-hover:bg-emerald-500/10" />

      {/* Top signal */}
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />

          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-zinc-500">
            {title}
          </p>
        </div>

        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg border ${iconBg}`}
        >
          <ChangeIcon className={`h-4 w-4 ${accentClass}`} />
        </div>
      </div>

      {/* Main value */}
      <div className="relative mt-5">
        <h3 className="text-3xl font-semibold tracking-tight text-white">
          {value}
        </h3>

        <p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-zinc-600">
          {description}
        </p>
      </div>

      {/* Signal bar */}
      <div className="relative mt-5">
        <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              positive
                ? "w-[72%] bg-emerald-400"
                : negative
                  ? "w-[34%] bg-red-400"
                  : change === undefined ? "w-0" : "w-1/2 bg-zinc-500"
            }`}
          />
        </div>
      </div>

      {/* Bottom meta */}
      <div className="relative mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-3 w-3 text-zinc-600" />

          <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-600">
            {change === undefined ? "Current value" : "Network signal"}
          </span>
        </div>

        <span className={`text-xs font-semibold ${accentClass}`}>
          {change === undefined ? "" : `${positive ? "+" : ""}${change}%`}
        </span>
      </div>
    </div>
  );
}
