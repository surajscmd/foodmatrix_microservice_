"use client";
import React, { useState, useMemo } from 'react';
import { Activity } from 'lucide-react';
import { Restaurant, InventoryRequest, FranchiseInventory } from '@/utils/types';
import SourcingMetrics from '@/elements/sourcing/SourcingMetrics';
import RestaurantSidebar from '@/elements/sourcing/RestaurantSidebar';
import RequestsLedger from '@/elements/sourcing/RequestsLedger';

type StatusFilterType = 'All' | 'Pending' | 'Approved' | 'Fulfilled' | 'Rejected';
type UrgencyFilterType = 'All' | 'Critical' | 'Urgent' | 'Standard';

interface RegionalSourcingScreenProps {
  restaurants: Restaurant[];
  inventoryRequests: InventoryRequest[];
  franchiseInventory: FranchiseInventory[];
  onProcessRequest: (requestId: string, action: 'Approved' | 'Rejected' | 'Fulfilled') => void;
  searchTerm: string;
}

export default function RegionalSourcingScreen({
  restaurants,
  inventoryRequests,
  franchiseInventory,
  onProcessRequest,
  searchTerm
}: RegionalSourcingScreenProps) {
  const [selectedRestId, setSelectedRestId] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('All');
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilterType>('All');
  const [localSearch, setLocalSearch] = useState('');

  // 1. Calculate stats (Memoized)
  const stats = useMemo(() => ({
    pendingCount: inventoryRequests.filter(r => r.status === 'Pending').length,
    transitCount: inventoryRequests.filter(r => r.status === 'Approved').length,
    fulfilledCount: inventoryRequests.filter(r => r.status === 'Fulfilled').length,
  }), [inventoryRequests]);

  // 2. Filter requests (Memoized for performance)
  const filteredRequests = useMemo(() => {
    return inventoryRequests.filter(req => {
      if (selectedRestId !== 'All' && req.requesterRestaurantId !== selectedRestId) return false;
      if (statusFilter !== 'All' && req.status !== statusFilter) return false;
      if (urgencyFilter !== 'All' && req.urgency !== urgencyFilter) return false;

      const matchesGlobal = searchTerm ? (
        req.itemSelector.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.requesterRestaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.id.toLowerCase().includes(searchTerm.toLowerCase())
      ) : true;

      const matchesLocal = localSearch ? (
        req.itemSelector.toLowerCase().includes(localSearch.toLowerCase()) ||
        req.requesterRestaurantName.toLowerCase().includes(localSearch.toLowerCase()) ||
        req.id.toLowerCase().includes(localSearch.toLowerCase())
      ) : true;

      return matchesGlobal && matchesLocal;
    });
  }, [inventoryRequests, selectedRestId, statusFilter, urgencyFilter, searchTerm, localSearch]);

  const selectedRestName = selectedRestId === 'All' 
    ? 'All Locations' 
    : restaurants.find(r => r.id === selectedRestId)?.name || 'Unknown';

  return (
    <div className="space-y-6 animate-fade-in p-6">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1 text-emerald-400 font-bold mb-2">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            Central Logistics Terminal
          </span>
          <h2 className="text-lg font-bold text-white">Regional Sourcing & Logistics Hub</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Audit, approve, and dispatch inter-store replenishment requests and supplier sourcing lines.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-550">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Fulfillment Bridge Active</span>
        </div>
      </div>

      <SourcingMetrics 
        pendingCount={stats.pendingCount}
        transitCount={stats.transitCount}
        fulfilledCount={stats.fulfilledCount}
      />

      {/* Main Panel Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <RestaurantSidebar 
          restaurants={restaurants}
          inventoryRequests={inventoryRequests}
          franchiseInventory={franchiseInventory}
          selectedRestId={selectedRestId}
          onSelectRestId={setSelectedRestId}
        />

        <RequestsLedger 
          filteredRequests={filteredRequests}
          franchiseInventory={franchiseInventory}
          selectedRestName={selectedRestName}
          localSearch={localSearch}
          setLocalSearch={setLocalSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          urgencyFilter={urgencyFilter}
          setUrgencyFilter={setUrgencyFilter}
          onProcessRequest={onProcessRequest}
        />

      </div>
    </div>
  );
}