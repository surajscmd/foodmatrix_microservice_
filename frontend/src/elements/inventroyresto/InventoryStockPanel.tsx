"use client";

import { useState } from "react";
import {
  Boxes,
  Search,
  TriangleAlert,
  PackageX,
  Plus,
  TrendingUp,
} from "lucide-react";
import type { RestaurantStockView } from "@/lib/inventory-api";
import { field, panel, quantity } from "./inventory-view";

const cell = "px-4 py-3.5";
const tableStyle = "w-full text-left text-xs";
const head =
  "border-b border-zinc-800 bg-zinc-950/50 font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-500";

const filters = [
  {
    id: "all",
    label: "Stock records",
    icon: Boxes,
    accent: "from-sky-500/40 via-sky-500/10 to-transparent",
    color: "text-sky-400",
    iconBg: "border-sky-500/10 bg-sky-500/10",
    valueClass: "text-white",
    description: "registered restaurant stock records",
    suffix: "records",
  },
  {
    id: "low",
    label: "Low stock",
    icon: TriangleAlert,
    accent: "from-emerald-500/40 via-emerald-500/10 to-transparent",
    color: "text-emerald-400",
    iconBg: "border-emerald-500/10 bg-emerald-500/10",
    valueClass: "text-emerald-400",
    description: "positive balances at or below reorder level",
    suffix: "low",
  },
  {
    id: "out",
    label: "Out of stock",
    icon: PackageX,
    accent: "from-rose-500/40 via-rose-500/10 to-transparent",
    color: "text-rose-400",
    iconBg: "border-rose-500/10 bg-rose-500/10",
    valueClass: "text-rose-400",
    description: "ingredients with no remaining stock",
    suffix: "empty",
  },
] as const;

interface Props {
  rows: RestaurantStockView[];
  canManage: boolean;
  busy: boolean;
  onRequest: (row: RestaurantStockView) => void;
}

