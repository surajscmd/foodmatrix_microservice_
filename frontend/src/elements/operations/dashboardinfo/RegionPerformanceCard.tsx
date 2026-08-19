"use client";

import {
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  Clock3,
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
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  warning: {
    icon: Clock3,
    label: "Warning",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  critical: {
    icon: AlertTriangle,
    label: "Critical",
    color: "text-red-400",
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
      className={`rounded-2xl border ${config.border} bg-zinc-900/40 p-5 transition-all duration-300 hover:bg-zinc-900/70`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Franchise Region
          </p>

          <h3 className="mt-1 text-lg font-semibold text-white">
            {region}
          </h3>
        </div>

        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${config.bg} ${config.color}`}
        >
          <StatusIcon className="h-3.5 w-3.5" />
          {config.label}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div>
          <div className="flex items-center gap-2 text-zinc-500">
            <ShoppingBag className="h-4 w-4" />
            <span className="text-xs">Stores</span>
          </div>

          <p className="mt-2 text-xl font-bold text-white">
            {stores}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 text-zinc-500">
            <Wallet className="h-4 w-4" />
            <span className="text-xs">Revenue</span>
          </div>

          <p className="mt-2 text-xl font-bold text-white">
            ₹{revenue.toLocaleString("en-IN")}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 text-zinc-500">
            <Users className="h-4 w-4" />
            <span className="text-xs">Orders</span>
          </div>

          <p className="mt-2 text-xl font-bold text-white">
            {activeOrders}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-zinc-800 pt-4">
        <span className="text-xs text-zinc-500">
          24 Hour Performance
        </span>

        <div
          className={`flex items-center gap-1 text-sm font-semibold ${
            growth >= 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {growth >= 0 ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : (
            <ArrowDownRight className="h-4 w-4" />
          )}

          {growth >= 0 ? "+" : ""}
          {growth}%
        </div>
      </div>
    </div>
  );
}