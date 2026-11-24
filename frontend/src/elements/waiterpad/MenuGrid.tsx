"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowRight,
  Plus,
  Search,
  SlidersHorizontal,
  Utensils,
  X,
} from "lucide-react";
import type { CartItem, MenuItem } from "./types";
import { itemPriceInCents } from "@/elements/Cash-pos/cashier-modifiers";

interface Props {
  table: string;
  items: MenuItem[] | null;
  lines: CartItem[];
  error: string;
  optionsError: string;
  disabled: boolean;
  customizableItems: ReadonlySet<string>;
  formatMoney: (amount: number) => string;
  onAdd: (item: MenuItem) => void;
  onOptions: (item: MenuItem) => void;
  onRetry: () => void;
  onRetryOptions: () => void;
  onClose: () => void;
}

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400";

export default function MenuGrid({
  table,
  items,
  lines,
  error,
  optionsError,
  disabled,
  customizableItems,
  formatMoney,
  onAdd,
  onOptions,
  onRetry,
  onRetryOptions,
  onClose,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const categories = [
    ...new Map(
      (items ?? []).map((item) => [item.category.id, item.category]),
    ).values(),
  ].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  const selected =
    category === "" || categories.some(({ id }) => id === category)
      ? category
      : (categories[0]?.id ?? "");
  const query = search.trim().toLowerCase();
  const visible = (items ?? []).filter((item) =>
    query
      ? `${item.name} ${item.category.name}`.toLowerCase().includes(query)
      : !selected || item.category.id === selected,
  );
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total =
    lines.reduce(
      (sum, line) =>
        sum +
        itemPriceInCents(line.menuItem.price, line.modifiers) * line.quantity,
      0,
    ) / 100;

  useEffect(() => {
    const opener = document.activeElement;
    const element = dialog.current;
    element?.showModal();
    element?.querySelector<HTMLInputElement>("input")?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  return (
    <dialog
      id="waiter-menu-region"
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="fixed inset-0 m-auto w-[calc(100%-1.5rem)] max-w-5xl overflow-hidden rounded-3xl border border-zinc-800/90 bg-gradient-to-br from-[#0d1117] via-[#090b0f] to-[#07090c] p-0 text-zinc-100 shadow-[0_30px_90px_rgba(0,0,0,0.65)] backdrop:bg-black/70 backdrop:backdrop-blur-md"
    >
      <div className="flex h-[min(760px,calc(100dvh-2rem))] flex-col">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/80 to-cyan-400/60"
        />
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-800/80 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/15 via-cyan-400/10 to-violet-400/10 text-emerald-400">
              <Utensils size={18} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                Table {table}
              </p>
              <h2
                id={titleId}
                className="mt-1 text-sm font-semibold text-white"
              >
                Add items
              </h2>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className={`grid size-9 place-items-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-rose-400 ${focus}`}
          >
            <X size={16} aria-hidden />
          </button>
        </header>
        <div className="shrink-0 border-b border-zinc-800/80 px-5 py-3 sm:px-6">
          <label className="flex min-h-10 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 focus-within:border-emerald-400/50">
            <Search size={15} className="text-zinc-500" aria-hidden />
            <span className="sr-only">Search the menu</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search dishes or categories…"
              className="min-w-0 flex-1 bg-transparent py-2 text-xs text-white outline-none placeholder:text-zinc-600"
            />
          </label>
        </div>
        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <nav
            aria-label="Menu categories"
            className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-zinc-800/80 p-3 sm:w-44 sm:flex-col sm:overflow-y-auto sm:border-r sm:border-b-0"
          >
            {[...categories, { id: "", name: "All items" }].map(
              ({ id, name }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={!query && selected === id}
                  onClick={() => {
                    setSearch("");
                    setCategory(id);
                  }}
                  className={`min-h-10 shrink-0 rounded-lg border px-3 text-left text-xs font-medium sm:shrink sm:break-words ${focus} ${!query && selected === id ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300" : "border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-white"}`}
                >
                  {name}
                </button>
              ),
            )}
          </nav>
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
            {optionsError && (
              <div
                role="status"
                className="mb-3 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-200"
              >
                {optionsError}{" "}
                <button
                  type="button"
                  onClick={onRetryOptions}
                  className={`ml-2 rounded underline ${focus}`}
                >
                  Retry options
                </button>
              </div>
            )}
            {error ? (
              <div role="alert" className="text-xs text-rose-300">
                {error}{" "}
                <button
                  type="button"
                  onClick={onRetry}
                  className={`ml-2 rounded underline ${focus}`}
                >
                  Retry menu
                </button>
              </div>
            ) : !items ? (
              <p role="status" className="p-4 text-xs text-zinc-400">
                Loading menu…
              </p>
            ) : visible.length === 0 ? (
              <p
                role="status"
                className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-500"
              >
                No dishes match this selection.
              </p>
            ) : (
              <ul className="grid gap-3 md:grid-cols-2">
                {visible.map((item) => {
                  const quantity = lines
                    .filter((line) => line.menuItem.id === item.id)
                    .reduce((sum, line) => sum + line.quantity, 0);
                  return (
                    <li
                      key={item.id}
                      className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 transition-colors hover:border-emerald-400/30"
                    >
                      <div className="flex items-start justify-between gap-3 px-4 pt-4">
                        <div className="min-w-0">
                          <p className="font-mono text-[8px] uppercase tracking-wider text-zinc-500">
                            {item.category.name}
                          </p>
                          <h3 className="mt-1 break-words text-xs font-semibold leading-5 text-white">
                            {item.name}
                          </h3>
                        </div>
                        <span className="shrink-0 text-xs font-semibold tabular-nums text-emerald-400">
                          {formatMoney(item.price)}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-800/70 px-3 py-2">
                        {customizableItems.has(item.id) ? (
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onOptions(item)}
                            className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-[10px] font-medium text-violet-300 hover:bg-violet-400/10 disabled:opacity-50 ${focus}`}
                          >
                            <SlidersHorizontal size={13} aria-hidden /> Options
                          </button>
                        ) : (
                          <span className="px-1 text-[10px] text-zinc-500">
                            {quantity
                              ? `${quantity} in draft`
                              : "Standard item"}
                          </span>
                        )}
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => onAdd(item)}
                          aria-label={`Add ${item.name}`}
                          className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-400/10 px-3 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-400 hover:text-zinc-950 disabled:opacity-50 ${focus}`}
                        >
                          <Plus size={14} aria-hidden /> Add
                          {quantity > 0 ? ` · ${quantity}` : ""}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-950/60 px-5 py-3 sm:px-6">
          <p role="status" aria-live="polite" className="text-xs text-zinc-400">
            {count} {count === 1 ? "item" : "items"} in draft{" "}
            <span className="ml-3 font-semibold tabular-nums text-emerald-300">
              {formatMoney(total)}
            </span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex min-h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 text-xs font-semibold text-zinc-950 hover:brightness-110 ${focus}`}
          >
            {count ? "Review items" : "Back to table"}{" "}
            <ArrowRight size={14} aria-hidden />
          </button>
        </footer>
      </div>
    </dialog>
  );
}
