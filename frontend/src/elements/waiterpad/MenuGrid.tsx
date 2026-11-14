"use client";

import { useState } from "react";
import { Plus, Search, Utensils } from "lucide-react";
import type { MenuItem } from "./types";

interface Props {
  restaurantName: string;
  items: MenuItem[] | null;
  error: string;
  disabled: boolean;
  formatMoney: (amount: number) => string;
  onAdd: (item: MenuItem) => void;
  onRetry: () => void;
}

export default function MenuGrid({
  restaurantName,
  items,
  error,
  disabled,
  formatMoney,
  onAdd,
  onRetry,
}: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const categories = [
    ...new Map(
      (items ?? []).map((item) => [item.category.id, item.category]),
    ).values(),
  ].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  const selected = category ?? categories[0]?.id ?? "";
  const search = query.trim().toLowerCase();
  const visible = (items ?? []).filter((item) =>
    search
      ? item.name.toLowerCase().includes(search)
      : selected === "" || item.category.id === selected,
  );

  return (
    <section
      aria-labelledby="waiter-menu"
      className="min-w-0 rounded-2xl border border-zinc-700/80 bg-[#18191d]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-2xl bg-linear-to-r from-[#1d3b31] via-[#222e29] to-[#232429] p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-200 text-emerald-950">
            <Utensils aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 id="waiter-menu" className="font-semibold text-white">
              {restaurantName}
            </h2>
            <p className="text-xs text-emerald-100">Dine-in menu</p>
          </div>
        </div>
        <label className="flex h-11 w-full items-center gap-2 rounded-xl border border-zinc-600 bg-zinc-950 px-3 sm:w-56">
          <Search
            aria-hidden="true"
            className="size-4 shrink-0 text-emerald-200"
          />
          <span className="sr-only">Search menu</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search menu"
            className="min-w-0 flex-1 bg-transparent text-sm text-white"
          />
        </label>
      </div>
      <div className="space-y-3 p-4">
        {error ? (
          <div
            role="alert"
            className="rounded-xl bg-rose-950 p-3 text-sm text-rose-100"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="min-h-10 font-semibold underline"
            >
              Retry menu
            </button>
          </div>
        ) : !items ? (
          <p role="status" className="text-sm text-zinc-300">
            Loading menu…
          </p>
        ) : items.length ? (
          <>
            <div
              role="group"
              aria-label="Menu categories"
              className="flex flex-wrap gap-2"
            >
              {[...categories, { id: "", name: "All items" }].map(
                ({ id, name }) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={!search && id === selected}
                    onClick={() => {
                      setCategory(id);
                      setQuery("");
                    }}
                    className={`min-h-10 rounded-lg border px-3 text-sm font-semibold ${!search && id === selected ? "border-emerald-200 bg-emerald-200 text-emerald-950" : "border-zinc-700 bg-[#232429] text-zinc-100 hover:border-emerald-300"}`}
                  >
                    {name}
                  </button>
                ),
              )}
            </div>
            {visible.length ? (
              <ul className="grid max-h-[28rem] gap-2 overflow-y-auto p-1 min-[520px]:grid-cols-2 2xl:grid-cols-3">
                {visible.map((item) => (
                  <li key={item.id} className="min-w-0">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onAdd(item)}
                      className="flex min-h-20 w-full items-center justify-between gap-3 rounded-xl border border-zinc-700 bg-[#232429] p-3 text-left enabled:hover:border-emerald-300 disabled:opacity-60"
                    >
                      <span className="min-w-0">
                        <span className="block break-words text-sm font-semibold">
                          {item.name}
                        </span>
                        <span className="text-sm tabular-nums text-emerald-200">
                          {formatMoney(item.price)}
                        </span>
                      </span>
                      <Plus
                        aria-hidden="true"
                        className="size-8 shrink-0 rounded-lg bg-teal-200 p-1.5 text-emerald-950"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-300">
                No items match your search.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-zinc-300">No menu items are available.</p>
        )}
      </div>
    </section>
  );
}
