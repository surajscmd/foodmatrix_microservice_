"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { TrendingUp } from "lucide-react";
import { dailyRevenue } from "@/utils/mockData";

export default function RevenueChart() {
  return (
    <section
      className="
      overflow-hidden
      rounded-3xl
      border
      border-zinc-800
      bg-zinc-900/50
      backdrop-blur-md
      "
    >
      {/* Header */}

      <div
        className="
        flex
        flex-col
        gap-5
        border-b
        border-zinc-800
        p-6
        md:flex-row
        md:items-center
        md:justify-between
        "
      >
        <div>
          <p
            className="
            text-[10px]
            font-mono
            uppercase
            tracking-[0.18em]
            text-zinc-500
            "
          >
            SALES ANALYTICS
          </p>

          <h2
            className="
            mt-2
            text-2xl
            font-bold
            text-white
            "
          >
            Revenue Performance
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Daily revenue generated this week
          </p>
        </div>

        <div
          className="
          flex
          items-center
          gap-4
          rounded-2xl
          border
          border-emerald-500/20
          bg-emerald-500/10
          px-5
          py-3
          "
        >
          <div
            className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-xl
            bg-emerald-500/15
            "
          >
            <TrendingUp size={22} className="text-emerald-400" />
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-300">
              Weekly Revenue
            </p>

            <h3 className="text-2xl font-bold text-white">$88,450</h3>
          </div>
        </div>
      </div>

      {/* Chart */}

      <div className="h-[340px] px-4 pb-4 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={dailyRevenue}
            margin={{
              top: 20,
              right: 15,
              left: -20,
              bottom: 5,
            }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />

                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#27272a"
              vertical={false}
              strokeDasharray="4 4"
            />

            <XAxis
              dataKey="day"
              tick={{
                fill: "#71717a",
                fontSize: 12,
              }}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              tickFormatter={(v) => `$${v / 1000}k`}
              tick={{
                fill: "#71717a",
                fontSize: 12,
              }}
              tickLine={false}
              axisLine={false}
            />

            <Tooltip
              contentStyle={{
                background: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: 12,
              }}
              labelStyle={{
                color: "#a1a1aa",
              }}
              formatter={(value) => [
                `$${Number(value).toLocaleString()}`,
                "Revenue",
              ]}
            />

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={3}
              fill="url(#revenueGradient)"
              activeDot={{
                r: 6,
                stroke: "#10b981",
                strokeWidth: 3,
                fill: "#18181b",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
