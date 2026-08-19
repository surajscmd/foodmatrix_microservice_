"use client";

import { useState } from 'react';
import { Search, Building2 } from 'lucide-react';
import RestaurantScreen from '@/components/centraloperations/RestaurantScreen';

// Adjust this import path depending on where your page.tsx is located
// If this is in src/app/page.tsx, the path below is correct.


export default function CentralOperationsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="min-h-screen flex flex-col font-sans">
      
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Logo / Branding */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <Building2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Central Operations</h1>
            <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">FoodMatrix Corporate Hub</p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative max-w-md w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-500" />
          </div>
          <input
            type="text"
            placeholder="Search nodes, managers, or cities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-zinc-800 rounded-xl leading-5 bg-zinc-900/50 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:bg-zinc-900 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 sm:text-sm transition-all"
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="max-w-[1600px] mx-auto">
          {/* We pass the searchTerm down to our orchestrator screen */}
          <RestaurantScreen searchTerm={searchTerm} />
        </div>
      </main>
      
    </div>
  );
}