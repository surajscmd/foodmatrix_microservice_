"use client";
import React, { useState } from 'react';
import { Search, Building2 } from 'lucide-react';
import { Supplier } from '@/utils/types'; 
import SupplierScreen from '@/components/centraloperations/SupplierScreen'; 

import { initialSuppliers } from '@/utils/mockData'; 

export default function SuppliersManagementPage() {
  // Global State
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [searchTerm, setSearchTerm] = useState('');

  // Handler for adding a new supplier
  const handleAddSupplier = (newSupplierData: Partial<Supplier>) => {
    const newSupplier: Supplier = {
      ...newSupplierData,
      id: `SUP-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      name: newSupplierData.name || 'Unknown Business',
      contactName: newSupplierData.contactName || 'No Contact Provided',
      phone: newSupplierData.phone || 'N/A',
      email: newSupplierData.email || 'N/A',
      category: newSupplierData.category || 'General',
      // Default new suppliers to "Under Review" with 0 orders and a base rating
      status: 'Under Review',
      activeOrders: 0,
      rating: 5.0, 
    } as Supplier;

    setSuppliers(prev => [newSupplier, ...prev]);
  };

  return (
    <div className="min-h-screen text-zinc-300 font-sans">
      
      {/* Top Navigation / Header */}
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4 sticky top-0 z-10">
        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Sourcing Partners</h1>
              <p className="text-xs text-zinc-500 font-mono mt-1">VENDOR CONTRACT MANAGEMENT</p>
            </div>
          </div>

          {/* Global Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text"
              placeholder="Search partners, agents, or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

        </div>
      </header>

      {/* Main Content Area (w-full to span the screen) */}
      <main className="w-full pb-12">
        <SupplierScreen 
          suppliers={suppliers}
          onAddSupplier={handleAddSupplier}
          searchTerm={searchTerm}
        />
      </main>

    </div>
  );
}