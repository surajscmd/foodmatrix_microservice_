"use client";
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ClipboardList, X } from 'lucide-react';
import { MenuItem } from '@/utils/types';
import { calculateMarginRate } from '@/utils/constants';

interface AddMenuItemDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newItem: Partial<MenuItem>) => void;
}

export default function AddMenuItemDrawer({ isOpen, onClose, onSubmit }: AddMenuItemDrawerProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MenuItem['category']>('Mains');
  const [price, setPrice] = useState(15.00);
  const [cost, setCost] = useState(4.00);
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState(10);
  
  // 1. If it's not open, return null immediately.
  if (!isOpen) return null;

  // 2. Safe check for Next.js SSR (Server-Side Rendering)
  // This guarantees createPortal only runs on the browser without needing a useEffect!
  if (typeof document === 'undefined') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      category,
      price: Number(price),
      cost: Number(cost),
      status: 'Available',
      description: description.trim() || 'Artisanal culinary addition.',
      popularity: 'Medium',
      sales30d: 0,
      prepTime: Number(prepTime)
    });

    // Reset local state for next open
    setName('');
    setDescription('');
    setCategory('Mains');
    setPrice(15.00);
    setCost(4.00);
    setPrepTime(10);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm flex justify-end z-[9999]">
      <div className="flex-1 cursor-pointer" onClick={onClose} />
      <div className="w-full max-w-md bg-[#09090b] border-l border-zinc-800 h-full p-6 flex flex-col shadow-2xl overflow-y-auto animate-slide-in-right">
        
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Deploy Culinary Recipe</h3>
              <p className="text-[10px] text-zinc-400 font-mono font-bold">HQ MENU SYNC REGISTRY</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1">
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Recipe/Dish Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Section Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as MenuItem['category'])} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50">
                <option value="Starters">Starters</option>
                <option value="Mains">Mains</option>
                <option value="Desserts">Desserts</option>
                <option value="Beverages">Beverages</option>
                <option value="Sides">Sides</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Avg Prep (Mins)</label>
              <input type="number" min="1" value={prepTime} onChange={(e) => setPrepTime(Number(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white h-20 focus:outline-none focus:border-emerald-500/50" />
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-mono">Retail Price ($)</label>
                <input type="number" step="0.1" min="0" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full bg-zinc-900/50 border border-zinc-800 rounded py-1 px-2 font-mono text-xs text-white focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-mono">Cost ($)</label>
                <input type="number" step="0.1" min="0" value={cost} onChange={(e) => setCost(Number(e.target.value))} className="w-full bg-zinc-900/50 border border-zinc-800 rounded py-1 px-2 font-mono text-xs text-white focus:outline-none" />
              </div>
            </div>
            <div className="pt-2.5 border-t border-zinc-800 flex justify-between items-center text-xs">
              <div className="space-y-0.5">
                <span className="text-zinc-500 text-[10px] block">Net Margin Profit</span>
                <span className="font-mono font-bold text-white text-sm">${(price - cost).toFixed(2)}</span>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-zinc-500 text-[10px] block">Margin Percentage yield</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{calculateMarginRate(price, cost).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-800 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800/80 text-zinc-300 text-xs font-medium rounded-xl border border-zinc-800 cursor-pointer">Cancel</button>
            <button type="submit" className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold rounded-xl shadow-lg cursor-pointer">Push Central Sync</button>
          </div>
        </form>
      </div>
    </div>,
    document.body 
  );
}