"use client";
import React, { useState, useMemo } from 'react';
import { Supplier } from '@/utils/types';
import SupplierControls from '@/elements/supplier/SupplierControls';
import SupplierGrid from '@/elements/supplier/SupplierGrid';
import SupplierDetailModal from '@/elements/supplier/SupplierDetailModal';
import AddSupplierDrawer from '@/elements/supplier/AddSupplierDrawer';

type SupplierStatusFilter = 'All' | Supplier['status'];

interface SupplierScreenProps {
  suppliers: Supplier[];
  onAddSupplier: (newSupplier: Partial<Supplier>) => void;
  searchTerm: string;
}

export default function SupplierScreen({ suppliers, onAddSupplier, searchTerm }: SupplierScreenProps) {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<SupplierStatusFilter>('All');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Memoized for performance to prevent heavy string searching on every unrelated render
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(sup => {
      const matchesSearch = sup.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            sup.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            sup.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || sup.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [suppliers, searchTerm, statusFilter]);

  const activeSupplier = useMemo(() => {
    return suppliers.find(s => s.id === selectedSupplierId) || null;
  }, [suppliers, selectedSupplierId]);

  return (
    <div className="space-y-6 animate-fade-in p-6">
      
      <SupplierControls 
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        filteredCount={filteredSuppliers.length}
        onOpenAdd={() => setIsAddOpen(true)}
      />

      <SupplierGrid 
        suppliers={filteredSuppliers}
        onSelectSupplier={setSelectedSupplierId}
      />

      <SupplierDetailModal 
        supplier={activeSupplier}
        onClose={() => setSelectedSupplierId(null)}
      />

      <AddSupplierDrawer 
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={onAddSupplier}
      />

    </div>
  );
}