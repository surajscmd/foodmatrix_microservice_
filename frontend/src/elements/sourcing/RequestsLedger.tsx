"use client";
import React from 'react';
import { Inbox, Search, Filter, AlertCircle } from 'lucide-react';
import { InventoryRequest, FranchiseInventory } from '@/utils/types';
import RequestCard from './RequestCard';

type StatusFilterType = 'All' | 'Pending' | 'Approved' | 'Fulfilled' | 'Rejected';
type UrgencyFilterType = 'All' | 'Critical' | 'Urgent' | 'Standard';

interface RequestsLedgerProps {
  filteredRequests: InventoryRequest[];
  franchiseInventory: FranchiseInventory[];
  selectedRestName: string;
  localSearch: string;
  setLocalSearch: (val: string) => void;
  statusFilter: StatusFilterType;
  setStatusFilter: (val: StatusFilterType) => void;
  urgencyFilter: UrgencyFilterType;
  setUrgencyFilter: (val: UrgencyFilterType) => void;
  onProcessRequest: (requestId: string, action: 'Approved' | 'Rejected' | 'Fulfilled') => void;
}

export default function RequestsLedger({
  filteredRequests,
  franchiseInventory,
  selectedRestName,
  localSearch,
  setLocalSearch,
  statusFilter,
  setStatusFilter,
  urgencyFilter,
  setUrgencyFilter,
  onProcessRequest
}: RequestsLedgerProps) {

  // Helper to find the current store stock of a requested item
  const getStoreItemStock = (restaurantId: string, itemName: string) => {
    const storeInv = franchiseInventory.find(fi => fi.restaurantId === restaurantId);
    if (!storeInv) return null;
    
    return storeInv.items.find(i => 
      i.name.toLowerCase() === itemName.toLowerCase() ||
      itemName.toLowerCase().includes(i.name.toLowerCase()) ||
      i.name.toLowerCase().includes(itemName.toLowerCase())
    ) || null;
  };

  return (
    <div className="lg:col-span-8 space-y-4">
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
        
        {/* Sourcing Filters / Search Toolbar */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Inbox className="w-4 h-4 text-emerald-400" />
              <span>Sourcing Requests Ledger</span>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-950 border border-zinc-850 px-1.5 py-0.5 rounded font-bold">
                {filteredRequests.length} results
              </span>
            </h3>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase">Sourcing Node:</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-950 border border-zinc-850 text-emerald-400">
                {selectedRestName}
              </span>
            </div>
          </div>

          {/* Controls layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search by item or node..."
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-1.5 pl-9 pr-3 text-xs text-white placeholder-zinc-550 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-1.5 px-2.5 text-xs text-zinc-300 font-semibold focus:outline-none focus:border-emerald-500/50"
              >
                <option value="All">All Gateways (Status)</option>
                <option value="Pending">Awaiting Audit (Pending)</option>
                <option value="Approved">In Transit (Approved)</option>
                <option value="Fulfilled">Fulfilled & Complete</option>
                <option value="Rejected">Rejected by HQ</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value as UrgencyFilterType)}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-1.5 px-2.5 text-xs text-zinc-300 font-semibold focus:outline-none focus:border-emerald-500/50"
              >
                <option value="All">All Urgency Scales</option>
                <option value="Critical">Critical</option>
                <option value="Urgent">Urgent</option>
                <option value="Standard">Standard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests Ledger list */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="py-20 border border-dashed border-zinc-800 rounded-xl text-center text-zinc-500 font-mono text-xs">
              Zero active supply or sourcing requests found matching criteria.
            </div>
          ) : (
            filteredRequests.map((req) => (
              <RequestCard 
                key={req.id} 
                req={req} 
                storeStockObj={getStoreItemStock(req.requesterRestaurantId, req.itemSelector)} 
                onProcessRequest={onProcessRequest} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}