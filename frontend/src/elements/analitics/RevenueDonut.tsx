"use client";

import { revenueDistribution } from "@/utils/mockData";

export default function RevenueDonut() {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">

      {/* Header */}

      <div className="mb-6 flex items-start justify-between">

        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-zinc-500">
            Revenue Distribution
          </p>

          <h3 className="mt-1 text-lg font-semibold text-white">
            Regional Revenue Split
          </h3>
        </div>

        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
          <span className="text-xs font-semibold text-emerald-400">
            Live
          </span>
        </div>

      </div>

      <div className="flex flex-col items-center justify-between gap-10 xl:flex-row">

        {/* Donut */}

        <div className="relative h-52 w-52">

          <svg
            viewBox="0 0 100 100"
            className="h-full w-full -rotate-90 transform"
          >
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              stroke="#27272a"
              strokeWidth="10"
            />

            {revenueDistribution.map((item) => (
              <circle
                key={item.id}
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke={item.color}
                strokeWidth="10"
                strokeDasharray={item.dashArray}
                strokeDashoffset={item.dashOffset}
                strokeLinecap="round"
              />
            ))}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">

            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Total Revenue
            </span>

            <h2 className="mt-1 text-3xl font-bold text-white">
              $2.8M
            </h2>

            <span className="mt-1 text-xs text-emerald-400">
              +18.4%
            </span>

          </div>

        </div>

        {/* Legend */}

        <div className="flex-1 space-y-4">

          {revenueDistribution.map((region) => (
            <div
              key={region.id}
              className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-3"
            >
              <div className="flex items-center gap-3">

                <span
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: region.color,
                  }}
                />

                <div>

                  <p className="text-sm font-medium text-white">
                    {region.region}
                  </p>

                  <p className="text-xs text-zinc-500">
                    {region.amount}
                  </p>

                </div>

              </div>

              <div className="text-right">

                <p className="text-lg font-bold text-white">
                  {region.value}%
                </p>

                <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                  Share
                </p>

              </div>
            </div>
          ))}

        </div>

      </div>

    </section>
  );
}