"use client";

import { useMemo, useState } from "react";
import { Filter, Loader2, Search, X } from "lucide-react";

import {
  inventoryInputClass,
  inventoryLabelClass,
} from "@/elements/rawmaterial/InventoryShared";

import type {
  Ingredient,
  InventoryRestaurant,
  MovementType,
  StockAuditFilterValues,
} from "@/utils/types/inventory";

interface Props {
  value: StockAuditFilterValues;
  restaurants: InventoryRestaurant[];
  ingredients: Ingredient[];
  restaurantsLoading: boolean;
  ingredientsLoading: boolean;
  restaurantsError: string;
  ingredientsError: string;
  loading: boolean;
  onRetrySources: () => void;
  onApply: (filters: StockAuditFilterValues) => void;
}

const EMPTY_FILTERS: StockAuditFilterValues = {
  location: "WAREHOUSE",
  restaurantId: "",
  ingredientId: "",
  movementType: "",
  fromDate: "",
  toDate: "",
};

export default function StockAuditFilters({
  value,
  restaurants,
  ingredients,
  restaurantsLoading,
  ingredientsLoading,
  restaurantsError,
  ingredientsError,
  loading,
  onRetrySources,
  onApply,
}: Props) {
  const [draft, setDraft] = useState<StockAuditFilterValues>(
    () => ({ ...value }),
  );

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const selectedIngredient = ingredients.find(
    (item) => item.id === draft.ingredientId,
  );

  const matches = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (query.length < 2) return [];

    return ingredients.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query),
    );
  }, [ingredients, search]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setError("");

        if (
          draft.location === "RESTAURANT" &&
          !draft.restaurantId
        ) {
          setError("Select a restaurant.");
          return;
        }

        if (
          draft.fromDate &&
          draft.toDate &&
          draft.fromDate > draft.toDate
        ) {
          setError("From date cannot be later than To date.");
          return;
        }

        onApply({ ...draft });
      }}
      className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4"
    >
      <div className="flex items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-emerald-400" />
        <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          Audit Filters
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1.5">
          <label htmlFor="audit-location" className={inventoryLabelClass}>
            Location
          </label>

          <select
            id="audit-location"
            value={draft.location}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                location: event.target.value as
                  | "WAREHOUSE"
                  | "RESTAURANT",
              }))
            }
            className={inventoryInputClass}
          >
            <option value="WAREHOUSE">Warehouse</option>
            <option value="RESTAURANT">Restaurant</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="audit-movement" className={inventoryLabelClass}>
            Movement
          </label>

          <select
            id="audit-movement"
            value={draft.movementType}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                movementType: event.target.value as MovementType | "",
              }))
            }
            className={inventoryInputClass}
          >
            <option value="">All Movements</option>
            <option value="PURCHASE">Purchase</option>
            <option value="TRANSFER_IN">Transfer In</option>
            <option value="TRANSFER_OUT">Transfer Out</option>
            <option value="ADJUSTMENT">Adjustment</option>
            <option value="WASTE">Waste</option>
            <option value="POS_SALE">POS Sale</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="audit-from" className={inventoryLabelClass}>
            From Date
          </label>

          <input
            id="audit-from"
            type="date"
            value={draft.fromDate}
            max={draft.toDate || undefined}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                fromDate: event.target.value,
              }))
            }
            className={inventoryInputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="audit-to" className={inventoryLabelClass}>
            To Date
          </label>

          <input
            id="audit-to"
            type="date"
            value={draft.toDate}
            min={draft.fromDate || undefined}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                toDate: event.target.value,
              }))
            }
            className={inventoryInputClass}
          />
        </div>
      </div>

      {draft.location === "RESTAURANT" && (
        <div className="space-y-1.5 sm:max-w-md">
          <label htmlFor="audit-restaurant" className={inventoryLabelClass}>
            Restaurant
          </label>

          <select
            id="audit-restaurant"
            value={draft.restaurantId}
            disabled={restaurantsLoading}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                restaurantId: event.target.value,
              }))
            }
            className={inventoryInputClass}
          >
            <option value="">
              {restaurantsLoading
                ? "Loading restaurants..."
                : "Select restaurant"}
            </option>

            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>

          {restaurantsError && (
            <p className="text-[11px] text-rose-300">
              {restaurantsError}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="audit-stock-search" className={inventoryLabelClass}>
          Stock Item
        </label>

        {draft.ingredientId ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5">
            <div>
              <p className="text-xs font-medium text-zinc-200">
                {selectedIngredient?.name ?? "Selected stock item"}
              </p>

              <p className="mt-1 break-all font-mono text-[9px] text-zinc-500">
                {draft.ingredientId}
              </p>
            </div>

            <button
              type="button"
              aria-label="Clear selected stock item"
              onClick={() => {
                setDraft((current) => ({
                  ...current,
                  ingredientId: "",
                }));
                setSearch("");
              }}
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />

              <input
                id="audit-stock-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search stock items to filter..."
                autoComplete="off"
                className={`${inventoryInputClass} pl-9`}
              />
            </div>

            <p className="text-[10px] text-zinc-600">
              Type at least 2 characters and select a result.
              Leave empty to include all stock items.
            </p>

            {ingredientsLoading ? (
              <p className="flex items-center gap-2 text-[11px] text-zinc-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading stock items...
              </p>
            ) : ingredientsError ? (
              <p className="text-[11px] text-rose-300">
                {ingredientsError}
              </p>
            ) : search.trim().length >= 2 ? (
              <div className="max-h-56 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950">
                {matches.length === 0 ? (
                  <p className="p-4 text-xs text-zinc-500">
                    No matching stock items.
                  </p>
                ) : (
                  <>
                    {matches.slice(0, 20).map((ingredient) => (
                      <button
                        key={ingredient.id}
                        type="button"
                        onClick={() => {
                          setDraft((current) => ({
                            ...current,
                            ingredientId: ingredient.id,
                          }));
                          setSearch("");
                        }}
                        className="flex w-full items-center justify-between gap-3 border-b border-zinc-800/50 px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-zinc-900"
                      >
                        <div>
                          <p className="text-xs text-zinc-200">
                            {ingredient.name}
                          </p>
                          <p className="mt-1 font-mono text-[9px] text-zinc-600">
                            {ingredient.isActive ? "Active" : "Inactive"}
                          </p>
                        </div>
                        <span className="font-mono text-[10px] text-emerald-400">
                          {ingredient.uom}
                        </span>
                      </button>
                    ))}

                    {matches.length > 20 && (
                      <p className="p-3 text-[10px] text-zinc-500">
                        Showing 20 of {matches.length} matches.
                        Refine your search.
                      </p>
                    )}
                  </>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>

      {(restaurantsError || ingredientsError) && (
        <button
          type="button"
          onClick={onRetrySources}
          disabled={restaurantsLoading || ingredientsLoading}
          className="text-[11px] text-cyan-300 hover:text-cyan-200 disabled:opacity-50"
        >
          Retry loading filter options
        </button>
      )}

      {error && (
        <p role="alert" className="text-xs text-rose-300">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 border-t border-zinc-800 pt-4">
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            const next = { ...EMPTY_FILTERS };

            setDraft(next);
            setSearch("");
            setError("");
            onApply(next);
          }}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-zinc-400 transition-colors hover:text-zinc-200 disabled:opacity-50"
        >
          Reset
        </button>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Apply Filters
        </button>
      </div>
    </form>
  );
}