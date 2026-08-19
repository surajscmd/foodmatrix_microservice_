"use client";
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Truck, Plus, X } from 'lucide-react';
import { Supplier } from '@/utils/types';

interface AddSupplierDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newSupplier: Partial<Supplier>) => void;
}

export default function AddSupplierDrawer({ isOpen, onClose, onSubmit }: AddSupplierDrawerProps) {
  const [newName, setNewName] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCategory, setNewCategory] = useState('Produce');

  if (!isOpen || typeof document === 'undefined') return null;

  const handleClose = () => {
    setNewName('');
    setNewContact('');
    setNewPhone('');
    setNewEmail('');
    setNewCategory('Produce');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onSubmit({
      name: newName,
      contactName: newContact,
      phone: newPhone,
      email: newEmail,
      category: newCategory
    });

    handleClose();
  };

  return createPortal(
    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm flex justify-end z-[9999]">
      <div className="flex-1 cursor-pointer" onClick={handleClose} />
      <div className="w-full max-w-md bg-[#09090b] border-l border-zinc-800 h-full p-6 flex flex-col shadow-2xl overflow-y-auto animate-slide-in-right">
        
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Register Sourcing Partner</h3>
              <p className="text-[10px] text-zinc-400 font-mono font-bold">FRANCHISE SUPPLIER CONTRACT</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1">
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Supplier / Business Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Apex Meat Distributors"
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Sourcing Category</label>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="e.g. Meat & Poultry, Organic Produce"
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Key Account Executive</label>
            <input
              type="text"
              value={newContact}
              onChange={(e) => setNewContact(e.target.value)}
              placeholder="e.g. Marcus Sterling"
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Corporate Phone Line</label>
            <input
              type="text"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="e.g. (800) 555-0102"
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Contract Email Gateway</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="e.g. orders@apexmeat.com"
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="pt-6 border-t border-zinc-800 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800/80 text-zinc-300 text-xs font-medium rounded-xl border border-zinc-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-zinc-950" />
              <span>Register Partner</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}