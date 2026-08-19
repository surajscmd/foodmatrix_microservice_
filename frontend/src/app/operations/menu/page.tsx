"use client";
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { MenuItem } from '@/utils/types'; 
import MenuScreen from '@/components/centraloperations/MenuScreen';
import { initialMenuItems } from '@/utils/mockData';


export default function MenuManagementPage() {
  // 2. Global State
  const [items, setItems] = useState<MenuItem[]>(initialMenuItems);
  const [searchTerm, setSearchTerm] = useState('');

  // 3. Handlers
  const handleAddMenuItem = (newItemData: Partial<MenuItem>) => {
    const newItem: MenuItem = {
      ...newItemData,
      id: `MNU-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`, // Generate dummy ID
      name: newItemData.name || 'Unnamed Dish',
      category: newItemData.category || 'Mains',
      price: newItemData.price || 0,
      cost: newItemData.cost || 0,
      status: newItemData.status || 'Available',
      description: newItemData.description || '',
      popularity: newItemData.popularity || 'Medium',
      sales30d: newItemData.sales30d || 0,
      prepTime: newItemData.prepTime || 10,
    } as MenuItem;

    setItems((prev) => [newItem, ...prev]);
  };

  const handleToggleStatus = (id: string, newStatus: MenuItem['status']) => {
    setItems((prev) => 
      prev.map((item) => 
        item.id === id ? { ...item, status: newStatus } : item
      )
    );
  };

  const handleDeleteMenuItem = (id: string) => {
    // Optional: Add a confirmation dialog here in the future
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen text-zinc-300 font-sans">
      
      {/* Top Navigation / Header */}
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4 sticky top-0 z-10">
        <div className="max-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Menu Command Center</h1>
            <p className="text-xs text-zinc-500 font-mono mt-1">HQ SYNC TERMINAL v2.1</p>
          </div>

          {/* Global Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text"
              placeholder="Search dishes or ingredients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-full pb-12">
        <MenuScreen 
          menuItems={items}
          searchTerm={searchTerm}
          onAddMenuItem={handleAddMenuItem}
          onToggleStatus={handleToggleStatus}
          onDeleteMenuItem={handleDeleteMenuItem}
        />
      </main>

    </div>
  );
}