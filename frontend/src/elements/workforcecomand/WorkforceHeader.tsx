"use client";

import { RefreshCw } from "lucide-react";

interface WorkforceHeaderProps {
  lastUpdated: Date | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function WorkforceHeader({
  lastUpdated,
  onRefresh,
  isRefreshing,
}: WorkforceHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      {/* Section heading */}
      <div className="flex items-center gap-3">
        <div className="h-4 w-1 rounded-full bg-emerald-400" />

        <div>
          <p className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-zinc-400">
            Workforce Overview
          </p>

          <p className="mt-0.5 text-[10px] text-zinc-600">
            Current workforce health and operational status
          </p>
        </div>
      </div>

      {/* Refresh */}
      <div className="flex items-center gap-3">
        {lastUpdated && (
          <span className="hidden text-[10px] text-zinc-600 sm:block">
            Updated{" "}
            {lastUpdated.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-2 text-zinc-500 transition-all hover:border-emerald-500/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Refresh workforce"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              isRefreshing ? "animate-spin" : ""
            }`}
          />
        </button>
      </div>
    </div>
  );
}