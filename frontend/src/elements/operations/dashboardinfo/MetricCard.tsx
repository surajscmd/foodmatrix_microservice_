"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
} from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  description: string;
}

export default function MetricCard({
  title,
  value,
  change,
  description,
}: MetricCardProps) {
  const positive = change > 0;
  const negative = change < 0;

  return (
    <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 transition-all hover:border-emerald-500/30 hover:bg-zinc-900/70">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-zinc-500">
            {title}
          </p>

          <h3 className="mt-3 text-3xl font-bold tracking-tight text-white">
            {value}
          </h3>
        </div>

        <div
          className={`rounded-xl p-2 ${
            positive
              ? "bg-emerald-500/10 text-emerald-400"
              : negative
              ? "bg-red-500/10 text-red-400"
              : "bg-zinc-800 text-zinc-400"
          }`}
        >
          {positive ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : negative ? (
            <ArrowDownRight className="h-4 w-4" />
          ) : (
            <Minus className="h-4 w-4" />
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span
          className={`text-sm font-semibold ${
            positive
              ? "text-emerald-400"
              : negative
              ? "text-red-400"
              : "text-zinc-400"
          }`}
        >
          {positive && "+"}
          {change}%
        </span>

        <span className="text-xs text-zinc-500">
          {description}
        </span>
      </div>
    </div>
  );
}