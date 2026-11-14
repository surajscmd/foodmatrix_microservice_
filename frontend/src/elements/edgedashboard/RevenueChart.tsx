"use client";

import { useId } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { OrderDashboard } from "@/lib/order-api";

interface RevenueChartProps {
  revenue: OrderDashboard["revenue"];
  currency?: string;
}

const shortDate = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const fullDate = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const compactAmount = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatDay(day: string, formatter: Intl.DateTimeFormat) {
  const date = new Date(`${day}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? day : formatter.format(date);
}

export default function RevenueChart({
  revenue,
  currency,
}: RevenueChartProps) {
  const chartId = useId();
  const positiveFill = `${chartId}-positive`;
  const negativeFill = `${chartId}-negative`;
  const currencyCode = currency?.trim().toUpperCase();

  const money = new Intl.NumberFormat(
    "en-IN",
    currencyCode && /^[A-Z]{3}$/.test(currencyCode)
      ? { style: "currency", currency: currencyCode }
      : { maximumFractionDigits: 2 },
  );

  if (revenue.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-700 p-4 text-sm text-zinc-400">
        No payment dates to display.
      </p>
    );
  }

  const netTotal = revenue.reduce((sum, day) => sum + day.amount, 0);
  const hasNegativeDays = revenue.some(({ amount }) => amount < 0);
  const allDaysZero = revenue.every(({ amount }) => amount === 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-zinc-400">Period total</p>
          <p
            className={`mt-1 break-words text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl ${
              netTotal < 0 ? "text-rose-300" : "text-emerald-200"
            }`}
          >
            {money.format(netTotal)}
          </p>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-300">
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-emerald-400" />
            Positive net
          </span>
          {hasNegativeDays && (
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-rose-400" />
              Negative net
            </span>
          )}
        </div>
      </div>

      {allDaysZero ? (
        <p className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-6 text-sm text-zinc-300">
          Net payments were zero on every day in this period.
        </p>
      ) : (
        <div className="h-56 min-w-0 rounded-xl border border-zinc-800 bg-gradient-to-b from-slate-900/70 to-zinc-950 px-1.5 pb-2 pt-3 sm:h-64 sm:px-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              accessibilityLayer
              data={revenue}
              margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
            >
              <defs>
                <linearGradient id={positiveFill} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#5eead4" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id={negativeFill} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#be123c" />
                  <stop offset="100%" stopColor="#fda4af" />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} stroke="#303540" strokeDasharray="4 4" />

              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tickMargin={10}
                minTickGap={12}
                tick={{ fill: "#cbd5e1", fontSize: 11 }}
                tickFormatter={(day: string) => formatDay(day, shortDate)}
              />

              <YAxis
                width={48}
                axisLine={false}
                tickLine={false}
                tickMargin={6}
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                tickFormatter={(amount: number) => compactAmount.format(amount)}
              />

              <ReferenceLine y={0} stroke="#71717a" />

              <Tooltip
                labelFormatter={(day) => formatDay(String(day), fullDate)}
                formatter={(amount) => money.format(Number(amount))}
                cursor={{ fill: "#334155", fillOpacity: 0.4 }}
                contentStyle={{
                  backgroundColor: "#111827",
                  border: "1px solid #475569",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#f8fafc", fontWeight: 600 }}
                itemStyle={{ color: "#e2e8f0" }}
              />

              <Bar
                dataKey="amount"
                name="Net payments"
                maxBarSize={38}
                radius={5}
                isAnimationActive={false}
              >
                {revenue.map(({ day, amount }) => (
                  <Cell
                    key={day}
                    fill={`url(#${amount < 0 ? negativeFill : positiveFill})`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}