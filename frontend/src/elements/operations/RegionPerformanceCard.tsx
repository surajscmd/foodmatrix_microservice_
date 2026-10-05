"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MapPin,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";

interface RegionPerformanceCardProps {
  region: string;
  stores: number;
  revenue: number;
  growth: number;
  activeOrders: number;
  status: "healthy" | "warning" | "critical";
}

const statusConfig = {
  healthy: {
    icon: CheckCircle2,
    label: "Healthy",
    color: "text-emerald-400",
    dot: "bg-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  warning: {
    icon: Clock3,
    label: "Warning",
    color: "text-amber-400",
    dot: "bg-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  critical: {
    icon: AlertTriangle,
    label: "Critical",
    color: "text-red-400",
    dot: "bg-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
};

export default function RegionPerformanceCard({
  region,
  stores,
  revenue,
  growth,
  activeOrders,
  status,
}: RegionPerformanceCardProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border ${config.border} bg-zinc-950/75 p-5 transition-all duration-300 hover:bg-zinc-900/80`}
    >
      {/* Ambient status glow */}
      <div
        className={`pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full ${config.bg} opacity-40 blur-3xl`}
      />

      {/* Header */}
      <div className="relative flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-zinc-600" />

            <p className="text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-zinc-600">
              Network Region
            </p>
          </div>

          <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">
            {region}
          </h3>
        </div>

        <div
          className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${config.bg} ${config.border}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${config.dot} shadow-[0_0_7px_currentColor]`}
          />

          <span
            className={`text-[9px] font-mono font-bold uppercase tracking-wider ${config.color}`}
          >
            {config.label}
          </span>
        </div>
      </div>

      {/* Main revenue block */}
      <div className="relative mt-7 rounded-xl border border-zinc-800 bg-[#070914] p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-zinc-600">
              24H Revenue
            </p>

            <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
              ₹{revenue.toLocaleString("en-IN")}
            </p>
          </div>

          <div
            className={`flex items-center gap-1 text-xs font-semibold ${
              growth >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {growth >= 0 ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}

            {growth >= 0 ? "+" : ""}
            {growth}%
          </div>
        </div>

        {/* Performance rail */}
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-zinc-800">
          <div
            className={`h-full rounded-full ${
              growth >= 0 ? "bg-emerald-400" : "bg-red-400"
            }`}
            style={{
              width: `${Math.min(Math.abs(growth) * 5 + 20, 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Operational metrics */}
      <div className="mt-4 grid grid-cols-3 divide-x divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-950/60">
        <div className="p-3">
          <div className="flex items-center gap-1.5 text-zinc-600">
            <ShoppingBag className="h-3.5 w-3.5" />
            <span className="text-[9px] font-mono uppercase">
              Stores
            </span>
          </div>

          <p className="mt-2 text-lg font-semibold text-white">
            {stores}
          </p>
        </div>

        <div className="p-3">
          <div className="flex items-center gap-1.5 text-zinc-600">
            <Users className="h-3.5 w-3.5" />
            <span className="text-[9px] font-mono uppercase">
              Orders
            </span>
          </div>

          <p className="mt-2 text-lg font-semibold text-white">
            {activeOrders}
          </p>
        </div>

        <div className="p-3">
          <div className="flex items-center gap-1.5 text-zinc-600">
            <Wallet className="h-3.5 w-3.5" />
            <span className="text-[9px] font-mono uppercase">
              Avg / Store
            </span>
          </div>

          <p className="mt-2 text-lg font-semibold text-white">
            ₹
            {stores > 0
              ? Math.round(revenue / stores).toLocaleString("en-IN")
              : "0"}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="relative mt-4 flex items-center justify-between">
        <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-zinc-700">
          Regional telemetry
        </span>

        <div className={`flex items-center gap-1.5 ${config.color}`}>
          <StatusIcon className="h-3.5 w-3.5" />

          <span className="text-[9px] font-mono uppercase tracking-wider">
            Live signal
          </span>
        </div>
      </div>
    </div>
  );
}