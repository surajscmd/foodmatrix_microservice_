"use client";

import {
  useRef,
  useState,
  type FormEvent,
} from "react";

import { Loader2, Trash2 } from "lucide-react";

import { deleteWarehouseStockRecord } from "@/lib/inventory-api";

import type { WarehouseStockView } from "@/utils/types/inventory";

import {
  InventoryDrawerShell,
  formatStockQuantity,
  inventoryError,
  inventoryInputClass,
  inventoryLabelClass,
} from "./InventoryShared";

interface DeleteInventoryDrawerProps {
  warehouseId: string;
  item: WarehouseStockView;
  onClose: () => void;
  onSaved: (message: string) => void;
}

export default function DeleteInventoryDrawer({
  warehouseId,
  item,
  onClose,
  onSaved,
}: DeleteInventoryDrawerProps) {
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submittingRef = useRef(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (submittingRef.current) return;

    if (!confirmed || reason.trim().length < 3) {
      setError(
        "Confirm removal and enter a reason of at least 3 characters.",
      );
      return;
    }

    submittingRef.current = true;
    setSaving(true);
    setError("");

    try {
      await deleteWarehouseStockRecord(
        warehouseId,
        item.ingredientId,
        reason.trim(),
      );

      onSaved("Stock record deleted. Audit history retained.");
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
      title="Delete Stock"
      subtitle="WAREHOUSE RECORD REMOVAL"
      saving={saving}
      error={error}
      onClose={onClose}
    >
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-1 flex-col gap-4"
      >
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
          <p className="text-sm font-semibold text-white">
            {item.ingredient?.name ?? item.ingredientId}
          </p>

          <p className="mt-2 text-xs leading-relaxed text-rose-300">
            This removes the warehouse record and its entire
            remaining balance:{" "}
            {formatStockQuantity(item.quantityOnHand)}{" "}
            {item.ingredient?.uom ?? ""}.
          </p>

          <p className="mt-2 text-[10px] text-zinc-500">
            The Catalog ingredient and previous audit movements
            remain. A removal adjustment is recorded.
          </p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="delete-stock-reason"
            className={inventoryLabelClass}
          >
            Removal Reason
          </label>

          <textarea
            id="delete-stock-reason"
            required
            minLength={3}
            maxLength={200}
            rows={3}
            disabled={saving}
            value={reason}
            onChange={(event) =>
              setReason(event.target.value)
            }
            className={inventoryInputClass}
          />
        </div>

        <label className="flex items-start gap-2 text-xs text-zinc-400">
          <input
            type="checkbox"
            required
            disabled={saving}
            checked={confirmed}
            onChange={(event) =>
              setConfirmed(event.target.checked)
            }
            className="mt-0.5 accent-rose-500"
          />

          I confirm removal of this stock record and its balance.
        </label>

        <div className="mt-auto flex gap-3 border-t border-zinc-800 pt-6">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 py-2 text-xs text-zinc-300 disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving || !confirmed}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500 py-2 text-xs font-semibold text-white transition hover:bg-rose-400 disabled:opacity-40"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}

            {saving ? "Deleting..." : "Delete Stock"}
          </button>
        </div>
      </form>
    </InventoryDrawerShell>
  );
}