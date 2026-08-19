'use client';
import React, { useState } from 'react';
import { createPortal } from 'react-dom'; // <-- 1. Imported createPortal
import { Users, X } from 'lucide-react';
import { Restaurant, Employee } from '../../utils/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  restaurants: Restaurant[];
  onAddEmployee: (emp: Partial<Employee>) => void;
}

export default function EmployeeRegistrationDrawer({ isOpen, onClose, restaurants, onAddEmployee }: Props) {
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<Employee['role']>('Cashier');
  const [newRestaurantId, setNewRestaurantId] = useState(restaurants[0]?.id || 'R-101');
  const [newShift, setNewShift] = useState<Employee['shift']>('Morning');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSalary, setNewSalary] = useState(45000);

  // 2. Safe check for Next.js SSR (Server-Side Rendering)
  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    const matchedRest = restaurants.find(r => r.id === newRestaurantId);
    
    onAddEmployee({
      name: newName,
      role: newRole,
      restaurantId: newRestaurantId,
      restaurantName: matchedRest ? matchedRest.name : 'FoodMatrix Downtown',
      status: 'Active',
      shift: newShift,
      email: newEmail,
      phone: newPhone || '(415) 555-0100',
      salary: Number(newSalary),
      performance: 'Satisfactory'
    });

    // Reset fields
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewSalary(45000);
    onClose();
  };

  // 3. Wrap the return JSX in createPortal and target document.body
  return createPortal(
    // 4. Changed z-100 to z-[9999] to guarantee it sits on top of everything
    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm flex justify-end z-[9999]">
      <div className="flex-1 cursor-pointer" onClick={onClose} />
      <div className="w-full max-w-md bg-[#09090b] border-l border-zinc-800 h-full p-6 flex flex-col shadow-2xl overflow-y-auto animate-slide-in-right">
        
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Register New Operator</h3>
              <p className="text-[10px] text-zinc-400 font-mono font-bold">SECURE CONTRACT ASSIGNMENT</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-4 flex-1">
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Rachel Adams"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Operational Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as Employee['role'])}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              >
                <option value="Store Manager">Store Manager</option>
                <option value="Head Chef">Head Chef</option>
                <option value="Sous Chef">Sous Chef</option>
                <option value="Line Cook">Line Cook</option>
                <option value="Cashier">Cashier</option>
                <option value="Server">Server</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Target Shift</label>
              <select
                value={newShift}
                onChange={(e) => setNewShift(e.target.value as Employee['shift'])}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              >
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Connected Franchise Hub</label>
            <select
              value={newRestaurantId}
              onChange={(e) => setNewRestaurantId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50"
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Operator Email (LDAP)</label>
            <input
              type="email"
              placeholder="rachel.a@foodmatrix.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Mobile Connection</label>
              <input
                type="text"
                placeholder="(415) 555-0199"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Annual Wage Base ($)</label>
              <input
                type="number"
                value={newSalary}
                onChange={(e) => setNewSalary(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1.5 text-[11px] text-zinc-400">
            <span className="font-mono text-[9px] text-zinc-500 block font-bold">SECURITY PROTOCOL INFO</span>
            <p>Registering operators establishes automatic entry into regional POS terminals with default password configurations synced to standard SSO LDAP servers.</p>
          </div>

          <div className="pt-6 border-t border-zinc-800 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800/80 text-zinc-300 text-xs font-medium rounded-xl border border-zinc-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold rounded-xl shadow-lg cursor-pointer"
            >
              Assign Operator
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body // <-- Attached directly to the body!
  );
}