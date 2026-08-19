"use client";
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import RegionalSourcingScreen from '@/components/centraloperations/RegionalSourcingScreen'; 

import { 
  initialRestaurants, 
  initialInventoryRequests, 
  initialFranchiseInventory 
} from '@/utils/mockData';

export default function RegionalSourcingPage() {
  // Global State
  const [restaurants] = useState(initialRestaurants);
  const [franchiseInventory] = useState(initialFranchiseInventory);
  const [inventoryRequests, setInventoryRequests] = useState(initialInventoryRequests);
  const [globalSearch, setGlobalSearch] = useState('');

  // Handler for Approving, Rejecting, or Fulfilling requests
  const handleProcessRequest = (requestId: string, action: 'Approved' | 'Rejected' | 'Fulfilled') => {
    setInventoryRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        return { ...req, status: action };
      }
      return req;
    }));
  };

  return (
    <div className="min-h-screen text-zinc-300 font-sans">
      
      {/* Top Navigation / Header */}
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4 sticky top-0 z-10">
        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Supply & Routing</h1>
            <p className="text-xs text-zinc-500 font-mono mt-1">REGIONAL LOGISTICS COMMAND</p>
          </div>

          {/* Global Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text"
              placeholder="Search request IDs, assets, or nodes..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

        </div>
      </header>

      {/* Main Content Area (w-full for responsive stretching) */}
      <main className="w-full pb-12">
        <RegionalSourcingScreen 
          restaurants={restaurants}
          inventoryRequests={inventoryRequests}
          franchiseInventory={franchiseInventory}
          onProcessRequest={handleProcessRequest}
          searchTerm={globalSearch}
        />
      </main>

    </div>
  );
}