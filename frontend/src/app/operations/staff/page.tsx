'use client';
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import EmployeeScreen from '@/components/centraloperations/EmployeeScreen'; 
import { Employee } from '../../../utils/types';
import { 
  initialEmployees, 
  initialRestaurants, 
  initialShifts, 
  initialAttendance 
} from '../../../utils/mockData';

export default function EmployeesPage() {
  // Initialize state using your comprehensive mock data
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [searchTerm, setSearchTerm] = useState('');

  // Handle adding a new employee from the Drawer
  const handleAddEmployee = (newEmployee: Partial<Employee>) => {
    const employee: Employee = {
      // Generate a mock ID (e.g., EMP-011)
      id: `EMP-0${Math.floor(11 + Math.random() * 89)}`,
      ...(newEmployee as Omit<Employee, 'id'>)
    };
    
    setEmployees((prev) => [...prev, employee]);
  };

  return (
    <div>
      
      {/* Top Navigation Bar / Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/50 px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Staff Registry</h1>
          <p className="text-[11px] text-zinc-500 font-mono mt-0.5">Manage enterprise operators & attendance</p>
        </div>

        {/* Global Search Bar */}
        <div className="relative max-w-sm w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-500" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or hub..."
            className="block w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main>
        <EmployeeScreen
          employees={employees}
          restaurants={initialRestaurants}
          shifts={initialShifts}
          attendanceLogs={initialAttendance}
          onAddEmployee={handleAddEmployee}
          searchTerm={searchTerm}
        />
      </main>
    </div>
  );
}