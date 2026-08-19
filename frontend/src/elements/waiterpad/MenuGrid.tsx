"use client";

import {
  Clock3,
  Flame,
  Leaf,
  Drumstick,
  Plus,
} from "lucide-react";
import { MenuItem } from "./types";

interface MenuGridProps {
  items: MenuItem[];
  category: string;
  setCategory: (category: string) => void;
  onAddToCart: (item: MenuItem) => void;
}

const categories = [
  "All",
  "Starters",
  "Mains",
  "Desserts",
  "Beverages",
  "Sides",
];

export default function MenuGrid({
  items,
  category,
  setCategory,
  onAddToCart,
}: MenuGridProps) {
  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
            Menu Catalogue
          </p>

          <h2 className="mt-1 text-xl font-bold text-white">
            Available Menu
          </h2>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2">
          <span className="font-mono text-xs text-zinc-400">
            {items.length} Items
          </span>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/40 p-2">
        {categories.map((item) => (
          <button
            key={item}
            onClick={() => setCategory(item)}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              category === item
                ? "bg-emerald-500 text-zinc-950"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Menu */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-zinc-800 py-16 text-center">
            <p className="font-mono text-sm text-zinc-500">
              No menu items found.
            </p>
          </div>
        )}

        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onAddToCart(item)}
            className="group rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 text-left transition-all hover:-translate-y-1 hover:border-emerald-500/30 hover:bg-zinc-900"
          >
            {/* Top */}
            <div className="flex items-start justify-between">
              <span className="rounded-lg bg-zinc-950 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                {item.category}
              </span>

              <span
                className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${
                  item.isVeg
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-rose-500/10 text-rose-400"
                }`}
              >
                {item.isVeg ? (
                  <>
                    <Leaf className="h-3 w-3" />
                    Veg
                  </>
                ) : (
                  <>
                    <Drumstick className="h-3 w-3" />
                    Non-Veg
                  </>
                )}
              </span>
            </div>

            {/* Title */}
            <h3 className="mt-4 text-base font-bold text-white transition-colors group-hover:text-emerald-400">
              {item.name}
            </h3>

            {/* Description */}
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">
              {item.description}
            </p>

            {/* Info */}
            <div className="mt-5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-zinc-400">
                <Clock3 className="h-3.5 w-3.5" />
                {item.prepTime} min
              </div>

              <div className="flex items-center gap-1 text-orange-400">
                <Flame className="h-3.5 w-3.5" />
                {item.popularity}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-5 flex items-center justify-between border-t border-zinc-800 pt-4">
              <div>
                <p className="font-mono text-lg font-bold text-white">
                  ${item.price.toFixed(2)}
                </p>

                <p className="mt-1 text-[10px] text-zinc-500">
                  {item.sales30d} sold this month
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 transition-all group-hover:scale-110">
                <Plus className="h-5 w-5" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
);
}