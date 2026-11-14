"use client";

import { useState } from "react";
import { Loader2, Truck } from "lucide-react";

import {
  inventoryInputClass,
  inventoryLabelClass,
} from "@/elements/rawmaterial/InventoryShared";

import type {
  OperationsStockTransfer,
  ShipTransferInput,
} from "@/utils/types/inventory";

interface Props {
  transfer: OperationsStockTransfer;
  saving: boolean;
  disabled: boolean;
  onSubmit: (input: ShipTransferInput) => Promise<void>;
}

export default function DispatchForm({
  transfer,
  saving,
  disabled,
  onSubmit,
}: Props) {
  const [quantities, setQuantities] = useState<Record<string, string>>(
    () => Object.fromEntries(
      transfer.items.map((item) => [
        item.id,
        String(item.approvedQty ?? ""),
      ]),
    ),
  );

  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setError("");

        if (!confirmed || transfer.items.length === 0) {
          setError("Confirm that this shipment is ready for dispatch.");
          return;
        }

        for (const item of transfer.items) {
          const raw = quantities[item.id] ?? "";
          const value = Number(raw);

          if (
            !/^\d+(\.\d{1,4})?$/.test(raw) ||
            !Number.isFinite(value) ||
            value <= 0 ||
            value > Number(item.approvedQty ?? 0) ||
            value > 99999999.9999
          ) {
            setError(
              `Enter a positive quantity no greater than the approved amount for ${
                item.ingredient?.name ?? item.ingredientId
              }, with up to four decimal places.`,
            );
            return;
          }
        }

        void onSubmit({
          items: transfer.items.map((item) => ({
            transferItemId: item.id,
            shippedQty: Number(quantities[item.id]),
          })),
        });
      }}
      className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4"
    >
      <p className={inventoryLabelClass}>Dispatch Quantities</p>

      {transfer.items.map((item) => (
        <div key={item.id} className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-zinc-200">
              {item.ingredient?.name ?? item.ingredientId}
            </p>
            <p className="mt-1 text-[10px] text-zinc-500">
              Approved: {item.approvedQty ?? "—"} {item.ingredient?.uom}
            </p>
          </div>

          <input
            type="number"
            aria-label={`Dispatch quantity for ${
              item.ingredient?.name ?? item.ingredientId
            }`}
            min="0.0001"
            max={Math.min(Number(item.approvedQty ?? 0), 99999999.9999)}
            step="0.0001"
            required
            value={quantities[item.id] ?? ""}
            disabled={saving || disabled}
            onChange={(event) =>
              setQuantities((current) => ({
                ...current,
                [item.id]: event.target.value,
              }))
            }
            className={`${inventoryInputClass} max-w-[120px]`}
          />
        </div>
      ))}

      <label className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-zinc-400">
        <input
          type="checkbox"
          checked={confirmed}
          disabled={saving || disabled}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-0.5 accent-emerald-500"
        />
        I confirm these quantities are being dispatched. Shipping deducts
        warehouse stock and moves it into transit.
      </label>

      {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}

      <button
        type="submit"
        disabled={saving || disabled || !confirmed}
        className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Truck className="h-4 w-4" />
        )}
        Confirm Dispatch
      </button>
    </form>
  );
}