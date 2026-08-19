"use client";
import React, { useState, useMemo } from 'react';
import { MenuItem } from '@/utils/types';
import { calculateMarginRate } from '@/utils/constants';
import MenuMetrics from '@/elements/menu/MenuMetrics';
import MenuControls from '@/elements/menu/MenuControls';
import MenuTable from '@/elements/menu/MenuTable';
import AddMenuItemDrawer from '@/elements/menu/AddMenuItemDrawer';

interface MenuScreenProps {
  menuItems: MenuItem[];
  onAddMenuItem: (newItem: Partial<MenuItem>) => void;
  onToggleStatus: (id: string, newStatus: MenuItem['status']) => void;
  onDeleteMenuItem: (id: string) => void; 
  searchTerm: string;
}

export default function MenuScreen({ 
  menuItems, 
  onAddMenuItem,
  onToggleStatus,
  onDeleteMenuItem, 
  searchTerm
}: MenuScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchTerm, selectedCategory]);

  const stats = useMemo(() => {
    const totalItems = menuItems.length || 1;
    const avgMargin = menuItems.reduce((acc, item) => acc + calculateMarginRate(item.price, item.cost), 0) / totalItems;
    const totalSales = menuItems.reduce((acc, item) => acc + item.sales30d, 0);
    const avgPrepTime = (menuItems.reduce((acc, item) => acc + item.prepTime, 0) / totalItems).toFixed(1);

    return { avgMargin, totalSales, avgPrepTime };
  }, [menuItems]);

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <MenuMetrics 
        totalItems={menuItems.length}
        avgMargin={stats.avgMargin}
        totalSales={stats.totalSales}
        avgPrepTime={stats.avgPrepTime}
      />

      <MenuControls 
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />

      <MenuTable 
        items={filteredItems}
        onToggleStatus={onToggleStatus}
        onDeleteMenuItem={onDeleteMenuItem} // <-- PASSED DOWN
      />

      <AddMenuItemDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={onAddMenuItem}
      />
    </div>
  );
}