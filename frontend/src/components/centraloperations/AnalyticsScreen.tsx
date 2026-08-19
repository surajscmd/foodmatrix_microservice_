"use client";

import { useState } from "react";

import TimeRangeSelector, { Timeframe } from "@/elements/analitics/TimeRangeSelector";

import KPIGrid from "@/elements/analitics/RevenueDonut";
import RevenueDonut from "@/elements/analitics/RevenueDonut";
import CategoryChart from "@/elements/analitics/CategoryChart";
import PerformanceTable from "@/elements/analitics/PerformanceTable";

import { performanceLogs } from "@/utils/mockData";

interface AnalyticsScreenProps {
  searchTerm: string;
}

export default function AnalyticsScreen({ searchTerm }: AnalyticsScreenProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("30d");

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Analytics Controls */}

      <TimeRangeSelector timeframe={timeframe} onChange={setTimeframe} />

      {/* Executive KPI Cards */}

      {/* Executive KPIs */}

      <KPIGrid />

      {/* Primary Analytics */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <CategoryChart />
        </div>

        <div>
          <RevenueDonut />
        </div>
      </div>

      {/* Secondary Analytics */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <PerformanceTable logs={performanceLogs} searchTerm={searchTerm} />
        </div>

        <div className="space-y-6">
          {/* Future widgets */}

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 h-[220px]">
            Top Performing Stores
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 h-[220px]">
            AI Insights
          </div>
        </div>
      </div>
    </div>
  );
}
