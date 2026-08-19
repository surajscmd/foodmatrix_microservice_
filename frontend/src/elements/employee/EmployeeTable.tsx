import React from 'react';
import { ArrowUpRight, Building, Award, Mail, Phone } from 'lucide-react';
import { Employee } from '../../utils/types';

interface Props {
  employees: Employee[];
  onSelectEmployee: (emp: Employee) => void;
}

export default function EmployeeTable({ employees, onSelectEmployee }: Props) {
  if (employees.length === 0) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden p-12 text-center text-zinc-500 font-mono text-xs">
        No matching operators registered in our Active Directory index.
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-500 font-mono text-[10px] uppercase font-bold">
            <th className="py-3.5 px-5">ID</th>
            <th className="py-3.5 px-5">Operator Name</th>
            <th className="py-3.5 px-5">Franchise Site</th>
            <th className="py-3.5 px-5">Role/Shift</th>
            <th className="py-3.5 px-5">Performance Gauge</th>
            <th className="py-3.5 px-5">Salary bracket</th>
            <th className="py-3.5 px-5">Contact Hub</th>
            <th className="py-3.5 px-5">Roster Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-850 text-zinc-300">
          {employees.map((emp) => (
            <tr 
              key={emp.id} 
              onClick={() => onSelectEmployee(emp)}
              className="hover:bg-zinc-900/40 transition-colors cursor-pointer group"
            >
              <td className="py-3 px-5 font-mono text-zinc-400 font-medium">{emp.id}</td>
              
              <td className="py-3 px-5">
                <div className="font-semibold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <span>{emp.name}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">{emp.email}</div>
              </td>
              
              <td className="py-3 px-5">
                <div className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="font-medium">{emp.restaurantName}</span>
                </div>
              </td>
              
              <td className="py-3 px-5">
                <div>{emp.role}</div>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-950 border border-zinc-800 text-zinc-400 mt-0.5 font-bold">
                  {emp.shift} Shift
                </span>
              </td>
              
              <td className="py-3 px-5">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  emp.performance === 'Outstanding' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  emp.performance === 'Satisfactory' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  <Award className="w-3 h-3" />
                  {emp.performance}
                </span>
              </td>
              
              <td className="py-3 px-5 font-mono text-zinc-200">
                ${emp.salary.toLocaleString()}/yr
              </td>
              
              <td className="py-3 px-5 font-mono text-[10px] text-zinc-400 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-zinc-600" />
                  <span>{emp.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-zinc-600" />
                  <span>{emp.phone}</span>
                </div>
              </td>
              
              <td className="py-3 px-5">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  emp.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  emp.status === 'On Leave' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  <span className={`w-1 h-1 rounded-full ${
                    emp.status === 'Active' ? 'bg-emerald-400' :
                    emp.status === 'On Leave' ? 'bg-amber-400' :
                    'bg-rose-400'
                  }`} />
                  {emp.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}