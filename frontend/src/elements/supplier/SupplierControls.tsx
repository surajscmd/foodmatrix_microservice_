"use client";
import React from 'react';
import { Plus } from 'lucide-react';
import { Supplier } from '@/utils/types';

type SupplierStatusFilter = 'All' | Supplier['status'];

interface SupplierControlsProps {
  statusFilter: SupplierStatusFilter;
  onStatusChange: (status: SupplierStatusFilter) => void;
  filteredCount: number;
  onOpenAdd: () => void;
}

const STATUS_OPTIONS: SupplierStatusFilter[] = ['All', 'Active', 'Under Review', 'Inactive'];

export default function SupplierControls({ 
  statusFilter, 
  onStatusChange, 
  filteredCount, 
  onOpenAdd 
}: SupplierControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800">
      <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            onClick={() => onStatusChange(status)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
              statusFilter === status ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="text-xs font-mono text-zinc-500 font-bold">
          Showing {filteredCount} partner contracts
        </div>
        <button
          onClick={onOpenAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer shadow-lg transition-all"
        >
          <Plus className="w-3.5 h-3.5 text-zinc-950" />
          <span>Add Supplier</span>
        </button>
      </div>
    </div>
  );
}