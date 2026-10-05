"use client";

import { Filter, RotateCcw } from "lucide-react";

import type { Restaurant } from "@/utils/types/organization";

interface FilterBarProps {
  status: "ALL" | Restaurant["status"];

  onStatusChange: (status: "ALL" | Restaurant["status"]) => void;

  resultCount: number;
  totalCount: number;
}

export default function FilterBar({
  status,
  onStatusChange,
  resultCount,
  totalCount,
}: FilterBarProps) {
  const hasFilter = status !== "ALL";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/30 border border-zinc-800 rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-zinc-600" />

        <span className="text-[10px] font-mono uppercase text-zinc-500">
          Node Filter
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onStatusChange("ALL")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase transition-all ${
              status === "ALL"
                ? "bg-zinc-800 text-white border border-zinc-700"
                : "text-zinc-500 hover:text-zinc-300 border border-transparent"
            }`}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => onStatusChange("ACTIVE")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase transition-all ${
              status === "ACTIVE"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-zinc-500 hover:text-zinc-300 border border-transparent"
            }`}
          >
            Active
          </button>

          <button
            type="button"
            onClick={() => onStatusChange("INACTIVE")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase transition-all ${
              status === "INACTIVE"
                ? "bg-zinc-800 text-zinc-300 border border-zinc-700"
                : "text-zinc-500 hover:text-zinc-300 border border-transparent"
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono text-zinc-600">
          {resultCount} / {totalCount} nodes
        </span>

        {hasFilter && (
          <button
            type="button"
            onClick={() => onStatusChange("ALL")}
            className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
