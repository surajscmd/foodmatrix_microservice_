"use client";
import React, { useState, useMemo } from 'react';
import { InventoryItem, Supplier } from '@/utils/types';
import InventoryMetrics from '@/elements/rawmaterial/InventoryMetrics';
import InventoryControls from '@/elements/rawmaterial/InventoryControls';
import InventoryTable from '@/elements/rawmaterial/InventoryTable';
import RestockDrawer from '@/elements/rawmaterial/RestockDrawer';
import AddInventoryDrawer from '@/elements/rawmaterial/AddInventoryDrawer';

interface InventoryScreenProps {
  inventory: InventoryItem[];
  suppliers: Supplier[];
  onRestock: (id: string, qty: number) => void;
  onAddInventoryItem: (newItem: Partial<InventoryItem>) => void;
  onDeleteInventoryItem?: (id: string) => void; // Optional delete prop!
  searchTerm: string;
}

export default function InventoryScreen({ 
  inventory, 
  suppliers, 
  onRestock,
  onAddInventoryItem,
  onDeleteInventoryItem,
  searchTerm
}: InventoryScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  
  // Drawer States
  const [activeRestockItem, setActiveRestockItem] = useState<InventoryItem | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Memoized derived state for filtering
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [inventory, searchTerm, selectedCategory, selectedStatus]);

  // Memoized derived state for KPI stats
  const stats = useMemo(() => {
    const lowStockCount = inventory.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock').length;
    const totalAssetVal = inventory.reduce((acc, i) => acc + (i.quantity * i.unitCost), 0);
    return { lowStockCount, totalAssetVal };
  }, [inventory]);

  return (
    <div className="space-y-6 animate-fade-in p-6">
      
      <InventoryMetrics 
        totalItems={inventory.length}
        lowStockCount={stats.lowStockCount}
        totalAssetVal={stats.totalAssetVal}
      />

      <InventoryControls 
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        activeSuppliersCount={suppliers.filter(s => s.status === 'Active').length}
        onOpenAdd={() => setIsAddOpen(true)}
      />

      <InventoryTable 
        items={filteredInventory}
        onRestockClick={(item) => setActiveRestockItem(item)}
        onDeleteClick={onDeleteInventoryItem}
      />

      <RestockDrawer 
        item={activeRestockItem}
        onClose={() => setActiveRestockItem(null)}
        onSubmit={onRestock}
      />

      <AddInventoryDrawer 
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        suppliers={suppliers}
        onSubmit={onAddInventoryItem}
      />
    </div>
  );
}