"use client";

import { useState } from "react";
import { Boxes, Search, TriangleAlert, PackageX } from "lucide-react";
import type { RestaurantStockView } from "@/lib/inventory-api";
import { button, field, panel, quantity } from "./inventory-view";

const cell = "px-4 py-3";
const tableStyle = "w-full text-left text-sm";
const head = "border-b border-zinc-700 bg-zinc-900 text-xs text-zinc-300";

const filters = [
  {
    id: "all",
    label: "Stock records",
    icon: Boxes,
    tone: "from-emerald-400/15 border-emerald-400/30 text-emerald-200",
  },
  {
    id: "low",
    label: "Low stock",
    icon: TriangleAlert,
    tone: "from-amber-400/15 border-amber-400/30 text-amber-200",
  },
  {
    id: "out",
    label: "Out of stock",
    icon: PackageX,
    tone: "from-rose-400/15 border-rose-400/30 text-rose-200",
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
    <section aria-label="Stock on hand" className="space-y-3">
      <div
        role="group"
        aria-label="Filter by stock level"
        className="grid grid-cols-3 gap-2 sm:gap-3"
      >
        {filters.map(({ id, label, icon: Icon, tone }) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
            className={`min-w-0 rounded-xl border bg-linear-to-br to-[#1b1c21] p-2.5 text-left shadow-sm shadow-black/25 transition hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 sm:p-4 ${tone} ${filter === id ? "ring-1 ring-inset ring-current" : ""}`}
          >
            <Icon aria-hidden="true" className="size-4" />
            <span className="mt-1.5 block text-xl font-semibold tabular-nums text-white">
              {counts[id]}
            </span>
            <span className="block text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-700/75 bg-[#202126] px-3 py-2">
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
        <p role="status" className="text-xs tabular-nums text-zinc-300">
          {filtered.length} of {rows.length} records
        </p>
      </div>
      <StockTable
        rows={filtered}
        canManage={canManage}
        busy={busy}
        onRequest={onRequest}
      />
    </section>
  );
}

function StockTable({ rows, canManage, busy, onRequest }: Props) {
  return (
    <div className={`${panel} overflow-x-auto`}>
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
              <tr key={row.id} className="even:bg-white/3">
                <th
                  scope="row"
                  className={`${cell} text-sm font-medium text-white`}
                >
                  {row.ingredient?.name ?? row.ingredientId}
                </th>
                <td
                  className={`${cell} whitespace-nowrap text-right font-medium tabular-nums ${zero ? "text-rose-200" : "text-zinc-100"}`}
                >
                  {quantity(row.quantityOnHand)} {row.ingredient?.uom}
                </td>
                <td
                  className={`${cell} whitespace-nowrap text-right tabular-nums text-zinc-300`}
                >
                  {quantity(row.reorderLevel)}
                </td>
                <td
                  className={`${cell} whitespace-nowrap text-xs font-medium ${zero ? "text-rose-200" : low ? "text-amber-200" : "text-emerald-200"}`}
                >
                  {zero ? "Out of stock" : low ? "Low stock" : "In stock"}
                </td>
                {canManage && (
                  <td className={`${cell} text-right`}>
                    <button
                      type="button"
                      className={button}
                      disabled={busy || row.ingredient?.isActive === false}
                      aria-label={`Request ${row.ingredient?.name ?? row.ingredientId}`}
                      onClick={() => onRequest(row)}
                    >
                      Request
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
