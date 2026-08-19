"use client";
import React from 'react';

interface OrderMetricsProps {
  totalVolume: number;
  avgTicket: string;
  activeOrdersCount: number;
}

export default function OrderMetrics({ totalVolume, avgTicket, activeOrdersCount }: OrderMetricsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
        <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Total Logged Sales</span>
        <h3 className="text-xl font-semibold text-white mt-1">${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
      </div>
      <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
        <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Average Ticket size</span>
        <h3 className="text-xl font-semibold text-emerald-400 mt-1">${avgTicket}</h3>
      </div>
      <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
        <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Active In Queue</span>
        <h3 className="text-xl font-semibold text-white mt-1">{activeOrdersCount} pending tickets</h3>
      </div>
      <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
        <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Network Sla Rate</span>
        <h3 className="text-xl font-semibold text-white mt-1">99.96% uptime</h3>
      </div>
    </div>
  );
}