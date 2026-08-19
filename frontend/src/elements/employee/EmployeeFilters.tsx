'use client';
import React from 'react';
import { UserPlus } from 'lucide-react';
import { Restaurant } from '../../utils/types';

interface EmployeeFiltersProps {
  roleFilter: string;
  setRoleFilter: (role: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  franchiseFilter: string;
  setFranchiseFilter: (franchise: string) => void;
  restaurants: Restaurant[];
  onOpenDrawer: () => void;
}

export default function EmployeeFilters({
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  franchiseFilter,
  setFranchiseFilter,
  restaurants,
  onOpenDrawer,
}: EmployeeFiltersProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800">
      <div className="flex flex-wrap items-center gap-4">
        {/* Role Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-500 font-bold">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500/50 text-zinc-200"
            id="select-role-filter"
          >
            <option value="All">All Roles</option>
            <option value="Store Manager">Store Managers</option>
            <option value="Head Chef">Head Chefs</option>
            <option value="Sous Chef">Sous Chefs</option>
            <option value="Line Cook">Line Cooks</option>
            <option value="Cashier">Cashiers</option>
            <option value="Server">Servers</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-500 font-bold">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500/50 text-zinc-200"
            id="select-status-filter"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        {/* Franchise Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-500 font-bold">Franchise:</span>
          <select
            value={franchiseFilter}
            onChange={(e) => setFranchiseFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500/50 text-zinc-200"
            id="select-franchise-filter"
          >
            <option value="All">All Franchises</option>
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onOpenDrawer}
        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold rounded-xl cursor-pointer"
        id="btn-open-employee-drawer"
      >
        <UserPlus className="w-3.5 h-3.5" />
        <span>Register Operator</span>
      </button>
    </div>
  );
}