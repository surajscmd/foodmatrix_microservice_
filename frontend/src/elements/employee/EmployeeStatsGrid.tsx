'use client';
import React from 'react';
import { Users, UserCheck, DollarSign, Award } from 'lucide-react';
import { Employee } from '../../utils/types';

export default function EmployeeStatsGrid({ employees }: { employees: Employee[] }) {
  const totalFtes = employees.length;
  const activeFtes = employees.filter(e => e.status === 'Active').length;
  const outstandingCount = employees.filter(e => e.performance === 'Outstanding').length;
  const avgSalary = Math.round(employees.reduce((acc, e) => acc + e.salary, 0) / (employees.length || 1));

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Enterprise Roster */}
      <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Enterprise Roster</span>
          <h3 className="text-xl font-semibold text-white mt-1">{totalFtes} FTEs</h3>
        </div>
        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
          <Users className="w-4.5 h-4.5" />
        </div>
      </div>

      {/* Card 2: Active Logged On */}
      <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Active Logged On</span>
          <h3 className="text-xl font-semibold text-emerald-400 mt-1">{activeFtes} on-duty</h3>
        </div>
        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
          <UserCheck className="w-4.5 h-4.5" />
        </div>
      </div>

      {/* Card 3: Avg Salary Index */}
      <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Avg Salary Index</span>
          <h3 className="text-xl font-semibold text-white mt-1">${(avgSalary / 1000).toFixed(1)}k/yr</h3>
        </div>
        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
          <DollarSign className="w-4.5 h-4.5" />
        </div>
      </div>

      {/* Card 4: High Performers */}
      <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">High Performers</span>
          <h3 className="text-xl font-semibold text-amber-400 mt-1">{outstandingCount} operators</h3>
        </div>
        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
          <Award className="w-4.5 h-4.5" />
        </div>
      </div>
    </div>
  );
}