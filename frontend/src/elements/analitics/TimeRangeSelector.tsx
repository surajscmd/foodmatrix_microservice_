"use client";

import { RefreshCw } from "lucide-react";

export type Timeframe = "24h" | "7d" | "30d" | "ytd";

interface TimeRangeSelectorProps {
  timeframe: Timeframe;
  onChange: (timeframe: Timeframe) => void;
}

const timeframes: {
  value: Timeframe;
  label: string;
}[] = [
  {
    value: "24h",
    label: "Last 24h",
  },
  {
    value: "7d",
    label: "Last 7 Days",
  },
  {
    value: "30d",
    label: "Last 30 Days",
  },
  {
    value: "ytd",
    label: "Year to Date",
  },
];

export default function TimeRangeSelector({
  timeframe,
  onChange,
}: TimeRangeSelectorProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">

      {/* Left */}
      <div className="flex flex-wrap items-center gap-3">

        <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-zinc-500">
          Analytics Range
        </span>

        <div className="flex rounded-xl border border-zinc-800 bg-zinc-950 p-1">

          {timeframes.map((item) => (
            <button
              key={item.value}
              onClick={() => onChange(item.value)}
              className={`cursor-pointer rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-wide transition-all duration-200

              ${
                timeframe === item.value
                  ? "bg-emerald-500/10 text-emerald-400 shadow-inner"
                  : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
              }`}
            >
              {item.label}
            </button>
          ))}

        </div>

      </div>

      {/* Right */}

      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/10 bg-emerald-500/5 px-3 py-2">

        <RefreshCw
          className="h-3.5 w-3.5 animate-spin text-emerald-400"
          style={{
            animationDuration: "6s",
          }}
        />

        <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-emerald-400">
          Live analytics synchronized
        </span>

      </div>

    </div>
  );
}