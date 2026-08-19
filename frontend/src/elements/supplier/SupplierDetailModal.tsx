"use client";
import React from 'react';
import { createPortal } from 'react-dom';
import { Truck, Star, X } from 'lucide-react';
import { Supplier } from '@/utils/types';

interface SupplierDetailModalProps {
  supplier: Supplier | null;
  onClose: () => void;
}

export default function SupplierDetailModal({ supplier, onClose }: SupplierDetailModalProps) {
  if (!supplier || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div 
        className="absolute inset-0 z-0 cursor-pointer" 
        onClick={onClose} 
      />
      <div className="bg-[#09090b] border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-6 relative animate-scale-up z-10">
        
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white absolute top-4 right-4 cursor-pointer transition-colors"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        <div className="space-y-1">
          <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">{supplier.id} • {supplier.category} Sourcing</span>
          <h3 className="text-lg font-bold text-white">{supplier.name}</h3>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase mt-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {supplier.status} Contract Verified
          </span>
        </div>

        <div className="space-y-3.5 border-y border-zinc-800 py-4 text-xs text-zinc-300">
          <div className="flex justify-between">
            <span className="text-zinc-500">Key Account Executive</span>
            <span className="font-semibold text-white">{supplier.contactName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Corporate Phone Line</span>
            <span className="font-mono text-white">{supplier.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Contract Email Gateway</span>
            <span className="font-mono text-emerald-400">{supplier.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Partner SLA Rating Score</span>
            <span className="font-semibold text-amber-400 flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400" />
              {supplier.rating?.toFixed(1) || '0.0'} / 5.0
            </span>
          </div>
        </div>

        <div className="p-4 bg-zinc-900/50 rounded-xl flex items-start gap-3 border border-zinc-800">
          <Truck className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs space-y-1">
            <span className="font-semibold text-white block">Logistics Sourcing Telemetry</span>
            <p className="text-zinc-400 leading-normal text-[11px]">
              Currently, {supplier.activeOrders} corporate restock requests are actively routed with this partner. Tracking information is automatically synced.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-zinc-900 hover:bg-zinc-800/80 text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-800 transition-all cursor-pointer"
        >
          Close Contract File
        </button>

      </div>
    </div>,
    document.body
  );
}