export default function InventoryStockPanel({
  rows,
  canManage,
  busy,
  onRequest,
}: Props) {
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const [search, setSearch] = useState("");
  const level = (row: RestaurantStockView) =>
    Number(row.quantityOnHand) <= 0
      ? "out"
      : Number(row.quantityOnHand) <= Number(row.reorderLevel)
        ? "low"
        : "in";
  const counts = { all: rows.length, low: 0, out: 0 };
  for (const row of rows) {
    const status = level(row);
    if (status !== "in") counts[status]++;
  }
  const query = search.trim().toLowerCase();
  const filtered = rows.filter(
    (row) =>
      (filter === "all" || level(row) === filter) &&
      (row.ingredient?.name ?? row.ingredientId).toLowerCase().includes(query),
  );

  return (
    <section aria-label="Stock on hand" className="space-y-5">
      <div
        role="group"
        aria-label="Stock summary"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        {filters.map(
          ({
            id,
            label,
            icon: Icon,
            accent,
            color,
            iconBg,
            valueClass,
            description,
            suffix,
          }) => (
            <div
              key={id}
              className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-left"
            >
              <span
                aria-hidden
                className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${accent} opacity-70`}
              />
              <span className="relative flex items-start justify-between">
                <span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                    {label}
                  </span>
                  <span className="mt-1 block text-[10px] text-zinc-600">
                    {description}
                  </span>
                </span>
                <span
                  className={`ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${iconBg}`}
                >
                  <Icon aria-hidden className={`h-4 w-4 ${color}`} />
                </span>
              </span>
              <span className="relative mt-5 flex items-end gap-2">
                <span
                  className={`text-3xl font-semibold tracking-tight ${id === "out" && counts.out === 0 ? "text-white" : valueClass}`}
                >
                  {counts[id]}
                </span>
                <span className="mb-1 font-mono text-[11px] uppercase tracking-wide text-zinc-500">
                  {suffix}
                </span>
              </span>
              <span className="relative mt-5 flex items-center justify-between border-t border-zinc-800/80 pt-3">
                <span
                  className={`font-mono text-[9px] uppercase tracking-wider ${color}`}
                >
                  Restaurant stock register
                </span>
                <TrendingUp
                  aria-hidden
                  className="h-3 w-3 text-zinc-700 transition-colors group-hover:text-zinc-500"
                />
              </span>
            </div>
          ),
        )}
      </div>
      <div className={`${panel} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/50 px-4 py-3">
          <label className="relative w-full sm:max-w-sm">
            <span className="sr-only">Search stock by ingredient</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-3 size-4 text-zinc-400"
            />
            <input
              type="search"
              placeholder="Search ingredients…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={`${field} pl-9`}
            />
          </label>
          <div
            role="group"
            aria-label="Filter by stock level"
            className="flex flex-wrap gap-1.5"
          >
            {filters.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
                className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 ${filter === id ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300" : "border-zinc-800 bg-zinc-900/70 text-zinc-400 hover:border-zinc-700 hover:text-zinc-100"}`}
              >
                {id === "all" ? "All stock" : label}
                <span className="rounded-md bg-zinc-950/70 px-1.5 py-0.5 font-mono text-[10px] tabular-nums">
                  {counts[id]}
                </span>
              </button>
            ))}
          </div>
        </div>
        <StockTable
          rows={filtered}
          canManage={canManage}
          busy={busy}
          onRequest={onRequest}
        />
        <p
          role="status"
          className="border-t border-zinc-800 px-4 py-3 text-[11px] tabular-nums text-zinc-500"
        >
          {filtered.length} of {rows.length} records
        </p>
      </div>
    </section>
  );
}

function StockTable({ rows, canManage, busy, onRequest }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className={tableStyle}>
        <caption className="sr-only">Restaurant stock</caption>
        <thead className={head}>
          <tr>
            <th scope="col" className={cell}>
              Ingredient
            </th>
            <th scope="col" className={`${cell} text-right`}>
              On hand
            </th>
            <th scope="col" className={`${cell} text-right`}>
              Reorder level
            </th>
            <th scope="col" className={cell}>
              Status
            </th>
            {canManage && (
              <th scope="col" className={`${cell} text-right`}>
                Replenish
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {rows.map((row) => {
            const zero = Number(row.quantityOnHand) <= 0;
            const low = Number(row.quantityOnHand) <= Number(row.reorderLevel);
            return (
              <tr
                key={row.id}
                className="transition-colors even:bg-zinc-900/20 hover:bg-zinc-900/50"
              >
                <th
                  scope="row"
                  className={`${cell} text-xs font-semibold text-white`}
                >
                  <div className="flex min-w-36 items-center gap-3">
                    <span
                      aria-hidden
                      className="grid size-8 shrink-0 place-items-center rounded-lg border border-zinc-800 bg-zinc-900/70 text-emerald-400"
                    >
                      <Boxes size={14} />
                    </span>
                    <div>
                      <p className="leading-5">
                        {row.ingredient?.name ?? row.ingredientId}
                      </p>
                      {row.ingredient?.uom && (
                        <p className="mt-0.5 font-mono text-[9px] font-normal uppercase tracking-wider text-zinc-500">
                          Unit · {row.ingredient.uom}
                        </p>
                      )}
                    </div>
                  </div>
                </th>
                <td
                  className={`${cell} whitespace-nowrap text-right font-medium tabular-nums ${zero ? "text-rose-200" : "text-zinc-100"}`}
                >
                  <span
                    className={`inline-block min-w-16 rounded-lg border px-2.5 py-1.5 font-mono text-xs font-semibold ${zero ? "border-rose-400/15 bg-rose-400/5 text-rose-300" : low ? "border-amber-400/15 bg-amber-400/5 text-amber-300" : "border-emerald-400/15 bg-emerald-400/5 text-emerald-300"}`}
                  >
                    {quantity(row.quantityOnHand)}
                  </span>
                  <span className="ml-1.5 text-[10px] text-zinc-500">
                    {row.ingredient?.uom}
                  </span>
                </td>
                <td
                  className={`${cell} whitespace-nowrap text-right tabular-nums text-zinc-300`}
                >
                  {quantity(row.reorderLevel)} {row.ingredient?.uom}
                </td>
                <td
                  className={`${cell} whitespace-nowrap text-xs font-medium ${zero ? "text-rose-200" : low ? "text-amber-200" : "text-emerald-200"}`}
                >
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 font-mono text-[9px] uppercase tracking-wider ${zero ? "border-rose-400/20 bg-rose-400/10" : low ? "border-amber-400/20 bg-amber-400/10" : "border-emerald-400/20 bg-emerald-400/10"}`}
                  >
                    <span
                      aria-hidden
                      className="size-1.5 rounded-full bg-current"
                    />
                    {zero ? "Out of stock" : low ? "Low stock" : "In stock"}
                  </span>
                </td>
                {canManage && (
                  <td className={`${cell} text-right`}>
                    <button
                      type="button"
                      className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 text-[11px] font-semibold text-emerald-300 transition-colors enabled:hover:border-emerald-400 enabled:hover:bg-emerald-400 enabled:hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-50"
                      disabled={busy || row.ingredient?.isActive === false}
                      aria-label={`Request ${row.ingredient?.name ?? row.ingredientId}`}
                      onClick={() => onRequest(row)}
                    >
                      <Plus size={13} aria-hidden /> Request
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {!rows.length && (
        <p className="px-4 py-6 text-sm text-zinc-300">
          No matching stock records.
        </p>
      )}
    </div>
  );
}
