"use client";
import React from 'react';
import { Inbox, Truck, CheckCircle2, ShieldCheck } from 'lucide-react';

interface SourcingMetricsProps {
  pendingCount: number;
  transitCount: number;
  fulfilledCount: number;
}

export default function SourcingMetrics({ pendingCount, transitCount, fulfilledCount }: SourcingMetricsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl relative overflow-hidden">
        <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">HQ Queue Backlog</span>
        <h3 className="text-xl font-bold text-white mt-1">{pendingCount} Awaiting</h3>
        <p className="text-[10px] text-zinc-550 mt-1 font-mono">Requires direct central audit</p>
        <div className="absolute right-3 bottom-3 text-zinc-800">
          <Inbox className="w-10 h-10 stroke-[1]" />
        </div>
      </div>

      <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl relative overflow-hidden">
        <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold text-cyan-400 font-bold">Transit Pipelines</span>
        <h3 className="text-xl font-bold text-cyan-400 mt-1">{transitCount} Active</h3>
        <p className="text-[10px] text-zinc-550 mt-1 font-mono">Dispatched to freight lines</p>
        <div className="absolute right-3 bottom-3 text-zinc-800">
          <Truck className="w-10 h-10 stroke-[1] text-cyan-900/40" />
        </div>
      </div>

      <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl relative overflow-hidden">
        <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold text-emerald-400 font-bold">Fulfilled Cycles</span>
        <h3 className="text-xl font-bold text-emerald-400 mt-1">{fulfilledCount} Closed</h3>
        <p className="text-[10px] text-zinc-550 mt-1 font-mono">Buffered in local store ledgers</p>
        <div className="absolute right-3 bottom-3 text-zinc-800">
          <CheckCircle2 className="w-10 h-10 stroke-[1] text-emerald-900/40" />
        </div>
      </div>

      <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl relative overflow-hidden">
        <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">SLA Fulfillment Rate</span>
        <h3 className="text-xl font-bold text-white mt-1">98.4%</h3>
        <p className="text-[10px] text-zinc-550 mt-1 font-mono">Avg turnaround: 1.4 hours</p>
        <div className="absolute right-3 bottom-3 text-zinc-800">
          <ShieldCheck className="w-10 h-10 stroke-[1]" />
        </div>
      </div>
    </div>
  );
}