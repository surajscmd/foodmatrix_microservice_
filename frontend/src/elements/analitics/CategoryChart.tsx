"use client";

import { categorySales } from "@/utils/mockData";

export default function CategoryChart() {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">

      {/* Header */}

      <div className="mb-6 flex items-center justify-between">

        <div>

          <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-zinc-500">
            Product Analytics
          </p>

          <h3 className="mt-1 text-lg font-semibold text-white">
            Sales Contribution by Category
          </h3>

        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1">

          <span className="text-[11px] font-semibold text-zinc-400">
            4 Categories
          </span>

        </div>

      </div>

      {/* Chart */}

      <div className="space-y-6">

        {categorySales.map((category) => (

          <div key={category.id} className="space-y-2">

            <div className="flex items-center justify-between">

              <div>

                <h4 className="text-sm font-semibold text-white">
                  {category.name}
                </h4>

                <p className="text-xs text-zinc-500">
                  Revenue Contribution
                </p>

              </div>

              <div className="text-right">

                <p className="text-sm font-bold text-white">
                  {category.revenue}
                </p>

                <p className="text-xs text-zinc-500">
                  {category.percentage}%
                </p>

              </div>

            </div>

            <div className="relative h-3 overflow-hidden rounded-full bg-zinc-950">

              <div
                className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                style={{
                  width: `${category.percentage}%`,
                  backgroundColor: category.color,
                }}
              />

            </div>

          </div>

        ))}

      </div>

      {/* Footer */}

      <div className="mt-8 grid grid-cols-2 gap-3">

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">

          <p className="text-xs text-zinc-500">
            Highest Contributor
          </p>

          <h4 className="mt-1 text-lg font-bold text-emerald-400">
            Gourmet Mains
          </h4>

          <p className="mt-1 text-xs text-zinc-400">
            45% of total sales
          </p>

        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">

          <p className="text-xs text-zinc-500">
            Total Categories
          </p>

          <h4 className="mt-1 text-lg font-bold text-white">
            {categorySales.length}
          </h4>

          <p className="mt-1 text-xs text-zinc-400">
            Active menu segments
          </p>

        </div>

      </div>

    </section>
  );
}