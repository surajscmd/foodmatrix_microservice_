"use client";

import { useMemo, useState } from "react";

import { Boxes, Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";

import type { WarehouseStockView } from "@/utils/types/inventory";

import {
  InventoryPagination,
  formatStockQuantity,
  inventoryButtonClass,
  inventoryPrimaryClass,
} from "./InventoryShared";

interface InventoryTableProps {
  items: WarehouseStockView[];
  searchTerm: string;
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onAdd: () => void;
  onBulkAdd: () => void;
  onEdit: (item: WarehouseStockView) => void;
  onDelete: (item: WarehouseStockView) => void;
}

export default function InventoryTable({
  items,
  searchTerm,
  loading,
  error,
  onRefresh,
  onAdd,
  onBulkAdd,
  onEdit,
  onDelete,
}: InventoryTableProps) {
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch = [
        item.ingredient?.name ?? "",
        item.ingredientId,
        item.id,
      ].some((value) => value.toLowerCase().includes(query));

      const available = Number(item.quantityOnHand) > 0;

      return (
        matchesSearch &&
        (status === "All" ||
          (status === "available" && available) ||
          (status === "empty" && !available))
      );
    });
  }, [items, searchTerm, status]);

  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(filteredItems.length / limit)),
  );

  const visibleItems = filteredItems.slice(
    (currentPage - 1) * limit,
    currentPage * limit,
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
      <div className="flex flex-col gap-3 border-b border-zinc-800 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-zinc-300">Warehouse Stock</p>

          <p className="mt-1 text-[10px] text-zinc-600">
            {filteredItems.length} matching records · {items.length} warehouse
            records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter stock status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className={inventoryButtonClass}
          >
            <option value="All">All Statuses</option>
            <option value="available">In Stock</option>
            <option value="empty">Out of Stock</option>
          </select>

          <button
            type="button"
            aria-label="Refresh warehouse stock"
            disabled={loading}
            onClick={onRefresh}
            className={inventoryButtonClass}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onBulkAdd}
            className={inventoryButtonClass}
          >
            <Boxes className="h-3.5 w-3.5" />
            Bulk Receive
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onAdd}
            className={inventoryPrimaryClass}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Stock
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-12 text-center">
          <p role="alert" className="text-xs text-rose-400">
            {error}
          </p>

          <button
            type="button"
            onClick={onRefresh}
            className={`${inventoryButtonClass} mt-4`}
          >
            Retry
          </button>
        </div>
      ) : loading ? (
        <div
          role="status"
          className="flex min-h-[350px] items-center justify-center gap-3"
        >
          <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />

          <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
            Loading warehouse stock...
          </p>
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="p-12 text-center">
          <p className="font-mono text-xs text-zinc-600">
            NO STOCK RECORDS FOUND
          </p>

          <p className="mt-2 text-xs text-zinc-700">
            {items.length
              ? "Try changing your search or stock status."
              : "Add stock to register an ingredient balance."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left">
            <thead>
              <tr className="border-b border-zinc-800/80 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-600">
                <th className="px-5 py-3.5">Ingredient</th>
                <th className="px-5 py-3.5">Stock Record</th>
                <th className="px-5 py-3.5">Available Balance</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Last Updated</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-900">
              {visibleItems.map((item) => {
                const available = Number(item.quantityOnHand) > 0;

                return (
                  <tr
                    key={item.id}
                    className="group transition hover:bg-zinc-900/60"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                            available
                              ? "border-emerald-500/15 bg-emerald-500/[0.06]"
                              : "border-zinc-800 bg-zinc-900"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              available
                                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.45)]"
                                : "bg-zinc-600"
                            }`}
                          />
                        </div>

                        <div>
                          <p className="text-[13px] font-semibold text-zinc-100">
                            {item.ingredient?.name ??
                              "Ingredient details unavailable"}
                          </p>

                          <span
                            title={item.ingredientId}
                            className="mt-1 inline-flex rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-[10px] text-zinc-500"
                          >
                            {item.ingredientId}…
                          </span>
                        </div>
                      </div>
                    </td>

                    <td
                      title={item.id}
                      className="px-5 py-4 font-mono text-[11px] text-zinc-500"
                    >
                      {item.id.slice(0, 8)}…
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-mono text-[13px] font-semibold tabular-nums text-zinc-200">
                        {formatStockQuantity(item.quantityOnHand)}
                      </span>{" "}
                      <span className="font-mono text-[10px] text-zinc-600">
                        {item.ingredient?.uom ?? ""}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-[9px] font-semibold uppercase ${
                          available
                            ? "border-emerald-500/15 bg-emerald-500/[0.06] text-emerald-400"
                            : "border-rose-500/15 bg-rose-500/[0.06] text-rose-400"
                        }`}
                      >
                        <span className="h-1 w-1 rounded-full bg-current" />
                        {available ? "In Stock" : "Out of Stock"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 font-mono text-[10px] text-zinc-500">
                      {new Date(item.updatedAt).toLocaleString("en-IN")}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          title="Edit stock"
                          aria-label={`Edit stock for ${item.ingredient?.name ?? "stock item"}`}
                          onClick={() => onEdit(item)}
                          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 text-cyan-300 transition-colors hover:border-cyan-500/40 hover:bg-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40"
                        >
                          <Pencil className="h-3.5 w-3.5" />

                          <span className="whitespace-nowrap font-mono text-[10px] font-semibold uppercase tracking-wider">
                            Edit Stock
                          </span>
                        </button>

                        <button
                          type="button"
                          title="Delete stock"
                          aria-label={`Delete stock for ${item.ingredient?.name ?? "stock item"}`}
                          onClick={() => onDelete(item)}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 transition-colors hover:border-rose-500/40 hover:bg-rose-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <InventoryPagination
        page={currentPage}
        limit={limit}
        total={filteredItems.length}
        loading={loading}
        onPageChange={setPage}
        onLimitChange={(nextLimit) => {
          setLimit(nextLimit);
          setPage(1);
        }}
      />
    </div>
  );
}
