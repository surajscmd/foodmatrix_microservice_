"use client";
import React from 'react';

interface MenuMetricsProps {
  totalItems: number;
  avgMargin: number;
  totalSales: number;
  avgPrepTime: string;
}

export default function MenuMetrics({ totalItems, avgMargin, totalSales, avgPrepTime }: MenuMetricsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
        <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Gourmet Offerings</span>
        <h3 className="text-xl font-semibold text-white mt-1">{totalItems} active recipes</h3>
      </div>
      <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
        <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Corporate Gross Margin</span>
        <h3 className="text-xl font-semibold text-emerald-400 mt-1">{avgMargin.toFixed(1)}% avg</h3>
      </div>
      <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
        <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">30D Central Menu Sales</span>
        <h3 className="text-xl font-semibold text-white mt-1">{totalSales.toLocaleString()} orders</h3>
      </div>
      <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
        <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Central Prep Clock</span>
        <h3 className="text-xl font-semibold text-amber-400 mt-1">{avgPrepTime} mins</h3>
      </div>
    </div>
  );
}