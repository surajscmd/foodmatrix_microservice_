"use client";

import { useState, useMemo } from 'react';
import { Restaurant } from '../../utils/types'; 

// Import your Mock Data
import { 
  initialRestaurants, 
  initialEmployees, 
  initialOrders, 
  initialInventory 
} from '../../utils/mockData';

// Import Sub-Components
import FranchiseKPIs from '../../elements/Restaurantscreen/FranchiseKPIs';
import FilterBar from '../../elements/Restaurantscreen/FilterBar';
import RestaurantGrid from '../../elements/Restaurantscreen/RestaurantGrid';
import DiagnosticView from '../../elements/Restaurantscreen/DiagnosticView';
import AddRestaurantDrawer from '../../elements/Restaurantscreen/AddRestaurantDrawer';

// 1. We ONLY expect searchTerm from page.tsx
interface RestaurantScreenProps {
  searchTerm: string; 
}

export default function RestaurantScreen({ searchTerm }: RestaurantScreenProps) {
  
  // 2. We load the mock data directly into state here, adding a fallback `|| []` just in case
  const [restaurants, setRestaurants] = useState<Restaurant[]>(initialRestaurants || []);
  
  // UI States
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [regionFilter, setRegionFilter] = useState<'All' | 'East' | 'West' | 'Midwest' | 'South'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Operational' | 'Maintenance' | 'Opening Soon'>('All');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Actions
  const handleUpdateStatus = (id: string, newStatus: Restaurant['status']) => {
    setRestaurants(prev => prev.map(r => 
      r.id === id ? { ...r, status: newStatus } : r
    ));
  };

  const handleAddRestaurant = (newStore: Partial<Restaurant>) => {
    const newId = `R-10${restaurants.length + 1}`;
    const completeStore: Restaurant = {
      id: newId,
      name: newStore.name || '',
      region: newStore.region || 'East',
      status: newStore.status || 'Opening Soon',
      manager: newStore.manager || '',
      revenue24h: newStore.revenue24h || 0,
      revenueMonth: newStore.revenueMonth || 0,
      employeeCount: newStore.employeeCount || 1,
      openOrders: newStore.openOrders || 0,
      inventoryAlerts: newStore.inventoryAlerts || 0,
      rating: newStore.rating || 0,
      address: newStore.address || '',
      phone: newStore.phone || '',
      city: newStore.city || ''
    };
    setRestaurants(prev => [...prev, completeStore]);
  };

  // Safe Find: If restaurants is somehow empty, it won't crash
  const activeRestaurant = useMemo(() => {
    return restaurants?.find(r => r.id === selectedId) || undefined;
  }, [restaurants, selectedId]);

  // Safe Filter
  const filteredList = useMemo(() => {
    if (!restaurants) return [];
    return restaurants.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            r.manager.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            r.city.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRegion = regionFilter === 'All' || r.region === regionFilter;
      const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
      return matchesSearch && matchesRegion && matchesStatus;
    });
  }, [restaurants, searchTerm, regionFilter, statusFilter]);

  // Safe KPIs
  const kpis = useMemo(() => {
    if (!restaurants || restaurants.length === 0) {
      return { totalStores: 0, operationalCount: 0, avgRating: "0.0", totalRevenue: 0 };
    }
    const totalStores = restaurants.length;
    const operationalCount = restaurants.filter(r => r.status === 'Operational').length;
    const totalRating = restaurants.reduce((acc, r) => acc + (r.rating || 0), 0);
    const ratedCount = restaurants.filter(r => r.rating > 0).length || 1;
    const avgRating = (totalRating / ratedCount).toFixed(1);
    const totalRevenue = restaurants.reduce((acc, r) => acc + (r.revenueMonth || 0), 0);
    
    return { totalStores, operationalCount, avgRating, totalRevenue };
  }, [restaurants]);


  if (activeRestaurant) {
    return (
      <DiagnosticView 
        restaurant={activeRestaurant}
        employees={initialEmployees || []}
        orders={initialOrders || []}
        inventory={initialInventory || []}
        onUpdateStatus={handleUpdateStatus}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in p-6">
        <FranchiseKPIs kpis={kpis} />
        
        <FilterBar 
          regionFilter={regionFilter} 
          setRegionFilter={setRegionFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onOpenDrawer={() => setIsDrawerOpen(true)}
        />

        <RestaurantGrid 
          restaurants={filteredList} 
          onSelect={setSelectedId} 
        />
      </div>

      <AddRestaurantDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        onAddRestaurant={handleAddRestaurant} 
      />
    </>
  );
}