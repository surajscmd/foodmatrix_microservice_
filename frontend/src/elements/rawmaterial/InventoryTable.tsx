"use client";
import React from 'react';
import { Trash2 } from 'lucide-react';
import { InventoryItem } from '@/utils/types';

interface InventoryTableProps {
  items: InventoryItem[];
  onRestockClick: (item: InventoryItem) => void;
  onDeleteClick?: (id: string) => void;
}

export default function InventoryTable({ items, onRestockClick, onDeleteClick }: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden p-12 text-center text-zinc-500 font-mono text-xs">
        No stock records matched search parameters.
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 font-mono text-[10px] uppercase font-bold">
              <th className="py-3.5 px-5">Stock ID</th>
              <th className="py-3.5 px-5">Supply Asset Name</th>
              <th className="py-3.5 px-5">Category</th>
              <th className="py-3.5 px-5">Available Volume</th>
              <th className="py-3.5 px-5">Level Visual Gauge</th>
              <th className="py-3.5 px-5">Connected Wholesale Partner</th>
              <th className="py-3.5 px-5">Last Replenish</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850 text-zinc-300">
            {items.map((item) => {
              const limit = Math.max(item.quantity, item.minThreshold * 3);
              const percentage = Math.min((item.quantity / limit) * 100, 100);
              
              return (
                <tr key={item.id} className="hover:bg-zinc-900/20 transition-colors">
                  <td className="py-3 px-5 font-mono text-zinc-400 font-medium">{item.id}</td>
                  <td className="py-3 px-5">
                    <div className="font-semibold text-white">{item.name}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">Unit Cost: ${item.unitCost.toFixed(2)}</div>
                  </td>
                  <td className="py-3 px-5">
                    <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 text-[10px] font-bold">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-5 font-mono text-zinc-200">
                    {item.quantity} {item.unit}
                    <div className="text-[9px] text-zinc-500 font-medium">Min Goal: {item.minThreshold} {item.unit}</div>
                  </td>
                  <td className="py-3 px-5">
                    <div className="space-y-1 w-28">
                      <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                        <span>Capacity</span>
                        <span>{percentage.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-850">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            item.status === 'In Stock' ? 'bg-emerald-500' :
                            item.status === 'Low Stock' ? 'bg-amber-500' : 'bg-rose-500'
                          }`} 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-5">
                    <span className="font-semibold text-white block">{item.supplierName}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Partner code: {item.supplierId}</span>
                  </td>
                  <td className="py-3 px-5 font-mono text-zinc-400">
                    {item.lastRestocked}
                  </td>
                  <td className="py-3 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onRestockClick(item)}
                        className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-emerald-400 text-[10px] font-bold font-mono uppercase rounded border border-zinc-800 hover:border-zinc-750 transition-all cursor-pointer"
                      >
                        Rapid Restock
                      </button>
                      {onDeleteClick && (
                        <button
                          onClick={() => onDeleteClick(item.id)}
                          className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-400/10 rounded transition-colors cursor-pointer"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}