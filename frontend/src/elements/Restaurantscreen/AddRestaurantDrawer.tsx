"use client";

import { useState } from 'react';
import { Building2, X, Database } from 'lucide-react';
import { Restaurant } from '../../utils/types';

interface AddRestaurantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRestaurant: (newStore: Partial<Restaurant>) => void;
}

export default function AddRestaurantDrawer({ isOpen, onClose, onAddRestaurant }: AddRestaurantDrawerProps) {
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreRegion, setNewStoreRegion] = useState<'East' | 'West' | 'Midwest' | 'South'>('East');
  const [newStoreManager, setNewStoreManager] = useState('');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [newStoreCity, setNewStoreCity] = useState('');
  const [newStorePhone, setNewStorePhone] = useState('');

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName || !newStoreManager) return;

    onAddRestaurant({
      name: newStoreName,
      region: newStoreRegion,
      manager: newStoreManager,
      address: newStoreAddress || '100 Matrix Way',
      city: newStoreCity || 'Seattle',
      phone: newStorePhone || '(800) 555-1234',
      status: 'Opening Soon',
      revenue24h: 0,
      revenueMonth: 0,
      employeeCount: 1,
      openOrders: 0,
      inventoryAlerts: 0,
      rating: 0
    });

    // Reset Form & Close
    setNewStoreName('');
    setNewStoreManager('');
    setNewStoreAddress('');
    setNewStoreCity('');
    setNewStorePhone('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm flex justify-end z-[100]">
      {/* Overlay click to close */}
      <div className="flex-1" onClick={onClose} />
      
      <div className="w-full max-w-md bg-[#0c0c0e] border-l border-zinc-800 h-full p-6 flex flex-col shadow-2xl overflow-y-auto animate-slide-in-right">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Deploy Franchise Site</h3>
              <p className="text-[10px] text-zinc-400 font-mono">FRANCHISE REGISTRATION METRIC</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white"
            id="btn-close-franchise-drawer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4 flex-1">
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Franchise Site Name</label>
            <input
              type="text"
              placeholder="e.g. FoodMatrix Seattle Waterfront"
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              id="input-new-store-name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Target Region</label>
              <select
                value={newStoreRegion}
               onChange={(e) => setNewStoreRegion(e.target.value as 'East' | 'West' | 'Midwest' | 'South')}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                id="select-new-store-region"
              >
                <option value="East">East</option>
                <option value="West">West</option>
                <option value="Midwest">Midwest</option>
                <option value="South">South</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Store Manager</label>
              <input
                type="text"
                placeholder="e.g. Rachel Adams"
                value={newStoreManager}
                onChange={(e) => setNewStoreManager(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                id="input-new-store-manager"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Street Address</label>
            <input
              type="text"
              placeholder="e.g. 1205 Alaskan Way"
              value={newStoreAddress}
              onChange={(e) => setNewStoreAddress(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              id="input-new-store-address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">City</label>
              <input
                type="text"
                placeholder="e.g. Seattle"
                value={newStoreCity}
                onChange={(e) => setNewStoreCity(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                id="input-new-store-city"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Phone Connection</label>
              <input
                type="text"
                placeholder="e.g. (206) 555-0100"
                value={newStorePhone}
                onChange={(e) => setNewStorePhone(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                id="input-new-store-phone"
              />
            </div>
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-xl space-y-2 mt-4 text-[11px] text-zinc-400">
            <div className="flex justify-between text-zinc-500 font-mono text-[9px] uppercase">
              <span>DEPLOYMENT COST</span>
              <span>INFRASTRUCTURE SETUP</span>
            </div>
            <div className="flex items-center gap-2 text-white font-semibold">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sub-second syncing of menu, POS & kitchen nodes</span>
            </div>
            <p>Deploying creates automatic POS registry records, alerts streams, and launches empty kitchen queue loops instantly.</p>
          </div>

          <div className="pt-6 border-t border-zinc-800 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800/80 text-zinc-300 text-xs font-medium rounded-xl border border-zinc-800 cursor-pointer"
              id="btn-cancel-store-drawer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold rounded-xl shadow-lg cursor-pointer"
              id="btn-submit-store-drawer"
            >
              Launch Node
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}