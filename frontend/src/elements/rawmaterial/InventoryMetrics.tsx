"use client";
import React from 'react';

interface InventoryMetricsProps {
  totalItems: number;
  lowStockCount: number;
  totalAssetVal: number;
}

export default function InventoryMetrics({ totalItems, lowStockCount, totalAssetVal }: InventoryMetricsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
        <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Stock Items Total</span>
        <h3 className="text-xl font-semibold text-white mt-1">{totalItems} active units</h3>
      </div>
      <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
        <span className="text-[10px] font-mono text-amber-500 uppercase font-bold">Low Stock Warnings</span>
        <h3 className={`text-xl font-semibold mt-1 ${lowStockCount > 0 ? 'text-amber-500' : 'text-white'}`}>
          {lowStockCount} depletion logs
        </h3>
      </div>
      <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
        <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Est Asset Value</span>
        <h3 className="text-xl font-semibold text-emerald-400 mt-1">
          ${totalAssetVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h3>
      </div>
      <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
        <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Sla Compliance</span>
        <h3 className="text-xl font-semibold text-white mt-1">99.8% restock SLA</h3>
      </div>
    </div>
  );
}