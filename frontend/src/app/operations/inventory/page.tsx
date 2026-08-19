"use client";
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { InventoryItem, Supplier } from '@/utils/types';
import InventoryScreen from '@/components/centraloperations/InventoryScreen';

import { initialInventory, initialSuppliers } from '@/utils/mockData'; 

export default function InventoryManagementPage() {
  // Use the imported mock data as initial state
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [suppliers] = useState<Supplier[]>(initialSuppliers); 
  const [searchTerm, setSearchTerm] = useState('');

  const handleRestock = (id: string, qty: number) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + qty;
        // Automatically calculate new status based on restock
        const newStatus = newQuantity === 0 ? 'Out of Stock' 
                          : newQuantity <= item.minThreshold ? 'Low Stock' 
                          : 'In Stock';
                          
        return {
          ...item,
          quantity: newQuantity,
          status: newStatus,
          lastRestocked: 'Just now'
        };
      }
      return item;
    }));
  };

  const handleAddInventoryItem = (newItemData: Partial<InventoryItem>) => {
    const matchedSupplier = suppliers.find(s => s.id === newItemData.supplierId);
    
    const initialQty = newItemData.quantity || 0;
    const initialMin = newItemData.minThreshold || 0;
    const initialStatus = initialQty === 0 ? 'Out of Stock' 
                        : initialQty <= initialMin ? 'Low Stock' 
                        : 'In Stock';

    const newItem: InventoryItem = {
      ...newItemData,
      id: `INV-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      name: newItemData.name || 'Unknown Asset',
      category: newItemData.category || 'Produce',
      quantity: initialQty,
      unit: newItemData.unit || 'pcs',
      minThreshold: initialMin,
      unitCost: newItemData.unitCost || 0,
      status: initialStatus,
      supplierId: matchedSupplier?.id || 'SUP-000',
      supplierName: matchedSupplier?.name || 'Unknown Supplier',
      lastRestocked: 'Just added',
    } as InventoryItem;

    setInventory(prev => [newItem, ...prev]);
  };

  const handleDeleteInventoryItem = (id: string) => {
    setInventory(prev => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen text-zinc-300 font-sans">
      
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4 sticky top-0 z-10">
        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Logistics & Supply</h1>
            <p className="text-xs text-zinc-500 font-mono mt-1">INVENTORY TRACKING NODE</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text"
              placeholder="Search assets or suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

        </div>
      </header>

      <main className="w-full pb-12">
        <InventoryScreen 
          inventory={inventory}
          suppliers={suppliers}
          searchTerm={searchTerm}
          onRestock={handleRestock}
          onAddInventoryItem={handleAddInventoryItem}
          onDeleteInventoryItem={handleDeleteInventoryItem}
        />
      </main>

    </div>
  );
}