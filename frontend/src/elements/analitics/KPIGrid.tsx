"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";

const kpis = [
  {
    id: 1,
    title: "Gross Sourcing Revenues",
    value: "$2.84M",
    subtitle: "+18.4% vs benchmark",
    trend: "up",
    valueColor: "text-white",
    subtitleColor: "text-emerald-400",
  },
  {
    id: 2,
    title: "Labor Cost Ratio",
    value: "28.4%",
    subtitle: "-1.2% optimal target",
    trend: "down",
    valueColor: "text-white",
    subtitleColor: "text-emerald-400",
  },
  {
    id: 3,
    title: "Food Waste Factor",
    value: "1.2%",
    subtitle: "Corporate limit: 2.5% max",
    trend: "none",
    valueColor: "text-emerald-400",
    subtitleColor: "text-zinc-500",
  },
  {
    id: 4,
    title: "Operational Score",
    value: "94.8%",
    subtitle: "+0.8% efficiency gain",
    trend: "up",
    valueColor: "text-white",
    subtitleColor: "text-emerald-400",
  },
];

export default function KPIGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((item) => (
        <div
          key={item.id}
          className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl"
        >
          <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">
            {item.title}
          </span>

          <h3 className={`text-xl font-semibold mt-1 ${item.valueColor}`}>
            {item.value}
          </h3>

          {item.trend === "up" && (
            <span
              className={`text-[10px] ${item.subtitleColor} font-medium flex items-center gap-0.5 mt-0.5 font-bold`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{item.subtitle}</span>
            </span>
          )}

          {item.trend === "down" && (
            <span
              className={`text-[10px] ${item.subtitleColor} font-medium flex items-center gap-0.5 mt-0.5 font-bold`}
            >
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
              <span>{item.subtitle}</span>
            </span>
          )}

          {item.trend === "none" && (
            <span
              className={`text-[10px] ${item.subtitleColor} flex items-center gap-0.5 mt-0.5 font-bold`}
            >
              <span>{item.subtitle}</span>
            </span>
          )}
        </div>
      ))}
    </div>
  );
}