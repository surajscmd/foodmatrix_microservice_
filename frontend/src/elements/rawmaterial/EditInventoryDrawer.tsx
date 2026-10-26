"use client";

import {
  useRef,
  useState,
  type FormEvent,
} from "react";

import { Loader2 } from "lucide-react";

import { adjustWarehouseStock } from "@/lib/inventory-api";

import type { WarehouseStockView } from "@/utils/types/inventory";

import {
  InventoryDrawerShell,
  formatStockQuantity,
  inventoryError,
  inventoryInputClass,
  inventoryLabelClass,
  inventoryPrimaryClass,
  validStockQuantity,
} from "./InventoryShared";

interface EditInventoryDrawerProps {
  warehouseId: string;
  item: WarehouseStockView;
  onClose: () => void;
  onSaved: (message: string) => void;
}

export default function EditInventoryDrawer({
  warehouseId,
  item,
  onClose,
  onSaved,
}: EditInventoryDrawerProps) {
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submittingRef = useRef(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (submittingRef.current) return;

    if (!validStockQuantity(quantity, false)) {
      setError(
        "Enter a non-zero quantity change with up to four decimal places.",
      );
      return;
    }

    if (!reason.trim()) {
      setError("An adjustment reason is required.");
      return;
    }

    if (
      Number(item.quantityOnHand) + Number(quantity) < 0
    ) {
      setError(
        "The reduction exceeds the displayed stock balance.",
      );
      return;
    }

    submittingRef.current = true;
    setSaving(true);
    setError("");

    try {
      await adjustWarehouseStock(
        warehouseId,
        item.ingredientId,
        {
          quantityChange: Number(quantity),
          reason: reason.trim(),
        },
      );

      onSaved("Stock edited successfully.");
    } catch (caught: unknown) {
      setError(
        `${inventoryError(caught)} If this timed out, refresh stock and history before retrying.`,
      );
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <InventoryDrawerShell
      title="Edit Stock"
      subtitle="PHYSICAL STOCK CORRECTION"
      saving={saving}
      error={error}
      onClose={onClose}
    >
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-1 flex-col gap-4"
      >
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-sm font-semibold text-white">
            {item.ingredient?.name ?? item.ingredientId}
          </p>

          <p className="mt-2 text-[11px] text-zinc-500">
            Current balance{" "}
            <span className="ml-2 font-mono text-emerald-400">
              {formatStockQuantity(item.quantityOnHand)}{" "}
              {item.ingredient?.uom ?? ""}
            </span>
          </p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="edit-stock-quantity"
            className={inventoryLabelClass}
          >
            Quantity Change
          </label>

          <input
            id="edit-stock-quantity"
            type="number"
            min="-99999999.9999"
            max="99999999.9999"
            step="0.0001"
            required
            disabled={saving}
            value={quantity}
            onChange={(event) =>
              setQuantity(event.target.value)
            }
            placeholder="e.g. -5 or +10"
            className={inventoryInputClass}
          />

          <p className="text-[10px] text-zinc-600">
            Enter an increase or decrease, not the final balance.
          </p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="edit-stock-reason"
            className={inventoryLabelClass}
          >
            Reason
          </label>

          <textarea
            id="edit-stock-reason"
            required
            maxLength={255}
            rows={3}
            disabled={saving}
            value={reason}
            onChange={(event) =>
              setReason(event.target.value)
            }
            placeholder="Explain the physical stock correction..."
            className={`${inventoryInputClass} resize-none`}
          />
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-500">
          Estimated balance after adjustment:{" "}
          <span className="font-mono text-zinc-200">
            {validStockQuantity(quantity, false)
              ? formatStockQuantity(
                  Number(item.quantityOnHand) +
                    Number(quantity),
                )
              : "—"}{" "}
            {item.ingredient?.uom ?? ""}
          </span>

          <p className="mt-2 text-[10px] text-zinc-600">
            The backend checks the latest balance and records
            an ADJUSTMENT movement.
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
            disabled={saving}
            className={`${inventoryPrimaryClass} flex-1`}
          >
            {saving && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}

            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </InventoryDrawerShell>
  );
}