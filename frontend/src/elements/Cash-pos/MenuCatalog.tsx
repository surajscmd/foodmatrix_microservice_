"use client";

import { useState } from "react";
import { Plus, RefreshCw, Search, Utensils, X } from "lucide-react";

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
  restaurantName: string;
  items: RegisterMenuItem[] | null;
  error: string;
  disabled: boolean;
  formatMoney: (amount: number) => string;
  onAdd: (item: RegisterMenuItem) => void;
  onRetry: () => void;
}

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300";

export default function MenuCatalog({
  restaurantName,
  items,
  error,
  disabled,
  formatMoney,
  onAdd,
  onRetry,
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
      className="min-w-0 scroll-mt-4 rounded-2xl border border-slate-700 bg-slate-900 shadow-lg shadow-black/20"
    >
      <div className="flex flex-wrap items-center gap-3 rounded-t-2xl border-b border-teal-400/30 bg-linear-to-r from-teal-800 to-slate-800 p-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-300 text-emerald-950">
            <Utensils aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0">
            <h2
              id="pos-menu-title"
              className="truncate text-sm font-semibold text-white"
              title={restaurantName}
            >
              {restaurantName}
            </h2>
            <p className="text-xs text-teal-100">Menu</p>
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
            className={`h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 pl-9 pr-10 text-sm text-white placeholder:text-zinc-400 ${focus}`}
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
                      className={`min-h-10 rounded-lg border px-3 text-sm font-medium ${focus} ${
                        active
                          ? "border-emerald-300 bg-emerald-300 text-emerald-950"
                          : "border-slate-600 bg-slate-800 text-slate-100 hover:border-emerald-400 hover:bg-teal-950"
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
                {visible.map((item) => (
                  <li key={item.id} className="min-w-0">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onAdd(item)}
                      aria-label={`Add ${item.name} for ${formatMoney(item.price)}`}
                      className={`group flex min-h-20 w-full items-center justify-between gap-3 rounded-xl border border-slate-600/70 bg-slate-800 p-3 text-left transition enabled:hover:border-emerald-400 enabled:hover:bg-teal-950 ${focus}`}
                    >
                      <span className="min-w-0">
                        <span className="block break-words text-sm font-semibold text-white">
                          {item.name}
                        </span>
                        <span className="mt-1 block text-sm font-medium tabular-nums text-emerald-300">
                          {formatMoney(item.price)}
                        </span>
                      </span>
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-300 text-emerald-950 group-disabled:bg-slate-700 group-disabled:text-slate-400">
                        <Plus aria-hidden="true" className="size-4" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
}
