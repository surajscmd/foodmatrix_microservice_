"use client";
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ShoppingCart, X } from 'lucide-react';
import { InventoryItem } from '@/utils/types'; 

interface RestockDrawerProps {
  item: InventoryItem | null;
  onClose: () => void;
  onSubmit: (id: string, qty: number) => void;
}

export default function RestockDrawer({ item, onClose, onSubmit }: RestockDrawerProps) {
  const [restockQty, setRestockQty] = useState(100);

  // 1. We completely removed the useEffect!

  if (!item || typeof document === 'undefined') return null;

  // 2. Create a clean wrapper function that resets state whenever the drawer closes
  const handleClose = () => {
    setRestockQty(100); // Reset ready for the next item
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(item.id, Number(restockQty));
    setRestockQty(100); // Reset ready for the next item
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm flex justify-end z-[9999]">
      {/* 3. Changed onClose to handleClose */}
      <div className="flex-1 cursor-pointer" onClick={handleClose} />
      <div className="w-full max-w-md bg-[#09090b] border-l border-zinc-800 h-full p-6 flex flex-col shadow-2xl overflow-y-auto animate-slide-in-right">
        
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Execute Supply Restock</h3>
              <p className="text-[10px] text-zinc-400 font-mono font-bold">FRANCHISE LOGISTICS CORE</p>
            </div>
          </div>
          {/* 3. Changed onClose to handleClose */}
          <button onClick={handleClose} className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1">
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 text-xs">
            <span className="font-mono text-[9px] text-zinc-500 uppercase block font-bold">TARGET LOGISTIC ITEM</span>
            <h4 className="font-semibold text-white text-sm">{item.name}</h4>
            <div className="grid grid-cols-2 gap-4 text-[11px] text-zinc-400 pt-2 border-t border-zinc-900">
              <div>
                <span>Current In Stock</span>
                <span className="font-bold text-white font-mono block">{item.quantity} {item.unit}</span>
              </div>
              <div>
                <span>Sourcing Partner</span>
                <span className="font-semibold text-emerald-400 block">{item.supplierName}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Restock Cargo quantity ({item.unit})</label>
            <input
              type="number"
              value={restockQty}
              onChange={(e) => setRestockQty(Number(e.target.value))}
              required
              min="5"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Logistics Routing Route Priority</label>
            <select className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50">
              <option value="standard">Standard Route (2-3 days)</option>
              <option value="express">Express air priority route (12 hours)</option>
              <option value="critical">Critical Next-hour local courier dispatch</option>
            </select>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2 text-xs text-zinc-400">
            <div className="flex justify-between text-zinc-500 font-mono text-[9px] uppercase font-bold">
              <span>FINANCIAL ESTIMATES SUMMARY</span>
              <span>PRE-AUDITED</span>
            </div>
            <div className="flex justify-between items-center text-white">
              <span>Unit Cost:</span>
              <span className="font-mono">${item.unitCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-white border-t border-zinc-900 pt-2 font-bold text-sm">
              <span>Total Gross Sourcing Value:</span>
              <span className="font-mono text-emerald-400">${(restockQty * item.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-800 flex gap-3">
            {/* 3. Changed onClose to handleClose */}
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800/80 text-zinc-300 text-xs font-medium rounded-xl border border-zinc-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Deploy restock purchase</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}