"use client";
import React from 'react';
import { Order } from '@/utils/types';

interface OrderTableProps {
  orders: Order[];
  onSelectOrder: (id: string) => void;
}

export default function OrderTable({ orders, onSelectOrder }: OrderTableProps) {
  if (orders.length === 0) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden p-12 text-center text-zinc-500 font-mono text-xs">
        No matching transaction records stored in this ledger node.
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 font-mono text-[10px] uppercase font-bold">
              <th className="py-3.5 px-5">Receipt ID</th>
              <th className="py-3.5 px-5">Franchise Node Location</th>
              <th className="py-3.5 px-5">Culinary Assets Ordered</th>
              <th className="py-3.5 px-5">Fulfillment Type</th>
              <th className="py-3.5 px-5">Process Timestamp</th>
              <th className="py-3.5 px-5">Cashier Agent</th>
              <th className="py-3.5 px-5">Gross Amount</th>
              <th className="py-3.5 px-5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850 text-zinc-300">
            {orders.map((o) => (
              <tr 
                key={o.id} 
                className="hover:bg-zinc-900/20 transition-colors cursor-pointer"
                onClick={() => onSelectOrder(o.id)}
              >
                <td className="py-3.5 px-5 font-mono text-zinc-400 font-medium">{o.id}</td>
                <td className="py-3.5 px-5">
                  <div className="font-semibold text-white">{o.restaurantName}</div>
                  <div className="text-[10px] text-zinc-500 font-mono">Node ID: {o.restaurantId}</div>
                </td>
                <td className="py-3.5 px-5 max-w-xs truncate">
                  {o.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                </td>
                <td className="py-3.5 px-5">
                  <span className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 text-[10px] font-bold">
                    {o.type}
                  </span>
                </td>
                <td className="py-3.5 px-5 font-mono text-slate-400">
                  {o.timestamp}
                </td>
                <td className="py-3.5 px-5 text-slate-400">
                  {o.cashierName}
                </td>
                <td className="py-3.5 px-5 font-mono font-bold text-emerald-400">
                  ${o.total.toFixed(2)}
                </td>
                <td className="py-3.5 px-5 text-right">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    o.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    o.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    <span className={`w-1 h-1 rounded-full ${
                      o.status === 'Completed' ? 'bg-emerald-400' :
                      o.status === 'Cancelled' ? 'bg-rose-400' :
                      'bg-amber-400'
                    }`} />
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}