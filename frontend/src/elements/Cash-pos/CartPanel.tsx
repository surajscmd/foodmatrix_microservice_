"use client";

import { useState, type FormEvent } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import type { CreateOrderInput, OrderType } from "@/lib/order-api";
import type { RegisterMenuItem } from "./MenuCatalog";
import {
  cashierOrderItem,
  itemPriceInCents,
  type CartModifier,
} from "./cashier-modifiers";

export interface CartLine {
  id: string;
  item: RegisterMenuItem;
  quantity: number;
  modifiers: CartModifier[];
}

interface Props {
  lines: CartLine[];
  busy: boolean;
  uncertain: boolean;
  formatMoney: (amount: number) => string;
  customizableItems: ReadonlySet<string>;
  onEditOptions: (line: CartLine) => void;
  onQuantityChange: (lineId: string, delta: number) => void;
  onSubmit: (order: CreateOrderInput) => void;
  onDiscard: () => void;
}

const orderTypes: { value: OrderType; label: string }[] = [
  { value: "TAKEAWAY", label: "Takeaway" },
  { value: "DINE_IN", label: "Dine-in" },
  { value: "DELIVERY", label: "Delivery" },
];

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300";
const field = `mt-1 h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white ${focus}`;
const stepper = `grid size-9 place-items-center rounded-lg border border-zinc-700 bg-zinc-900 text-white enabled:hover:bg-zinc-800 disabled:opacity-50 ${focus}`;

export default function CartPanel({
  lines,
  busy,
  uncertain,
  formatMoney,
  customizableItems,
  onEditOptions,
  onQuantityChange,
  onSubmit,
  onDiscard,
}: Props) {
  const [type, setType] = useState<OrderType>("TAKEAWAY");

  const estimate =
    lines.reduce(
      (sum, { item, quantity, modifiers }) =>
        sum + itemPriceInCents(item.price, modifiers) * quantity,
      0,
    ) / 100;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || uncertain || lines.length === 0) return;

    const form = new FormData(event.currentTarget);
    const phone = String(form.get("phone") ?? "").trim();
    const items = lines.map(({ item, quantity, modifiers }) =>
      cashierOrderItem(item.id, quantity, modifiers),
    );

    if (type === "DINE_IN") {
      onSubmit({
        type,
        phone,
        items,
        tableId: String(form.get("table") ?? "").trim(),
      });
    } else {
      onSubmit({ type, phone, items });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 p-4">
      {lines.length === 0 && !uncertain ? (
        <div className="rounded-xl border border-violet-400/30 bg-violet-950/40 p-5 text-center">
          <span className="mx-auto grid size-10 place-items-center rounded-xl bg-violet-300 text-violet-950">
            <ShoppingBag aria-hidden="true" className="size-5" />
          </span>
          <p className="mt-2 text-sm font-medium text-white">
            Start a new order
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Tap an item in the menu to add it.
          </p>
        </div>
      ) : (
        <fieldset disabled={busy || uncertain} className="min-w-0 space-y-4">
          <legend className="sr-only">New order</legend>

          <ul className="max-h-72 divide-y divide-zinc-800 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/50">
            {lines.map((line) => {
              const { id, item, quantity, modifiers } = line;
              return (
                <li
                  key={id}
                  className="flex items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium text-white">
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs tabular-nums text-zinc-400">
                      {formatMoney(
                        (itemPriceInCents(item.price, modifiers) * quantity) /
                          100,
                      )}
                    </p>
                    {modifiers.length > 0 && (
                      <p className="mt-1 break-words text-xs text-emerald-200">
                        {modifiers.map(({ name }) => name).join(" · ")}
                      </p>
                    )}
                    {customizableItems.has(item.id) && (
                      <button
                        type="button"
                        aria-label={`Edit options for ${item.name}`}
                        onClick={() => onEditOptions(line)}
                        className={`mt-1 rounded-sm text-xs font-medium text-violet-200 underline-offset-2 hover:underline ${focus}`}
                      >
                        Edit options
                      </button>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Remove one ${item.name}`}
                      onClick={() => onQuantityChange(id, -1)}
                      className={stepper}
                    >
                      <Minus aria-hidden="true" className="size-4" />
                    </button>
                    <span className="min-w-6 text-center text-sm tabular-nums">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={`Add one ${item.name}`}
                      disabled={quantity >= 99}
                      onClick={() => onQuantityChange(id, 1)}
                      className={stepper}
                    >
                      <Plus aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div
            role="group"
            aria-label="Order type"
            className="grid grid-cols-3 gap-1.5"
          >
            {orderTypes.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={type === value}
                onClick={() => setType(value)}
                className={`min-h-10 rounded-lg border px-1 text-xs font-semibold disabled:opacity-50 ${focus} ${
                  type === value
                    ? "border-violet-400/50 bg-violet-400/15 text-violet-200"
                    : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-violet-400/40"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {type === "DINE_IN" && (
            <label className="block text-xs font-medium text-zinc-300">
              Table
              <input
                name="table"
                required
                pattern={"\\S.*"}
                maxLength={50}
                placeholder="e.g. T04"
                className={field}
              />
            </label>
          )}

          <label className="block text-xs font-medium text-zinc-300">
            Customer phone
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              minLength={7}
              maxLength={20}
              pattern={"[0-9+\\-\\s]{7,20}"}
              title="Use 7–20 characters: digits, spaces, + or -."
              className={field}
            />
          </label>

          <div className="flex items-center justify-between gap-3 rounded-xl bg-violet-400/10 px-3 py-2.5">
            <span className="text-sm text-violet-200">Estimated total</span>
            <strong className="text-lg tabular-nums text-white">
              {formatMoney(estimate)}
            </strong>
          </div>

          <button
            type="submit"
            disabled={lines.length === 0}
            className={`min-h-11 w-full rounded-xl bg-violet-300 px-3 text-sm font-semibold text-violet-950 enabled:hover:bg-violet-200 disabled:opacity-50 ${focus}`}
          >
            {busy ? "Working…" : "Place & confirm"}
          </button>
        </fieldset>
      )}

      {uncertain && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-200">
          <p>Check Open orders below before starting another order.</p>
          <button
            type="button"
            disabled={busy}
            onClick={onDiscard}
            className={`mt-2 min-h-9 rounded-lg text-sm font-semibold underline disabled:opacity-50 ${focus}`}
          >
            Clear draft after checking
          </button>
        </div>
      )}
    </form>
  );
}
