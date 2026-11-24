"use client";

import { useState } from "react";
import {
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Utensils,
  X,
} from "lucide-react";

export interface RegisterMenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  isAvailable: boolean;
  category: {
    id: string;
    name: string;
    sortOrder: number;
  };
}

interface Props {
  items: RegisterMenuItem[] | null;
  error: string;
  optionsError: string;
  disabled: boolean;
  customizableItems: ReadonlySet<string>;
  formatMoney: (amount: number) => string;
  onAdd: (item: RegisterMenuItem) => void;
  onOptions: (item: RegisterMenuItem) => void;
  onRetry: () => void;
  onRetryOptions: () => void;
}

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300";

export default function MenuCatalog({
  items,
  error,
  optionsError,
  disabled,
  customizableItems,
  formatMoney,
  onAdd,
  onOptions,
  onRetry,
  onRetryOptions,
}: Props) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const available = items?.filter((item) => item.isAvailable) ?? [];
  const categories = Array.from(
    new Map(available.map(({ category }) => [category.id, category])).values(),
  ).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  const activeCategory =
    categoryId === "" || categories.some(({ id }) => id === categoryId)
      ? categoryId
      : (categories[0]?.id ?? "");
  const query = search.trim().toLowerCase();

  // Search across the menu; category buttons filter the browse view.
  const visible = available.filter((item) =>
    query
      ? `${item.name} ${item.category.name}`.toLowerCase().includes(query)
      : !activeCategory || item.category.id === activeCategory,
  );

  return (
    <section
      aria-labelledby="pos-menu-title"
      id="pos-menu"
      className="min-w-0 scroll-mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 shadow-lg shadow-black/20"
    >
      <div className="flex flex-wrap items-center gap-3 rounded-t-2xl border-b border-emerald-400/20 bg-gradient-to-r from-emerald-500/25 via-emerald-500/10 to-zinc-950 p-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-300 text-emerald-950">
            <Utensils aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0">
            <h2
              id="pos-menu-title"
              className="truncate text-base font-semibold tracking-tight text-white"
            >
              Menu catalog
            </h2>
            <p className="mt-1 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-400">
              Menu
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-3.5 size-4 text-zinc-400"
          />
          <input
            type="text"
            inputMode="search"
            aria-label="Search the full menu"
            placeholder="Search menu…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={`h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 pl-9 pr-10 text-xs text-white placeholder:text-zinc-400 ${focus}`}
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearch("")}
              className={`absolute inset-y-0 right-0 grid w-10 place-items-center rounded-xl text-zinc-400 hover:text-white ${focus}`}
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4 p-4">
        {error ? (
          <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-4">
            <p role="alert" className="text-sm text-rose-200">
              {error}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className={`mt-2 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm text-rose-200 hover:bg-rose-400/15 ${focus}`}
            >
              <RefreshCw aria-hidden="true" className="size-4" />
              Retry menu
            </button>
          </div>
        ) : items === null ? (
          <p role="status" className="py-4 text-sm text-zinc-400">
            Loading menu…
          </p>
        ) : available.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-700 p-4 text-sm text-zinc-400">
            No menu items are available for this restaurant.
          </p>
        ) : (
          <>
            {optionsError && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
                <p role="status">{optionsError}</p>
                <button
                  type="button"
                  onClick={onRetryOptions}
                  className={`rounded underline underline-offset-2 ${focus}`}
                >
                  Retry options
                </button>
              </div>
            )}
            <div
              role="group"
              aria-label="Menu categories"
              className="flex flex-wrap gap-2"
            >
              {[...categories, { id: "", name: "All items" }].map(
                ({ id, name }) => {
                  const active = !query && activeCategory === id;

                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setCategoryId(id);
                        setSearch("");
                      }}
                      className={`min-h-10 rounded-lg border px-3 text-xs font-semibold transition-colors ${focus} ${
                        active
                          ? "border-emerald-400 bg-emerald-400 text-zinc-950 shadow-[0_4px_16px_rgba(52,211,153,0.15)]"
                          : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-emerald-400/50 hover:bg-emerald-400/10 hover:text-emerald-300"
                      }`}
                    >
                      {name}
                    </button>
                  );
                },
              )}
            </div>

            {visible.length === 0 ? (
              <p role="status" className="py-4 text-sm text-zinc-400">
                No items match “{search.trim()}”.
              </p>
            ) : (
              <ul className="grid max-h-[28rem] gap-2 overflow-y-auto p-1 min-[480px]:grid-cols-2 2xl:grid-cols-3">
                {visible.map((item) => {
                  const hasOptions = customizableItems.has(item.id);
                  return (
                    <li
                      key={item.id}
                      className="flex min-w-0 overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 transition-colors hover:border-emerald-400/40"
                    >
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onAdd(item)}
                        aria-label={`Add ${item.name} for ${formatMoney(item.price)}`}
                        className={`group flex min-h-20 min-w-0 flex-1 items-center justify-between gap-2.5 p-3 text-left transition enabled:hover:bg-emerald-400/[0.06] ${hasOptions ? "rounded-s-xl" : "rounded-xl"} ${focus}`}
                      >
                        <span className="min-w-0">
                          <span className="block break-words text-xs font-semibold leading-5 text-white">
                            {item.name}
                          </span>
                          <span className="mt-1 block text-sm font-semibold tabular-nums text-emerald-400">
                            {formatMoney(item.price)}
                          </span>
                        </span>
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-400 text-zinc-950 shadow-[0_3px_12px_rgba(52,211,153,0.12)] group-hover:bg-emerald-300 group-disabled:bg-zinc-800 group-disabled:text-zinc-500">
                          <Plus aria-hidden="true" className="size-4" />
                        </span>
                      </button>
                      {hasOptions && (
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => onOptions(item)}
                          aria-label={`Choose options for ${item.name}`}
                          className={`flex w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-e-xl border-s border-zinc-800 bg-violet-500/[0.06] text-[10px] font-semibold text-violet-300 transition enabled:hover:bg-violet-500/15 disabled:opacity-55 ${focus}`}
                        >
                          <SlidersHorizontal
                            aria-hidden="true"
                            className="size-4"
                          />
                          Options
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
}
