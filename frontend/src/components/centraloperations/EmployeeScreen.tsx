'use client';
import React, { useState } from 'react';
import { Employee, Restaurant, Shift, AttendanceLog } from '../../utils/types';
import EmployeeAttendanceTracker from '@/elements/employee/EmployeeAttendanceTracker';
import EmployeeStatsGrid from '@/elements/employee/EmployeeStatsGrid';
import EmployeeTable from '@/elements/employee/EmployeeTable';
import EmployeeFilters from '@/elements/employee/EmployeeFilters';
import EmployeeRegistrationDrawer from '@/elements/employee/EmployeeRegistrationDrawer';


interface EmployeeScreenProps {
  employees: Employee[];
  restaurants: Restaurant[];
  shifts: Shift[];
  attendanceLogs: AttendanceLog[];
  onAddEmployee: (newEmployee: Partial<Employee>) => void;
  searchTerm: string;
}

export default function EmployeeScreen({
  employees,
  restaurants,
  shifts,
  attendanceLogs,
  onAddEmployee,
  searchTerm
}: EmployeeScreenProps) {
  // Main View States
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [franchiseFilter, setFranchiseFilter] = useState<string>('All');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Navigation State
  const [trackerEmp, setTrackerEmp] = useState<Employee | null>(null);

  // Data processing
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.restaurantName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All' || emp.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;
    const matchesFranchise = franchiseFilter === 'All' || emp.restaurantId === franchiseFilter;
    return matchesSearch && matchesRole && matchesStatus && matchesFranchise;
  });

  const statsEmployees = employees.filter(e => franchiseFilter === 'All' || e.restaurantId === franchiseFilter);

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {trackerEmp ? (
        <EmployeeAttendanceTracker
          trackerEmp={trackerEmp}
          setTrackerEmp={setTrackerEmp}
          employees={employees}
          shifts={shifts}
          attendanceLogs={attendanceLogs}
        />
      ) : (
        <>
          <EmployeeStatsGrid employees={statsEmployees} />
          
          <EmployeeFilters
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            franchiseFilter={franchiseFilter}
            setFranchiseFilter={setFranchiseFilter}
            restaurants={restaurants}
            onOpenDrawer={() => setIsDrawerOpen(true)}
          />

          <EmployeeTable 
            employees={filteredEmployees} 
            onSelectEmployee={setTrackerEmp} 
          />
        </>
      )}

      <EmployeeRegistrationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        restaurants={restaurants}
        onAddEmployee={onAddEmployee}
      />
    </div>
  );
}