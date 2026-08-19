"use client";

import { useState } from "react";
import { Clock, Plus } from "lucide-react";


import type { MenuItem } from "@/utils/pos.types";
import { usePosStore } from "@/store/pos.store";

interface MenuCatalogProps {
  menuItems: MenuItem[];
  searchTerm: string;
}

const categories = [
  "All",
  "Starters",
  "Mains",
  "Desserts",
  "Beverages",
  "Sides",
] as const;

export default function MenuCatalog({
  menuItems,
  searchTerm,
}: MenuCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const addToCart = usePosStore((state) => state.addToCart);

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;

    const available = item.status === "Available";

    return matchesSearch && matchesCategory && available;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
        <h3 className="text-xs font-mono text-zinc-400 uppercase font-bold tracking-wider">
          Culinary Catalog
        </h3>
      </div>

      {/* Categories */}
      <div className="flex bg-zinc-900/30 p-1.5 rounded-2xl border border-zinc-800 overflow-x-auto gap-1">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
              selectedCategory === category
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => addToCart(item)}
            className="bg-zinc-900/40 border border-zinc-800 hover:bg-zinc-900 hover:border-emerald-500 hover:shadow-[0_0_0_1px_rgba(16,185,129,0.35)] p-3.5 rounded-xl space-y-3 cursor-pointer transition-all duration-200 relative group flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-1">
                <span className="text-[8px] font-mono text-zinc-500 uppercase font-bold">
                  {item.category}
                </span>

                <div className="flex items-center gap-1 text-[9px] text-zinc-400 font-mono">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  <span>{item.prepTime}m</span>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug">
                  {item.name}
                </h4>

                <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2.5 border-t border-zinc-850 mt-2">
              <span className="text-xs font-mono font-bold text-white group-hover:text-emerald-400 transition-colors">
                ${item.price.toFixed(2)}
              </span>

              <span className="p-1 bg-zinc-950 rounded-lg group-hover:bg-emerald-500/10 group-hover:text-emerald-400 border border-transparent group-hover:border-emerald-500/10 transition-all">
                <Plus className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}