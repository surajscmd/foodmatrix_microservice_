"use client";
import React from 'react';
import { Flame, Trash2 } from 'lucide-react'; // 
import { MenuItem } from '@/utils/types';
import { calculateMarginRate } from '@/utils/constants';

interface MenuTableProps {
  items: MenuItem[];
  onToggleStatus: (id: string, newStatus: MenuItem['status']) => void;
  onDeleteMenuItem: (id: string) => void; // <-- ADDED THIS
}

export default function MenuTable({ items, onToggleStatus, onDeleteMenuItem }: MenuTableProps) {
  if (items.length === 0) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden p-12 text-center text-zinc-500 font-mono text-xs">
        No culinary assets catalogued in this category.
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 font-mono text-[10px] uppercase font-bold">
              <th className="py-3.5 px-5">Dish Identifier</th>
              <th className="py-3.5 px-5">Culinary Recipe Detail</th>
              <th className="py-3.5 px-5">Operational Segment</th>
              <th className="py-3.5 px-5">Price (POS)</th>
              <th className="py-3.5 px-5">Net Margin Rating</th>
              <th className="py-3.5 px-5">30D Volume</th>
              <th className="py-3.5 px-5">Prep Velocity</th>
              {/* Changed Header title to reflect the new Action */}
              <th className="py-3.5 px-5 text-right">Status / Actions</th> 
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850 text-zinc-300">
            {items.map((item) => {
              const marginVal = item.price - item.cost;
              const marginPct = calculateMarginRate(item.price, item.cost);
              
              return (
                <tr key={item.id} className="hover:bg-zinc-900/20 transition-colors">
                  <td className="py-3 px-5 font-mono text-zinc-400 font-medium">{item.id}</td>
                  <td className="py-3 px-5 max-w-xs">
                    <div className="font-semibold text-white">{item.name}</div>
                    <p className="text-[10px] text-zinc-500 truncate">{item.description}</p>
                  </td>
                  <td className="py-3 px-5">
                    <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 text-[10px] font-bold">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-5 font-mono font-semibold text-zinc-200">${item.price.toFixed(2)}</td>
                  <td className="py-3 px-5 font-mono">
                    <div className="text-emerald-400 font-bold">${marginVal.toFixed(2)}</div>
                    <div className="text-[9px] text-zinc-500">({marginPct.toFixed(0)}% yield)</div>
                  </td>
                  <td className="py-3 px-5">
                    <div className="font-mono text-zinc-300">{item.sales30d.toLocaleString()} sold</div>
                    <span className={`inline-flex items-center gap-0.5 px-1 rounded text-[9px] font-bold ${
                      item.popularity === 'High' ? 'text-emerald-400' :
                      item.popularity === 'Medium' ? 'text-blue-400' : 'text-zinc-500'
                    }`}>
                      <Flame className="w-2.5 h-2.5 fill-current" />
                      {item.popularity} Popularity
                    </span>
                  </td>
                  <td className="py-3 px-5 font-mono text-zinc-400">{item.prepTime} mins</td>
                  
                  {/* Actions Column */}
                  <td className="py-3 px-5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <select
                        value={item.status}
                        onChange={(e) => onToggleStatus(item.id, e.target.value as MenuItem['status'])}
                        className={`bg-zinc-950 border border-zinc-800 text-[10px] font-mono font-bold rounded px-2 py-1 focus:outline-none cursor-pointer ${
                          item.status === 'Available' ? 'text-emerald-400 border-emerald-500/20' :
                          item.status === 'Sold Out' ? 'text-rose-400 border-rose-500/20' :
                          item.status === 'Seasonal' ? 'text-amber-400 border-amber-500/20' :
                          'text-zinc-500 border-zinc-800'
                        }`}
                      >
                        <option value="Available">Available</option>
                        <option value="Sold Out">Sold Out</option>
                        <option value="Seasonal">Seasonal</option>
                        <option value="Discontinued">Discontinued</option>
                      </select>
                      
                      {/* NEW Delete Button */}
                      <button
                        onClick={() => onDeleteMenuItem(item.id)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-400/10 rounded transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}