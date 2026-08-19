"use client";
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Database, Plus, X } from 'lucide-react';
import { InventoryItem, Supplier } from '@/utils/types';

interface AddInventoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  onSubmit: (newItem: Partial<InventoryItem>) => void;
}

export default function AddInventoryDrawer({ isOpen, onClose, suppliers, onSubmit }: AddInventoryDrawerProps) {
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<InventoryItem['category']>('Produce');
  const [newQuantity, setNewQuantity] = useState<number>(100);
  const [newUnit, setNewUnit] = useState('pcs');
  const [newMinThreshold, setNewMinThreshold] = useState<number>(20);
  const [newUnitCost, setNewUnitCost] = useState<number>(1.50);
  const [newSupplierId, setNewSupplierId] = useState(suppliers[0]?.id || '');

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onSubmit({
      name: newName,
      category: newCategory,
      quantity: Number(newQuantity),
      unit: newUnit,
      minThreshold: Number(newMinThreshold),
      unitCost: Number(newUnitCost),
      supplierId: newSupplierId || (suppliers[0]?.id || 'SUP-001')
    });

    setNewName('');
    setNewCategory('Produce');
    setNewQuantity(100);
    setNewUnit('pcs');
    setNewMinThreshold(20);
    setNewUnitCost(1.50);
    setNewSupplierId(suppliers[0]?.id || '');
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm flex justify-end z-[9999]">
      <div className="flex-1 cursor-pointer" onClick={onClose} />
      <div className="w-full max-w-md bg-[#09090b] border-l border-zinc-800 h-full p-6 flex flex-col shadow-2xl overflow-y-auto animate-slide-in-right">
        
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Register New Stock Asset</h3>
              <p className="text-[10px] text-zinc-400 font-mono font-bold">FRANCHISE LOGISTICS REGISTER</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1">
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Asset Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Organic Basil Leaves"
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Sourcing Category</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as InventoryItem['category'])}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50"
            >
              <option value="Produce">Produce</option>
              <option value="Meat & Poultry">Meat & Poultry</option>
              <option value="Dairy">Dairy</option>
              <option value="Dry Goods">Dry Goods</option>
              <option value="Packaging">Packaging</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Initial quantity</label>
              <input
                type="number"
                value={newQuantity}
                onChange={(e) => setNewQuantity(Number(e.target.value))}
                required
                min="0"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Unit of measure</label>
              <input
                type="text"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                placeholder="e.g. lbs, kg, pcs"
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Min Goal Threshold</label>
              <input
                type="number"
                value={newMinThreshold}
                onChange={(e) => setNewMinThreshold(Number(e.target.value))}
                required
                min="0"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Unit Cost ($)</label>
              <input
                type="number"
                step="0.01"
                value={newUnitCost}
                onChange={(e) => setNewUnitCost(Number(e.target.value))}
                required
                min="0"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Sourcing Partner</label>
            <select
              value={newSupplierId}
              onChange={(e) => setNewSupplierId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50"
            >
              {suppliers.map(sup => (
                <option key={sup.id} value={sup.id}>{sup.name} ({sup.category})</option>
              ))}
            </select>
          </div>

          <div className="pt-6 border-t border-zinc-800 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800/80 text-zinc-300 text-xs font-medium rounded-xl border border-zinc-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-zinc-950" />
              <span>Register stock item</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}