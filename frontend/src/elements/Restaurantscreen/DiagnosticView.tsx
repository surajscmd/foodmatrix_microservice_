"use client";

import { useMemo } from 'react';
import { 
  ArrowLeft, BarChart, User, Layers, MapPin, Phone, Star, ShieldAlert, CheckCircle2, AlertTriangle 
} from 'lucide-react';
import { Restaurant, Employee, Order, InventoryItem } from '../../utils/types';

interface DiagnosticViewProps {
  restaurant: Restaurant;
  employees: Employee[];
  orders: Order[];
  inventory: InventoryItem[];
  onUpdateStatus: (id: string, status: Restaurant['status']) => void;
  onBack: () => void;
}

export default function DiagnosticView({ 
  restaurant, 
  employees, 
  orders, 
//   inventory, 
  onUpdateStatus, 
  onBack 
}: DiagnosticViewProps) {
  
  // Performance: Memoize specific child records so they don't recalculate unnecessarily 
  const storeEmployees = useMemo(() => 
    employees.filter(e => e.restaurantId === restaurant.id), 
  [employees, restaurant.id]);

  const storeOrders = useMemo(() => 
    orders.filter(o => o.restaurantId === restaurant.id), 
  [orders, restaurant.id]);

  return (
    <div className="space-y-6 animate-fade-in p-6">
      
      {/* Back navigation & diagnostic title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer"
            id="btn-back-to-franchise-grid"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900/50 text-zinc-400">
                {restaurant.id}
              </span>
              <span className="text-[10px] uppercase font-mono text-zinc-500 font-bold">Node Active Diagnostics</span>
            </div>
            <h2 className="text-xl font-semibold text-white tracking-tight">{restaurant.name}</h2>
          </div>
        </div>

        {/* Core Interactive Node Status Controller */}
        <div className="flex items-center gap-2.5 bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/80">
          <span className="text-[10px] font-mono text-zinc-400 px-2 uppercase">Core Pulse:</span>
          <div className="flex gap-1.5">
            {(['Operational', 'Maintenance', 'Suspended'] as const).map((status) => (
              <button
                key={status}
             onClick={() => onUpdateStatus(restaurant.id, status as Restaurant['status'])}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono uppercase transition-all cursor-pointer ${
                  restaurant.status === status
                    ? status === 'Operational' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      status === 'Maintenance' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                }`}
                id={`btn-node-status-${status}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Diagnostic KPI grids specific to node */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold">Node 30-Day Volume</span>
            <h4 className="text-lg font-bold text-emerald-400 font-mono">${restaurant.revenueMonth.toLocaleString()}</h4>
            <p className="text-[10px] text-zinc-500">24H Revenue: ${restaurant.revenue24h.toLocaleString()}</p>
          </div>
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
            <BarChart className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold">Assigned Team</span>
            <h4 className="text-lg font-bold text-white">{storeEmployees.length} active FTEs</h4>
            <p className="text-[10px] text-zinc-500">Lead Manager: {restaurant.manager}</p>
          </div>
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold">Open Tickets / Alerts</span>
            <h4 className="text-lg font-bold text-white">
              {restaurant.openOrders} tickets <span className="text-rose-400 text-xs">/ {restaurant.inventoryAlerts} alarms</span>
            </h4>
            <p className="text-[10px] text-zinc-500">System heartbeat online</p>
          </div>
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Grid split: General Diagnostic logs, and staff roster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Diagnostic Details Left Column */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* General Metadata Card */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono text-zinc-400 pb-2 border-b border-zinc-800">Node Connection Metas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-zinc-500 block">General Manager</span>
                <div className="flex items-center gap-2 text-white">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold">{restaurant.manager}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-500 block">Node Location Link</span>
                <div className="flex items-center gap-2 text-white">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{restaurant.address}, {restaurant.city}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-500 block">Central VoIP Line</span>
                <div className="flex items-center gap-2 text-white font-mono">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{restaurant.phone}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-500 block">System Rating Rating</span>
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span className="font-mono font-bold text-white">{restaurant.rating || 'N/A'}</span>
                  <span className="text-[10px] text-zinc-500">/ 5.0 franchise bar</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Ledger Activity */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono text-zinc-400">Real-Time POS Receipts Stream</h3>
            
            {storeOrders.length === 0 ? (
              <div className="py-6 text-center text-zinc-500 font-mono text-[11px]">
                No active orders recorded for this node in past 24h.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] font-mono">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500">
                      <th className="pb-2">Order ID</th>
                      <th className="pb-2">Items Count</th>
                      <th className="pb-2">Fulfillment</th>
                      <th className="pb-2">Total Amount</th>
                      <th className="pb-2 text-right">Receipt Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 text-zinc-300">
                    {storeOrders.map((o) => (
                      <tr key={o.id}>
                        <td className="py-2.5 text-white font-medium">{o.id}</td>
                        <td className="py-2.5">{o.items.reduce((sum, i) => sum + i.quantity, 0)} units</td>
                        <td className="py-2.5">
                          <span className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 text-[10px]">
                            {o.type}
                          </span>
                        </td>
                        <td className="py-2.5 font-bold text-emerald-400">${o.total.toFixed(2)}</td>
                        <td className="py-2.5 text-right">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            o.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
                            o.status === 'Preparing' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-zinc-500/10 text-zinc-400'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Node Operations */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Alarm logs specific to store */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono text-zinc-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>Node Active Alarm Triggers</span>
            </h3>
            
            {restaurant.inventoryAlerts === 0 ? (
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex gap-3 items-center text-xs text-emerald-400">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <div>
                  <span className="font-semibold block">All Core Systems OK</span>
                  <span className="text-[10px] text-zinc-500">Zero inventory depletion alerts logged.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl flex gap-3 items-start text-xs text-amber-400">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Supplies Below Critical Limit</span>
                    <p className="text-[11px] text-zinc-400 mt-1">Matcha Lava Cake ingredients are reaching threshold limits. Schedule delivery soon.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Employee quick table roster */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono text-zinc-400">Active Roster Checkin</h3>
            <div className="space-y-3">
              {storeEmployees.map((e) => (
                <div key={e.id} className="flex justify-between items-center p-2.5 rounded-xl bg-zinc-900/30 border border-zinc-800 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-white block">{e.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{e.role} • {e.shift}</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-950 text-emerald-400 border border-emerald-500/20 font-mono text-[9px] uppercase">
                    {e.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}