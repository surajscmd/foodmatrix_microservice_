"use client";

import { Plus } from 'lucide-react';

// Replace the old interface with this:
interface FilterBarProps {
  regionFilter: 'All' | 'East' | 'West' | 'Midwest' | 'South';
  setRegionFilter: (region: 'All' | 'East' | 'West' | 'Midwest' | 'South') => void;
  statusFilter: 'All' | 'Operational' | 'Maintenance' | 'Opening Soon';
  setStatusFilter: (status: 'All' | 'Operational' | 'Maintenance' | 'Opening Soon') => void;
  onOpenDrawer: () => void;
}
export default function FilterBar({ 
  regionFilter, 
  setRegionFilter, 
  statusFilter, 
  setStatusFilter, 
  onOpenDrawer 
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-4 items-center justify-between bg-zinc-900/30 p-4 rounded-xl border border-zinc-800">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-400">Region:</span>
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            {(['All', 'East', 'West', 'Midwest', 'South'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRegionFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold cursor-pointer ${
                  regionFilter === r ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-400">Status:</span>
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            {(['All', 'Operational', 'Maintenance', 'Opening Soon'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold cursor-pointer ${
                  statusFilter === s ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onOpenDrawer}
        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 text-xs font-semibold rounded-xl transition-all shadow-[0_4px_12px_rgba(16,185,129,0.15)] cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Launch Franchise Site</span>
      </button>
    </div>
  );
}