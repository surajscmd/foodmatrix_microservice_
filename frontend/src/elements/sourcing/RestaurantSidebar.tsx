"use client";
import React from 'react';
import { MapPin } from 'lucide-react';
import { Restaurant, InventoryRequest, FranchiseInventory } from '@/utils/types';

interface RestaurantSidebarProps {
  restaurants: Restaurant[];
  inventoryRequests: InventoryRequest[];
  franchiseInventory: FranchiseInventory[];
  selectedRestId: string;
  onSelectRestId: (id: string) => void;
}

export default function RestaurantSidebar({
  restaurants,
  inventoryRequests,
  franchiseInventory,
  selectedRestId,
  onSelectRestId
}: RestaurantSidebarProps) {
  
  const currentRest = restaurants.find(r => r.id === selectedRestId);
  const restInv = franchiseInventory.find(fi => fi.restaurantId === selectedRestId);

  return (
    <div className="lg:col-span-4 space-y-4">
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2.5">
          <span className="text-xs font-bold font-mono text-zinc-300 uppercase tracking-wider">Franchise Nodes</span>
          <span className="text-[9px] font-mono bg-zinc-950 border border-zinc-850 px-2 py-0.5 rounded text-zinc-500">
            {restaurants.length} Registered
          </span>
        </div>

        <div className="space-y-1 max-h-[460px] overflow-y-auto pr-1">
          {/* "All" Option */}
          <button
            onClick={() => onSelectRestId('All')}
            className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex items-center justify-between cursor-pointer ${
              selectedRestId === 'All'
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-semibold'
                : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-2 h-2 rounded-full ${selectedRestId === 'All' ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
              <span>All Regional Restaurants</span>
            </div>
            {inventoryRequests.filter(r => r.status === 'Pending').length > 0 && (
              <span className="px-1.5 py-0.2 rounded font-mono text-[9px] bg-amber-500 text-zinc-950 font-bold">
                {inventoryRequests.filter(r => r.status === 'Pending').length}
              </span>
            )}
          </button>

          {/* Individual Restaurants */}
          {restaurants.map((rest) => {
            const pendingForRest = inventoryRequests.filter(r => r.requesterRestaurantId === rest.id && r.status === 'Pending').length;
            const isSelected = selectedRestId === rest.id;

            return (
              <button
                key={rest.id}
                onClick={() => onSelectRestId(rest.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-semibold'
                    : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-zinc-550'}`} />
                    <span className="font-semibold block truncate max-w-[150px]">{rest.name}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 block font-mono">
                    ID: {rest.id} • Region: {rest.region}
                  </span>
                </div>

                {pendingForRest > 0 ? (
                  <span className="px-1.5 py-0.2 rounded font-mono text-[9px] bg-amber-500 text-zinc-950 font-bold animate-pulse">
                    {pendingForRest}
                  </span>
                ) : (
                  <span className="text-[9px] font-mono text-zinc-600">Active</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Diagnostics sidebar for selected restaurant */}
      {selectedRestId !== 'All' && currentRest && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <div className="border-b border-zinc-800 pb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Live Node Diagnostic</span>
            <h4 className="text-xs font-semibold text-white mt-0.5">{currentRest.name} Stocks</h4>
          </div>

          {!restInv || restInv.items.length === 0 ? (
            <p className="text-[10px] text-zinc-500 font-mono">No stock level reporting active for this node.</p>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {restInv.items.map((it) => {
                const isLow = it.status === 'Low Stock' || it.status === 'Out of Stock';
                return (
                  <div key={it.inventoryItemId} className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-850 text-[10px]">
                    <div className="space-y-0.5 min-w-0">
                      <span className="font-semibold text-zinc-300 block truncate">{it.name}</span>
                      <span className="text-[9px] text-zinc-500 font-mono">Min req: {it.minThreshold} {it.unit}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono font-bold block ${isLow ? 'text-rose-400' : 'text-zinc-300'}`}>
                        {it.quantity} {it.unit}
                      </span>
                      <span className={`text-[8px] font-semibold uppercase px-1 rounded ${
                        it.status === 'In Stock' ? 'bg-emerald-500/10 text-emerald-400' :
                        it.status === 'Low Stock' ? 'bg-amber-500/10 text-amber-400 animate-pulse' :
                        'bg-rose-500/10 text-rose-400 animate-pulse'
                      }`}>
                        {it.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}