"use client";
import React, { useState } from 'react';
import { Search, PackageSearch } from 'lucide-react';
import { Order, Restaurant } from '@/utils/types';
import OrderScreen from '@/components/centraloperations/OrderScreen';
import { initialRestaurants , initialOrders} from '@/utils/mockData';

export default function FulfillmentManagementPage() {
  const [restaurants] = useState<Restaurant[]>(initialRestaurants);
  const [orders] = useState<Order[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans">
      
      {/* Top Navigation / Header */}
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4 sticky top-0 z-10">
        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <PackageSearch className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Fulfillment Ledger</h1>
              <p className="text-xs text-zinc-500 font-mono mt-1">DISTRIBUTION & LOGISTICS STREAM</p>
            </div>
          </div>

          {/* Global Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text"
              placeholder="Search receipt IDs, nodes, or cashiers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full pb-12">
        <OrderScreen 
          orders={orders}
          restaurants={restaurants}
          searchTerm={searchTerm}
        />
      </main>

    </div>
  );
}