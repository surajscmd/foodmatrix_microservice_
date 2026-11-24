"use client";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  type LucideIcon,
} from "lucide-react";

const tones = {
  emerald: {
    icon: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    glow: "from-emerald-500/10",
    line: "via-emerald-400/60",
  },
  sky: {
    icon: "border-sky-500/20 bg-sky-500/10 text-sky-300",
    glow: "from-sky-500/10",
    line: "via-sky-400/60",
  },
  violet: {
    icon: "border-violet-500/20 bg-violet-500/10 text-violet-300",
    glow: "from-violet-500/10",
    line: "via-violet-400/60",
  },
  amber: {
    icon: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    glow: "from-amber-500/10",
    line: "via-amber-400/60",
  },
  rose: {
    icon: "border-rose-500/20 bg-rose-500/10 text-rose-300",
    glow: "from-rose-500/10",
    line: "via-rose-400/60",
  },
};

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  description: string;
  icon?: LucideIcon;
  tone?: keyof typeof tones;
}

export default function MetricCard({
  title,
  value,
  change,
  description,
  icon: Icon = Activity,
  tone = "emerald",
}: MetricCardProps) {
  const style = tones[tone];
  const ChangeIcon =
    change === undefined || change === 0
      ? Minus
      : change > 0
        ? ArrowUpRight
        : ArrowDownRight;

  return (
    <div className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-[border-color,box-shadow,transform] duration-300 hover:border-zinc-700 hover:shadow-[0_8px_28px_rgba(0,0,0,0.2)] motion-safe:hover:-translate-y-0.5">
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${style.line} to-transparent opacity-70`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-gradient-to-bl ${style.glow} via-transparent to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100`}
      />

      <div className="relative flex items-center gap-3">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-xl border ${style.icon}`}
        >
          <Icon size={17} strokeWidth={1.7} aria-hidden />
        </span>
        <h3 className="min-w-0 font-mono text-[10px] font-semibold uppercase leading-5 tracking-[0.12em] text-zinc-400">
          {title}
        </h3>
      </div>

      <p
        className={`relative my-5 break-words font-semibold tracking-tight tabular-nums ${typeof value === "number" || /\d/.test(value) ? "text-[30px] leading-10 text-zinc-50" : "text-lg leading-10 text-zinc-400"}`}
      >
        {value}
      </p>

      <div className="relative mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/80 pt-3">
        <p className="min-w-0 flex-1 text-[11px] leading-5 text-zinc-500">
          {description}
        </p>
        {change !== undefined && (
          <span
            className={`inline-flex shrink-0 items-center gap-0.5 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-medium ${change > 0 ? "border-emerald-500/15 bg-emerald-500/10 text-emerald-300" : change < 0 ? "border-rose-500/15 bg-rose-500/10 text-rose-300" : "border-zinc-700 bg-zinc-800/60 text-zinc-400"}`}
          >
            <ChangeIcon size={12} aria-hidden />
            {change > 0 ? "+" : ""}
            {change}%
          </span>
        )}
      </div>
    </div>
  );
}
