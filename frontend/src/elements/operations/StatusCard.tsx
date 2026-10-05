"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Radio,
} from "lucide-react";

interface StatusCardProps {
  title: string;
  value: string;
  status: "healthy" | "warning" | "critical";
  updatedAt: string;
}

const statusStyles = {
  healthy: {
    icon: CheckCircle2,
    text: "Healthy",
    textColor: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  warning: {
    icon: Clock3,
    text: "Warning",
    textColor: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    dot: "bg-amber-400",
  },
  critical: {
    icon: AlertTriangle,
    text: "Critical",
    textColor: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    dot: "bg-red-400",
  },
};

export default function StatusCard({
  title,
  value,
  status,
  updatedAt,
}: StatusCardProps) {
  const config = statusStyles[status];
  const Icon = config.icon;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border ${config.border} bg-zinc-950/75 p-5 transition-all duration-300 hover:bg-zinc-900/80`}
    >
      {/* Status glow */}
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full ${config.bg} blur-3xl opacity-60`}
      />

      {/* Header */}
      <div className="relative flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${config.dot} shadow-[0_0_8px_currentColor]`}
            />

            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-zinc-500">
              {title}
            </p>
          </div>

          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">
            {value}
          </h3>
        </div>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl border ${config.bg} ${config.border}`}
        >
          <Icon className={`h-4 w-4 ${config.textColor}`} />
        </div>
      </div>

      {/* Status */}
      <div className="relative mt-6 flex items-center justify-between border-t border-zinc-800 pt-4">
        <div className="flex items-center gap-2">
          <Radio className={`h-3 w-3 ${config.textColor}`} />

          <span
            className={`text-[9px] font-mono font-bold uppercase tracking-[0.14em] ${config.textColor}`}
          >
            {config.text}
          </span>
        </div>

        <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-700">
          {updatedAt}
        </span>
      </div>
    </div>
  );
}