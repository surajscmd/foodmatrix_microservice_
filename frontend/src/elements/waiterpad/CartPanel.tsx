"use client";

import {
  Minus,
  Plus,
  RefreshCw,
  Send,
  ShoppingBag,
  Trash2,
  Utensils,
} from "lucide-react";
import { CartItem } from "./types";

interface CartPanelProps {
  table: string;
  customerName: string;
  guests: number;

  cart: CartItem[];

  subtotal: number;
  tax: number;
  total: number;

  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onSend: () => void;
}

export default function CartPanel({
  table,
  customerName,
  guests,
  cart,
  subtotal,
  tax,
  total,
  onIncrease,
  onDecrease,
  onRemove,
  onClear,
  onSend,
}: CartPanelProps) {
  return (
    <aside className="sticky top-6 flex h-[calc(100vh-9rem)] flex-col rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 p-5">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <ShoppingBag className="h-4 w-4 text-emerald-400" />
            Table Order
          </h2>

          <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            {table} • {customerName} • {guests} Guests
          </p>
        </div>

        {cart.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500 transition hover:bg-zinc-800 hover:text-rose-400"
          >
            <RefreshCw className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* Cart */}
      <div className="flex-1 overflow-y-auto p-4">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <Utensils className="h-10 w-10 text-zinc-700" />
            </div>

            <h3 className="text-sm font-semibold text-white">Cart is Empty</h3>

            <p className="mt-2 max-w-xs text-xs leading-6 text-zinc-500">
              Select menu items from the catalogue to begin creating the table
              order.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => {
              const lineTotal = item.menuItem.price * item.quantity;

              return (
                <div
                  key={item.menuItem.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 transition hover:border-emerald-500/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-semibold text-white">
                        {item.menuItem.name}
                      </h4>

                      <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-zinc-500">
                        {item.menuItem.category}
                      </p>

                      <div className="mt-3 flex items-center gap-3 text-xs">
                        <span className="font-mono text-emerald-400">
                          ${item.menuItem.price.toFixed(2)}
                        </span>

                        <span className="text-zinc-700">×</span>

                        <span className="font-mono text-zinc-300">
                          {item.quantity}
                        </span>

                        <span className="ml-auto font-semibold text-white">
                          ${lineTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onRemove(item.menuItem.id)}
                      className="rounded-lg p-2 text-zinc-600 transition hover:bg-rose-500/10 hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                      onClick={() => onDecrease(item.menuItem.id)}
                      className="rounded-lg border border-zinc-800 p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                    >
                      <Minus className="h-3 w-3" />
                    </button>

                    <div className="w-12 rounded-lg border border-zinc-800 bg-zinc-900 py-2 text-center font-mono text-sm font-semibold text-white">
                      {item.quantity}
                    </div>

                    <button
                      onClick={() => onIncrease(item.menuItem.id)}
                      className="rounded-lg border border-zinc-800 p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="border-t border-zinc-800 p-5">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-zinc-400">
              <span>Tax (10%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>

            <div className="border-t border-zinc-800 pt-3">
              <div className="flex justify-between">
                <span className="font-semibold text-white">Total</span>

                <span className="text-lg font-bold text-emerald-400">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <button
          disabled={cart.length === 0}
          onClick={onSend}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
          Send Order to Kitchen
        </button>
      </div>
    </aside>
  );
}
