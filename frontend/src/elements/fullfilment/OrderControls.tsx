"use client";
import React from 'react';
import { Order, Restaurant } from '@/utils/types';

type OrderStatusFilter = 'All' | Order['status'];

interface OrderControlsProps {
  selectedStatus: OrderStatusFilter;
  onSelectStatus: (status: OrderStatusFilter) => void;
  selectedRestaurantId: string;
  onSelectRestaurant: (id: string) => void;
  restaurants: Restaurant[];
  filteredCount: number;
}

const STATUS_TABS: OrderStatusFilter[] = ['All', 'Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

export default function OrderControls({
  selectedStatus,
  onSelectStatus,
  selectedRestaurantId,
  onSelectRestaurant,
  restaurants,
  filteredCount
}: OrderControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          {STATUS_TABS.map((status) => (
            <button
              key={status}
              onClick={() => onSelectStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                selectedStatus === status ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-500 font-bold">Franchise:</span>
          <select
            value={selectedRestaurantId}
            onChange={(e) => onSelectRestaurant(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500/50 text-zinc-200 cursor-pointer font-bold"
          >
            <option value="All">All Franchises</option>
            {restaurants.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-xs font-mono text-zinc-500 font-bold">
        Showing {filteredCount} transaction entries
      </div>
    </div>
  );
}