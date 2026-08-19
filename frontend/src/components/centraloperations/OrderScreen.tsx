"use client";
import React, { useState, useMemo } from 'react';
import { Order, Restaurant } from '@/utils/types';
import OrderMetrics from '@/elements/fullfilment/OrderMetrics';
import OrderControls from '@/elements/fullfilment/OrderControls';
import OrderTable from '@/elements/fullfilment/OrderTable';
import OrderInvoiceDrawer from '@/elements/fullfilment/OrderInvoiceDrawer';

type OrderStatusFilter = 'All' | Order['status'];

interface OrderScreenProps {
  orders: Order[];
  searchTerm: string;
  restaurants: Restaurant[];
}

export default function OrderScreen({ orders, searchTerm, restaurants }: OrderScreenProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatusFilter>('All');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('All');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Memoized filter calculation
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            o.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            o.cashierName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'All' || o.status === selectedStatus;
      const matchesRestaurant = selectedRestaurantId === 'All' || o.restaurantId === selectedRestaurantId;
      return matchesSearch && matchesStatus && matchesRestaurant;
    });
  }, [orders, searchTerm, selectedStatus, selectedRestaurantId]);

  // Memoized stats calculation
  const { totalVolume, avgTicket, activeOrdersCount } = useMemo(() => {
    const franchiseOrders = orders.filter(o => selectedRestaurantId === 'All' || o.restaurantId === selectedRestaurantId);
    const volume = franchiseOrders.reduce((acc, o) => acc + o.total, 0);
    const avg = (volume / (franchiseOrders.length || 1)).toFixed(2);
    const active = franchiseOrders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length;

    return { totalVolume: volume, avgTicket: avg, activeOrdersCount: active };
  }, [orders, selectedRestaurantId]);

  const activeOrder = useMemo(() => {
    return orders.find(o => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  return (
    <div className="space-y-6 animate-fade-in p-6">
      
      <OrderMetrics 
        totalVolume={totalVolume}
        avgTicket={avgTicket}
        activeOrdersCount={activeOrdersCount}
      />

      <OrderControls 
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        selectedRestaurantId={selectedRestaurantId}
        onSelectRestaurant={setSelectedRestaurantId}
        restaurants={restaurants}
        filteredCount={filteredOrders.length}
      />

      <OrderTable 
        orders={filteredOrders}
        onSelectOrder={setSelectedOrderId}
      />

      <OrderInvoiceDrawer 
        order={activeOrder}
        onClose={() => setSelectedOrderId(null)}
      />

    </div>
  );
}