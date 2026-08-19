"use client";

import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";

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
  },
  warning: {
    icon: Clock3,
    text: "Warning",
    textColor: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  critical: {
    icon: AlertTriangle,
    text: "Critical",
    textColor: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
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
      className={`rounded-2xl border ${config.border} bg-zinc-900/40 p-5 transition-all hover:bg-zinc-900/70`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-zinc-500">
            {title}
          </p>

          <h3 className="mt-2 text-2xl font-bold text-white">
            {value}
          </h3>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${config.bg}`}
        >
          <Icon className={`h-5 w-5 ${config.textColor}`} />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-zinc-800 pt-4">
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${config.bg} ${config.textColor}`}
        >
          {config.text}
        </span>

        <span className="text-[11px] text-zinc-500">
          Updated {updatedAt}
        </span>
      </div>
    </div>
  );
}