"use client";

import { useRef, useState, type FormEvent } from "react";

import { Database, Loader2, Trash2, Wheat } from "lucide-react";

import type { Ingredient } from "@/lib/catalog-api";
import type { WarehouseStockView } from "@/utils/types/inventory";

import {
  bulkReceiveWarehouseStock,
  receiveWarehouseStock,
} from "@/lib/inventory-api";

import {
  InventoryDrawerShell,
  InventoryIngredientSearch,
  inventoryError,
  inventoryInputClass,
  inventoryLabelClass,
  inventoryPrimaryClass,
  validStockQuantity,
} from "./InventoryShared";

interface ReceiptLine {
  ingredient: Ingredient;
  quantity: string;
}

interface AddInventoryDrawerProps {
  warehouseId: string;
  ingredients: Ingredient[];
  ingredientsLoading: boolean;
  ingredientsError: string;
  onRetryIngredients: () => void;
  onClose: () => void;
  onSaved: (message: string) => void;
  bulk?: boolean;
  stock?: WarehouseStockView | null;
}

export default function AddInventoryDrawer({
  warehouseId,
  ingredients,
  ingredientsLoading,
  ingredientsError,
  onRetryIngredients,
  onClose,
  onSaved,
  bulk = false,
  stock = null,
}: AddInventoryDrawerProps) {
  const [lines, setLines] = useState<ReceiptLine[]>(() =>
    stock
      ? [
          {
            ingredient: stock.ingredient ?? {
              id: stock.ingredientId,
              name: stock.ingredientId,
              uom: "",
              isActive: true,
            },
            quantity: "",
          },
        ]
      : [],
  );

  const [referenceId, setReferenceId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submittingRef = useRef(false);

  function addIngredient(ingredient: Ingredient): void {
    setError("");

    setLines((current) => {
      const exists = current.some(
        (line) => line.ingredient.id === ingredient.id,
      );

      if (exists) return current;

      const line: ReceiptLine = {
        ingredient,
        quantity: "",
      };

      return bulk ? [...current, line] : [line];
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (submittingRef.current) return;

    if (lines.length === 0) {
      setError("Search and add at least one ingredient.");
      return;
    }

    if (lines.some((line) => !validStockQuantity(line.quantity, true))) {
      setError("Enter positive quantities with up to four decimal places.");
      return;
    }

    submittingRef.current = true;
    setSaving(true);
    setError("");

    try {
      const receiptItems = lines.map((line) => ({
        ingredientId: line.ingredient.id,
        quantity: Number(line.quantity),
        ...(referenceId.trim() ? { referenceId: referenceId.trim() } : {}),
      }));

      if (bulk) {
        await bulkReceiveWarehouseStock({
          warehouseId,
          items: receiptItems,
        });
      } else {
        await receiveWarehouseStock({
          warehouseId,
          ...receiptItems[0]!,
        });
      }

      onSaved(
        bulk
          ? `${lines.length} ingredients received successfully.`
          : "Warehouse stock received successfully.",
      );
    } catch (caught: unknown) {
      setError(
        `${inventoryError(caught)} If the request timed out, refresh stock and history before retrying.`,
      );
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <InventoryDrawerShell
      title={
        stock
          ? "Restock Item"
          : bulk
            ? "Add Multiple Stock Items"
            : "Add Stock Item"
      }
      subtitle="WAREHOUSE STOCK REGISTRATION"
      saving={saving}
      error={error}
      onClose={onClose}
      wide={bulk}
    >
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-1 flex-col gap-4"
      >
        {!stock && (bulk || lines.length === 0) && (
          <InventoryIngredientSearch
            ingredients={ingredients}
            loading={ingredientsLoading}
            error={ingredientsError}
            onRetry={onRetryIngredients}
            onChoose={addIngredient}
            excludedIds={lines.map((line) => line.ingredient.id)}
            disabled={saving}
          />
        )}

        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <span className="font-mono text-[9px] uppercase tracking-wider text-violet-300">
              Stock Items
            </span>

            <span className="rounded-full border border-violet-400/15 bg-violet-400/10 px-2 py-0.5 font-mono text-[8px] font-bold text-violet-300">
              {lines.length}
            </span>
          </div>

          {lines.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Wheat className="mx-auto h-5 w-5 text-violet-400/60" />

              <p className="mt-3 text-xs font-semibold text-zinc-500">
                No stock items added
              </p>

              <p className="mt-1 text-[10px] text-zinc-700">
                Search above to add stock items.
              </p>
            </div>
          ) : (
            <div className="p-4">
              <div className="mb-1 grid grid-cols-[minmax(0,1fr)_90px_32px] gap-2 px-2 pb-2 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-zinc-700">
                <span>Ingredient</span>
                <span className="text-right">Quantity</span>
                <span />
              </div>

              {lines.map((line, index) => (
                <div
                  key={line.ingredient.id}
                  className="grid grid-cols-[minmax(0,1fr)_90px_32px] items-center gap-2 border-b border-zinc-900 px-2 py-3 last:border-b-0"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="font-mono text-[8px] font-bold text-violet-400">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-zinc-200">
                        {line.ingredient.name}
                      </p>

                      <p className="mt-0.5 font-mono text-[8px] text-zinc-600">
                        {line.ingredient.uom}
                      </p>
                    </div>
                  </div>

                  <input
                    aria-label={`Received quantity for ${line.ingredient.name}`}
                    type="number"
                    min="0.0001"
                    max="99999999.9999"
                    step="0.0001"
                    required
                    disabled={saving}
                    value={line.quantity}
                    onChange={(event) =>
                      setLines((current) =>
                        current.map((row) =>
                          row.ingredient.id === line.ingredient.id
                            ? {
                                ...row,
                                quantity: event.target.value,
                              }
                            : row,
                        ),
                      )
                    }
                    className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 text-right font-mono text-xs text-violet-200 outline-none focus:border-violet-400/30 disabled:opacity-40"
                  />

                  {!stock && (
                    <button
                      type="button"
                      title="Remove ingredient"
                      aria-label={`Remove ${line.ingredient.name}`}
                      disabled={saving}
                      onClick={() =>
                        setLines((current) =>
                          current.filter(
                            (row) => row.ingredient.id !== line.ingredient.id,
                          ),
                        )
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-zinc-700 transition hover:border-rose-400/20 hover:bg-rose-400/10 hover:text-rose-300 disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="receipt-reference" className={inventoryLabelClass}>
            Reference ID (optional)
          </label>

          <input
            id="receipt-reference"
            value={referenceId}
            onChange={(event) => setReferenceId(event.target.value)}
            maxLength={100}
            disabled={saving}
            placeholder="Purchase or delivery reference"
            className={inventoryInputClass}
          />
        </div>

        <div className="space-y-2 rounded-xl border border-zinc-800/80 bg-zinc-950 p-4 text-[11px] text-zinc-500">
          <p className="flex items-center gap-2 font-semibold text-white">
            <Database className="h-3.5 w-3.5 text-emerald-400" />
            Records stock physically received
          </p>

          <p>
            Quantities use Catalog units. Each receipt creates a PURCHASE
            movement.
            {bulk && " All receipt lines are saved in one transaction."}
          </p>
        </div>

        <div className="mt-auto flex gap-3 border-t border-zinc-800 pt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 py-2 text-xs text-zinc-300 disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving || lines.length === 0}
            className={`${inventoryPrimaryClass} flex-1`}
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}

            {saving ? "Saving..." : bulk ? "Add All Stock" : "Add Stock"}
          </button>
        </div>
      </form>
    </InventoryDrawerShell>
  );
}
