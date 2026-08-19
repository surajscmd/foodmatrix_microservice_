"use client";
import React from 'react';
import { User, Mail, Star } from 'lucide-react';
import { Supplier } from '@/utils/types';

interface SupplierGridProps {
  suppliers: Supplier[];
  onSelectSupplier: (id: string) => void;
}

export default function SupplierGrid({ suppliers, onSelectSupplier }: SupplierGridProps) {
  if (suppliers.length === 0) {
    return (
      <div className="p-12 text-center text-zinc-500 font-mono text-xs border border-dashed border-zinc-800 rounded-2xl">
        No partner contracts match the current search or filter criteria.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {suppliers.map((sup) => (
        <div
          key={sup.id}
          onClick={() => onSelectSupplier(sup.id)}
          className="bg-zinc-900/50 border border-zinc-800 hover:border-emerald-500/30 p-5 rounded-2xl space-y-4 cursor-pointer hover:shadow-xl transition-all relative group"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">{sup.id} • {sup.category}</span>
              <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">{sup.name}</h3>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase border ${
              sup.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              sup.status === 'Under Review' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
              'bg-zinc-800 text-zinc-400 border-zinc-700/50'
            }`}>
              {sup.status}
            </span>
          </div>

          <div className="space-y-2 border-y border-zinc-800 py-3 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-zinc-600" />
              <span>Agent: <span className="text-zinc-200">{sup.contactName}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-zinc-600" />
              <span className="truncate font-mono">{sup.email}</span>
            </div>
          </div>

          <div className="flex justify-between text-xs items-center">
            <div className="space-y-0.5">
              <span className="text-[9px] text-zinc-500 font-mono uppercase block font-bold">Active Cargo Shipments</span>
              <span className="font-bold text-white font-mono">{sup.activeOrders} contracts dispatching</span>
            </div>

            <div className="flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold text-white font-mono">{sup.rating?.toFixed(1) || '0.0'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}