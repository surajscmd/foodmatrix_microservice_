"use client";

import { useState, type FormEvent } from "react";
import type { ReceiveTransferInput, StockTransfer } from "@/lib/inventory-api";
import { field, primary, quantity, validQuantity } from "./inventory-view";

export default function InventoryReceiveForm({
  transfer,
  ingredientLabel,
  busy,
  error,
  onSubmit,
}: {
  transfer: StockTransfer;
  ingredientLabel: (id: string) => string;
  busy: boolean;
  error: string;
  onSubmit: (payload: ReceiveTransferInput) => void;
}) {
  const [localError, setLocalError] = useState("");
  const items = transfer.items ?? [];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !items.length) return;
    const form = new FormData(event.currentTarget);
    const receipt: ReceiveTransferInput["items"] = [];
    for (const item of items) {
      const input = String(form.get(item.id) ?? "").trim();
      const receivedQty = Number(input);
      const reason = String(form.get(`reason-${item.id}`) ?? "").trim();
      if (
        !validQuantity(input) ||
        receivedQty > Number(item.shippedQty) ||
        (receivedQty < Number(item.shippedQty) && !reason)
      ) {
        setLocalError(
          "Enter a positive quantity up to the amount shipped for each line. Add a reason for any short receipt.",
        );
        return;
      }
      receipt.push({
        transferItemId: item.id,
        receivedQty,
        ...(reason ? { reason } : {}),
      });
    }
    setLocalError("");
    onSubmit({ items: receipt });
  }

  return (
    <form onSubmit={submit} className="space-y-3 p-4">
      <p className="text-sm text-zinc-300">
        Enter what actually arrived. The current receiving API requires a
        positive amount for every line. Contact warehouse staff if a line is
        entirely missing.
      </p>
      {items.map((item) => (
        <div
          key={item.id}
          className="grid gap-2 rounded-lg border border-zinc-700 p-3 sm:grid-cols-2"
        >
          <label className="grid gap-1 text-xs text-zinc-300">
            {item.ingredient?.name ?? ingredientLabel(item.ingredientId)} ·{" "}
            {quantity(item.shippedQty ?? 0)} shipped
            <input
              required
              name={item.id}
              inputMode="decimal"
              disabled={busy}
              className={field}
            />
          </label>
          <label className="grid gap-1 text-xs text-zinc-300">
            Reason if short
            <input
              name={`reason-${item.id}`}
              maxLength={500}
              disabled={busy}
              className={field}
            />
          </label>
        </div>
      ))}
      {!items.length && (
        <p role="status" className="text-sm text-zinc-300">
          There are no shipment lines to receive.
        </p>
      )}
      {(localError || error) && (
        <p role="alert" className="text-sm text-rose-200">
          {localError || error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || !items.length}
        className={primary}
      >
        {busy ? "Saving…" : "Confirm receipt"}
      </button>
    </form>
  );
}
