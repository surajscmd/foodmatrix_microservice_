"use client";
import React from 'react';
import { Package, Truck, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { InventoryRequest, type FranchiseInventory } from '@/utils/types';


type FranchiseInventoryItem = FranchiseInventory['items'][number];

interface RequestCardProps {
  req: InventoryRequest;
  storeStockObj: FranchiseInventoryItem | null; 
  onProcessRequest: (requestId: string, action: 'Approved' | 'Rejected' | 'Fulfilled') => void;
}
export default function RequestCard({ req, storeStockObj, onProcessRequest }: RequestCardProps) {
  const urgencyStyle = req.urgency === 'Critical' 
    ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' 
    : req.urgency === 'Urgent' 
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' 
      : 'text-zinc-400 bg-zinc-800 border-zinc-700';

  return (
    <div className="border border-zinc-800/60 hover:border-zinc-800 bg-zinc-950/40 p-4 rounded-xl space-y-4 transition-all">
      {/* Top bar */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-850 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-zinc-900 flex items-center justify-center border border-zinc-800">
              <Package className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <span className="text-xs font-bold text-white block">{req.itemSelector}</span>
            <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono border ${urgencyStyle}`}>
              {req.urgency}
            </span>
          </div>
          
          <div className="text-[10px] text-zinc-500 font-mono">
            Ticket ID: <span className="text-zinc-400 font-bold">{req.id}</span> • Sent: {req.requestedAt}
          </div>
        </div>

        <div className="text-right">
          <span className="text-[9px] font-mono text-zinc-500 block uppercase">Logistics Status</span>
          <div className="mt-0.5">
            {req.status === 'Pending' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                Awaiting HQ Audit
              </span>
            )}
            {req.status === 'Approved' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse">
                Approved & In Transit
              </span>
            )}
            {req.status === 'Fulfilled' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Fulfillment Complete
              </span>
            )}
            {req.status === 'Rejected' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Request Denied
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Diagnostic & Details Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="space-y-1">
          <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold block">Fulfillment Target</span>
          <span className="text-white font-medium block">{req.requesterRestaurantName}</span>
          <span className="text-zinc-400 text-[11px] block leading-normal">
            Sourcing requested quantity: <span className="font-bold text-zinc-200 font-mono">{req.quantity} {req.unit}</span>.
          </span>
        </div>

        {/* Local Store Diagnostic */}
        <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-850 space-y-1 text-[11px]">
          <span className="text-[9px] font-mono text-zinc-550 uppercase font-bold block">Edge Inventory Context</span>
          {storeStockObj ? (
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Current store buffer:</span>
              <div className="text-right">
                <span className={`font-mono font-bold ${
                  storeStockObj.status === 'In Stock' ? 'text-emerald-400' : 'text-rose-400 font-bold'
                }`}>
                  {storeStockObj.quantity} {storeStockObj.unit}
                </span>
                <span className={`ml-1 text-[9px] font-bold ${
                  storeStockObj.status === 'In Stock' ? 'text-zinc-500' : 'text-rose-400 font-bold'
                }`}>
                  ({storeStockObj.status})
                </span>
              </div>
            </div>
          ) : (
            <span className="text-zinc-550 font-mono block">Zero quantity in store registry (Urgent Restock required)</span>
          )}
        </div>
      </div>

      {/* Interactive Actions and Tracking Timeline */}
      <div className="pt-3 border-t border-zinc-850/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Timeline */}
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-500">
          <span className="text-emerald-400">Edge Initiated</span>
          <ArrowRight className="w-2.5 h-2.5" />
          <span className={req.status !== 'Pending' && req.status !== 'Rejected' ? 'text-emerald-400' : 'text-amber-400'}>
            HQ Audit
          </span>
          <ArrowRight className="w-2.5 h-2.5" />
          <span className={req.status === 'Fulfilled' ? 'text-emerald-400' : req.status === 'Approved' ? 'text-cyan-400 animate-pulse' : 'text-zinc-650'}>
            Freight Transit
          </span>
          <ArrowRight className="w-2.5 h-2.5" />
          <span className={req.status === 'Fulfilled' ? 'text-emerald-400 font-bold' : 'text-zinc-650'}>
            Store Buffered
          </span>
        </div>

        {/* Control Triggers */}
        <div className="flex gap-2">
          {req.status === 'Pending' && (
            <>
              <button
                onClick={() => onProcessRequest(req.id, 'Rejected')}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-zinc-950 text-xs font-bold rounded-lg cursor-pointer transition-all border border-rose-500/20 hover:border-transparent"
              >
                Reject
              </button>
              <button
                onClick={() => onProcessRequest(req.id, 'Approved')}
                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-zinc-950 text-xs font-bold rounded-lg cursor-pointer transition-all border border-emerald-500/20 hover:border-transparent flex items-center gap-1"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Approve & Dispatch</span>
              </button>
            </>
          )}

          {req.status === 'Approved' && (
            <button
              onClick={() => onProcessRequest(req.id, 'Fulfilled')}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-lg cursor-pointer transition-all shadow-md flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Fulfill & Buffered to Local</span>
            </button>
          )}

          {req.status === 'Fulfilled' && (
            <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Sourcing Loop Closed</span>
            </div>
          )}

          {req.status === 'Rejected' && (
            <div className="text-[10px] text-rose-400 font-mono flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              <span>Request Denied by Central Office</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}