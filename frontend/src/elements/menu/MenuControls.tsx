"use client";
import React from 'react';
import { Plus } from 'lucide-react';
import { MenuItem } from '@/utils/types';

// 1. Create a specific type that includes 'All' plus the valid categories
type FilterCategory = 'All' | MenuItem['category'];

interface MenuControlsProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onOpenDrawer: () => void;
}

// 2. Use the new type here, removing the need for `as any`
const CATEGORIES: FilterCategory[] = [
  'All', 
  'Starters', 
  'Mains', 
  'Desserts', 
  'Beverages', 
  'Sides'
];

export default function MenuControls({ selectedCategory, onSelectCategory, onOpenDrawer }: MenuControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800">
      <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
              selectedCategory === cat ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <button
        onClick={onOpenDrawer}
        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold rounded-xl cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Sync Recipe Node</span>
      </button>
    </div>
  );
}