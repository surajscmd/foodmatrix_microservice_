"use client";

import { Plus } from 'lucide-react';
// import { InventoryItem } from '@/utils/types';

// type FilterCategory = 'All' | InventoryItem['category'];
// type FilterStatus = 'All' | InventoryItem['status'];

interface InventoryControlsProps {
  selectedCategory: string;
  onSelectCategory: (val: string) => void;
  selectedStatus: string;
  onSelectStatus: (val: string) => void;
  activeSuppliersCount: number;
  onOpenAdd: () => void;
}

export default function InventoryControls({
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
  activeSuppliersCount,
  onOpenAdd
}: InventoryControlsProps) {
  return (
    <div className="flex flex-wrap gap-4 items-center justify-between bg-zinc-900/30 p-4 rounded-xl border border-zinc-800">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-500 font-bold">Inventory Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500/50 text-zinc-200"
          >
            <option value="All">All Categories</option>
            <option value="Produce">Produce</option>
            <option value="Meat & Poultry">Meat & Poultry</option>
            <option value="Dairy">Dairy</option>
            <option value="Dry Goods">Dry Goods</option>
            <option value="Packaging">Packaging</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-500 font-bold">Stock Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => onSelectStatus(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500/50 text-zinc-200"
          >
            <option value="All">All Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-xs text-zinc-400 font-mono font-bold">
          Active Supply Lines: {activeSuppliersCount} partners
        </div>
        <button
          onClick={onOpenAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer shadow-lg transition-all"
        >
          <Plus className="w-3.5 h-3.5 text-zinc-950" />
          <span>Add Stock Item</span>
        </button>
      </div>
    </div>
  );
}