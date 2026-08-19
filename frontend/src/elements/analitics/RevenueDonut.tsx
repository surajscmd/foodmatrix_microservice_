"use client";

import { revenueDistribution } from "@/utils/mockData";

export default function RevenueDonut() {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Revenue Distribution
        </p>

        <h2 className="mt-1 text-lg font-semibold text-white">
          Regional Revenue Split
        </h2>
      </div>

      <div className="space-y-4">
        {revenueDistribution.map((region) => (
          <div
            key={region.id}
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-4"
          >
            <div className="flex items-center gap-3">
              <div
                className="h-3 w-3 rounded-full"
              />

              <div>
                <p className="text-sm font-medium text-white">
                  {region.name}
                </p>

                <p className="text-xs text-zinc-500">
                  {region.amount}
                </p>
              </div>
            </div>

            <p className="text-sm font-bold text-white">
              {region.value}%
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}