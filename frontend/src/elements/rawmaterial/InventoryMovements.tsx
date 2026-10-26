"use client";

import { useEffect, useState } from "react";

import {
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";

import type { Ingredient } from "@/lib/catalog-api";

import { getWarehouseStockMovements } from "@/lib/inventory-api";

import type {
  MovementType,
  Pagination,
  StockMovementView,
} from "@/utils/types/inventory";

import {
  InventoryIngredientSearch,
  InventoryPagination,
  formatStockQuantity,
  inventoryButtonClass,
  inventoryError,
  inventoryLabelClass,
} from "./InventoryShared";

// ======================================================
// PROPS
// ======================================================

interface InventoryMovementsProps {
  warehouseId: string;
  refreshKey: number;
  searchTerm: string;

  ingredients: Ingredient[];
  ingredientsLoading: boolean;
  ingredientsError: string;

  onRetryIngredients: () => void;
}

// ======================================================
// MOVEMENT TYPES
// ======================================================

const MOVEMENT_TYPES: MovementType[] = [
  "POS_SALE",
  "PURCHASE",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "ADJUSTMENT",
  "WASTE",
];

// ======================================================
// COMPONENT
// ======================================================

export default function InventoryMovements({
  warehouseId,
  refreshKey,
  searchTerm,
  ingredients,
  ingredientsLoading,
  ingredientsError,
  onRetryIngredients,
}: InventoryMovementsProps) {
  const [items, setItems] = useState<StockMovementView[]>([]);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [movementType, setMovementType] =
    useState<MovementType | "">("");

  const [selectedIngredient, setSelectedIngredient] =
    useState<Ingredient | null>(null);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  // ====================================================
  // FETCH MOVEMENTS
  // ====================================================

  useEffect(() => {
    const controller = new AbortController();

    async function fetchMovements(): Promise<void> {
      setLoading(true);
      setError("");

      if (!warehouseId) {
        setItems([]);
        setLoading(false);
        return;
      }

      if (fromDate && toDate && fromDate > toDate) {
        setError(
          "Start date must be on or before end date.",
        );
        setLoading(false);
        return;
      }

      try {
        const response = await getWarehouseStockMovements(
          warehouseId,
          {
            page,
            limit,

            ...(movementType
              ? { movementType }
              : {}),

            ...(selectedIngredient
              ? { ingredientId: selectedIngredient.id }
              : {}),

            ...(fromDate
              ? {
                  fromDate: new Date(
                    `${fromDate}T00:00:00`,
                  ).toISOString(),
                }
              : {}),

            ...(toDate
              ? {
                  toDate: new Date(
                    `${toDate}T23:59:59.999`,
                  ).toISOString(),
                }
              : {}),
          },
          {
            signal: controller.signal,
          },
        );

        if (controller.signal.aborted) return;

        if (
          !Array.isArray(response.data) ||
          !response.pagination
        ) {
          throw new Error(
            "Invalid stock movement response.",
          );
        }

        const lastPage = Math.max(
          1,
          response.pagination.totalPages,
        );

        if (page > lastPage) {
          setPage(lastPage);
          return;
        }

        setItems(response.data);
        setPagination(response.pagination);
      } catch (caught: unknown) {
        if (!controller.signal.aborted) {
          setError(inventoryError(caught));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void fetchMovements();

    return () => controller.abort();
  }, [
    warehouseId,
    refreshKey,
    page,
    limit,
    movementType,
    selectedIngredient,
    fromDate,
    toDate,
    retryKey,
  ]);

  // ====================================================
  // CURRENT-PAGE TEXT SEARCH
  // ====================================================

  const query = searchTerm.trim().toLowerCase();

  const filteredItems = items.filter((item) =>
    [
      item.ingredient?.name ?? "",
      item.ingredientId,
      item.referenceId ?? "",
      item.reason ?? "",
    ].some((value) =>
      value.toLowerCase().includes(query),
    ),
  );

  function clearFilters(): void {
    setMovementType("");
    setSelectedIngredient(null);
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
      {/* HEADER */}

      <div className="flex items-start justify-between gap-4 border-b border-zinc-800 p-4">
        <div>
          <p className="text-xs font-semibold text-zinc-300">
            Warehouse Movements
          </p>

          <p className="mt-1 text-[10px] text-zinc-600">
            Receipts, transfers, corrections, and removals
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setRetryKey((current) => current + 1)
          }
          disabled={loading}
          className={inventoryButtonClass}
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${
              loading ? "animate-spin" : ""
            }`}
          />
          Refresh
        </button>
      </div>

      {/* FILTERS */}

      <div className="grid gap-4 border-b border-zinc-800 p-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1.5">
          <label
            htmlFor="movement-type"
            className={inventoryLabelClass}
          >
            Movement Type
          </label>

          <select
            id="movement-type"
            value={movementType}
            onChange={(event) => {
              setMovementType(
                event.target.value as MovementType | "",
              );
              setPage(1);
            }}
            className={`${inventoryButtonClass} w-full`}
          >
            <option value="">All Movements</option>

            {MOVEMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <p className={inventoryLabelClass}>
            Ingredient
          </p>

          {selectedIngredient ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2 text-xs text-violet-300">
              <span className="truncate">
                {selectedIngredient.name}
              </span>

              <button
                type="button"
                aria-label="Clear ingredient filter"
                onClick={() => {
                  setSelectedIngredient(null);
                  setPage(1);
                }}
                className="shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <InventoryIngredientSearch
              ingredients={ingredients}
              loading={ingredientsLoading}
              error={ingredientsError}
              onRetry={onRetryIngredients}
              activeOnly={false}
              onChoose={(ingredient) => {
                setSelectedIngredient(ingredient);
                setPage(1);
              }}
            />
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="movement-from"
            className={inventoryLabelClass}
          >
            From Date
          </label>

          <input
            id="movement-from"
            type="date"
            value={fromDate}
            onChange={(event) => {
              setFromDate(event.target.value);
              setPage(1);
            }}
            className={`${inventoryButtonClass} w-full [color-scheme:dark]`}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="movement-to"
            className={inventoryLabelClass}
          >
            To Date
          </label>

          <input
            id="movement-to"
            type="date"
            value={toDate}
            onChange={(event) => {
              setToDate(event.target.value);
              setPage(1);
            }}
            className={`${inventoryButtonClass} w-full [color-scheme:dark]`}
          />
        </div>
      </div>

      <div className="flex items-start justify-between gap-3 border-b border-zinc-800 px-4 py-2">
        <p className="text-[10px] text-zinc-600">
          Dates use local time. Header search filters
          the current movement page.
        </p>

        <button
          type="button"
          onClick={clearFilters}
          className="shrink-0 text-[10px] text-zinc-500 hover:text-zinc-200"
        >
          Clear Filters
        </button>
      </div>

      {/* CONTENT */}

      {error ? (
        <div className="p-12 text-center">
          <p
            role="alert"
            className="text-xs text-rose-400"
          >
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              setRetryKey((current) => current + 1)
            }
            className={`${inventoryButtonClass} mt-4`}
          >
            Retry
          </button>
        </div>
      ) : loading ? (
        <div
          role="status"
          className="flex min-h-[250px] items-center justify-center gap-2 text-xs text-zinc-600"
        >
          <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
          Loading movements...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center">
          <p className="font-mono text-xs text-zinc-600">
            NO MOVEMENTS FOUND
          </p>

          <p className="mt-2 text-xs text-zinc-700">
            Seeded balances have no movement history.
            Receipts and edits create entries.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-zinc-800/80 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-600">
                {[
                  "Ingredient",
                  "Movement",
                  "Quantity Change",
                  "Reference / Reason",
                  "Recorded At",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-3.5"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-900">
              {filteredItems.map((item) => (
                <tr
                  key={item.id}
                  className="transition hover:bg-zinc-900/60"
                >
                  <td className="px-5 py-4">
                    <p className="text-[13px] font-semibold text-zinc-100">
                      {item.ingredient?.name ??
                        item.ingredientId}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1.5 font-mono text-[9px] text-zinc-400">
                      {item.movementType.replaceAll(
                        "_",
                        " ",
                      )}
                    </span>
                  </td>

                  <td
                    className={`px-5 py-4 font-mono text-[13px] font-semibold ${
                      Number(item.quantityChange) >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {Number(item.quantityChange) > 0
                      ? "+"
                      : ""}

                    {formatStockQuantity(
                      item.quantityChange,
                    )}{" "}

                    <span className="text-[10px] font-normal text-zinc-600">
                      {item.ingredient?.uom ?? ""}
                    </span>
                  </td>

                  <td className="max-w-[300px] break-words px-5 py-4">
                    <p className="font-mono text-[11px] text-zinc-400">
                      {item.referenceId ?? "—"}
                    </p>

                    <p className="mt-1 text-[11px] text-zinc-600">
                      {item.reason ??
                        "No reason recorded"}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 font-mono text-[11px] text-zinc-500">
                    {new Date(
                      item.createdAt,
                    ).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINATION */}

      <InventoryPagination
        page={page}
        limit={limit}
        total={pagination.total}
        loading={loading || Boolean(error)}
        onPageChange={setPage}
        onLimitChange={(value) => {
          setLimit(value);
          setPage(1);
        }}
      />
    </div>
  );
}