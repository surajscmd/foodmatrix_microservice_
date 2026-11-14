"use client";

import { useState } from "react";
import { ChevronDown, ClipboardList, Minus, Plus, Send } from "lucide-react";
import type { CartItem } from "./types";

interface Props {
  lines: CartItem[];
  busy: boolean;
  canSend: boolean;
  formatMoney: (amount: number) => string;
  onChange: (itemId: string, delta: number) => void;
  onSend: () => void;
  onClear: () => void;
}

const stepper =
  "grid size-9 place-items-center rounded-md text-zinc-300 enabled:hover:bg-emerald-400/10 enabled:hover:text-emerald-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-300 disabled:opacity-50";

export default function CartPanel({
  lines,
  busy,
  canSend,
  formatMoney,
  onChange,
  onSend,
  onClear,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce(
    (sum, { menuItem, quantity }) => sum + menuItem.price * quantity,
    0,
  );

  if (!count) return null;

  return (
    <section
      aria-label="Unsent items"
      aria-busy={busy}
      className="rounded-2xl border border-emerald-500/25 bg-[#18191d] shadow-lg shadow-black/20"
    >
      <h2>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls="waiter-round"
          onClick={() => setExpanded((open) => !open)}
          className="flex w-full items-center gap-3 rounded-t-2xl bg-linear-to-r from-[#19362d] via-[#202c29] to-[#232429] px-3 py-2.5 text-left hover:from-[#204638] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-300 sm:px-4"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-emerald-400/25 bg-emerald-400/10 text-emerald-200">
            <ClipboardList aria-hidden="true" className="size-4" />
          </span>
          <span className="min-w-0 flex-1 text-sm font-semibold text-white">
            Unsent items
          </span>
          <span className="text-xs font-medium tabular-nums text-emerald-100">
            {count} {count === 1 ? "item" : "items"}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`size-4 shrink-0 text-zinc-300 transition-transform motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </h2>
      <div
        id="waiter-round"
        hidden={!expanded}
        className="border-t border-zinc-700/75 px-3 sm:px-4"
      >
        <ul className="divide-y divide-zinc-800">
          {lines.map(({ menuItem, quantity }) => (
            <li
              key={menuItem.id}
              className="flex min-h-11 items-center justify-between gap-3 py-1"
            >
              <div className="min-w-0 flex-1 items-center gap-3 sm:flex">
                <span className="block min-w-0 flex-1 break-words text-sm font-medium text-zinc-100">
                  {menuItem.name}
                </span>
                <span className="block shrink-0 whitespace-nowrap text-xs font-medium tabular-nums text-zinc-300 sm:text-right">
                  {formatMoney(menuItem.price * quantity)}
                </span>
              </div>
              <div className="flex shrink-0 items-center rounded-lg border border-zinc-700 bg-zinc-950/70">
                <button
                  type="button"
                  disabled={busy}
                  aria-label={`Remove one ${menuItem.name}`}
                  onClick={() => onChange(menuItem.id, -1)}
                  className={stepper}
                >
                  <Minus aria-hidden="true" className="size-4" />
                </button>
                <span className="min-w-6 text-center text-xs font-semibold tabular-nums text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={busy || !canSend || quantity >= 99}
                  aria-label={`Add one ${menuItem.name}`}
                  onClick={() => onChange(menuItem.id, 1)}
                  className={stepper}
                >
                  <Plus aria-hidden="true" className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-b-2xl border-t border-zinc-700/75 bg-zinc-900 px-3 py-2.5 sm:px-4">
        <div className="flex flex-wrap items-baseline gap-x-2 text-xs">
          <span className="text-zinc-300">Estimated subtotal</span>
          <span className="font-semibold tabular-nums text-white">
            {formatMoney(subtotal)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={onClear}
            className="min-h-10 rounded-lg px-2.5 text-xs font-medium text-zinc-300 enabled:hover:bg-zinc-800 enabled:hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-50"
          >
            Clear round
          </button>
          <button
            type="button"
            disabled={busy || !canSend}
            onClick={onSend}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-linear-to-r from-emerald-200 to-teal-300 px-4 text-sm font-semibold text-emerald-950 enabled:hover:from-emerald-100 enabled:hover:to-teal-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:opacity-50"
          >
            <Send aria-hidden="true" className="size-4" />{" "}
            {busy ? "Sending…" : "Send to kitchen"}
          </button>
        </div>
      </footer>
    </section>
  );
}
