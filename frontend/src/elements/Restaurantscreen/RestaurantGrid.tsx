"use client";

import { User, MapPin, Star } from 'lucide-react';
import { Restaurant } from '../../utils/types';

interface RestaurantGridProps {
  restaurants: Restaurant[];
  onSelect: (id: string) => void;
}

export default function RestaurantGrid({ restaurants, onSelect }: RestaurantGridProps) {
  if (restaurants.length === 0) {
    return (
      <div className="p-12 text-center bg-zinc-900/50 border border-zinc-800 rounded-2xl">
        <span className="text-sm font-semibold text-zinc-400 block mb-1">No franchise node records found</span>
        <p className="text-xs text-zinc-500">Adjust active filters or clear search to look for other nodes.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {restaurants.map((r) => (
        <div
          key={r.id}
          onClick={() => onSelect(r.id)}
          className="bg-zinc-900/50 border border-zinc-800 hover:border-emerald-500/40 p-5 rounded-2xl space-y-4 cursor-pointer hover:shadow-xl transition-all relative group"
        >
          <div className="absolute inset-0 bg-emerald-500/2 opacity-0 group-hover:opacity-100 transition-all rounded-2xl" />

          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">{r.id} • {r.region} Region</span>
              <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">{r.name}</h3>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
              r.status === 'Operational' ? 'bg-emerald-500/10 text-emerald-400' :
              r.status === 'Maintenance' ? 'bg-amber-500/10 text-amber-400' :
              r.status === 'Opening Soon' ? 'bg-blue-500/10 text-blue-400' :
              'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
            }`}>
              {r.status}
            </span>
          </div>

          <div className="space-y-2 border-y border-zinc-900 py-3 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-zinc-600" />
              <span>Lead GM: <span className="text-zinc-200">{r.manager}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-zinc-600" />
              <span className="truncate">{r.address}</span>
            </div>
          </div>

          <div className="flex justify-between text-xs items-center">
            <div className="space-y-0.5">
              <span className="text-[9px] text-zinc-500 font-mono uppercase block">30D Revenue</span>
              <span className="font-bold text-white font-mono">${r.revenueMonth.toLocaleString()}</span>
            </div>
            <div className="space-y-0.5 text-right">
              <span className="text-[9px] text-zinc-500 font-mono uppercase block">FTEs / Tickets</span>
              <span className="font-bold text-zinc-300 font-mono">
                {r.employeeCount} FTEs <span className="text-zinc-500 font-normal">/</span> {r.openOrders} tickets
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-4 border-t border-zinc-900/60 text-xs">
            <span className="text-zinc-500 text-[10px] font-mono uppercase">Node Rating Gauge</span>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-white font-mono font-bold">{r.rating ? r.rating.toFixed(1) : 'N/A'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}