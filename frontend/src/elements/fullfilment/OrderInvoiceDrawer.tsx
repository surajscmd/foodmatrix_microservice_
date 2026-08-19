"use client";
import React from 'react';
import { createPortal } from 'react-dom';
import { FileText, X } from 'lucide-react';
import { Order } from '@/utils/types';

interface OrderInvoiceDrawerProps {
  order: Order | null;
  onClose: () => void;
}

export default function OrderInvoiceDrawer({ order, onClose }: OrderInvoiceDrawerProps) {
  if (!order || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm flex justify-end z-[9999]">
      <div className="flex-1 cursor-pointer" onClick={onClose} />
      <div className="w-full max-w-md bg-[#09090b] border-l border-zinc-800 h-full p-6 flex flex-col shadow-2xl overflow-y-auto animate-slide-in-right">
        
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Fulfillment Invoice</h3>
              <p className="text-[10px] text-zinc-400 font-mono font-bold">FRANCHISE POS SYNC LEDGER</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Receipt Summary */}
        <div className="space-y-4 flex-1">
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-xs border-b border-zinc-900 pb-2">
              <span className="font-mono text-[10px] text-zinc-500 font-bold">RECEIPT NO: {order.id}</span>
              <span className="font-mono text-[10px] text-zinc-500 font-bold">STAMP: {order.timestamp}</span>
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-zinc-500 block">Fulfillment Node:</span>
              <span className="font-semibold text-white block">{order.restaurantName}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-zinc-500 block">Operator Cashier:</span>
                <span className="font-medium text-zinc-300 block">{order.cashierName}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Fulfillment Mode:</span>
                <span className="font-medium text-emerald-400 block">{order.type}</span>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Culinary Items</span>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                  <div>
                    <span className="font-semibold text-white block">{item.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{item.quantity} unit{item.quantity > 1 ? 's' : ''} @ ${item.price.toFixed(2)}</span>
                  </div>
                  <span className="font-mono font-bold text-zinc-300">
                    ${(item.quantity * item.price).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total Calculations */}
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-xs space-y-2">
            <div className="flex justify-between text-zinc-400 font-medium">
              <span>Subtotal:</span>
              <span className="font-mono">${(order.total * 0.9).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-zinc-400 font-medium">
              <span>Franchise Sales Tax (10%):</span>
              <span className="font-mono">${(order.total * 0.1).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-white border-t border-zinc-800 pt-2 font-bold text-sm">
              <span>Gross Invoice Value:</span>
              <span className="font-mono text-emerald-400">${order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Dynamic Fulfillment Timeline */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Fulfillment Pipeline Timeline</span>
            <div className="space-y-3 pl-3 border-l border-zinc-800">
              <div className="relative">
                <span className="absolute -left-[16.5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <div className="text-[11px] space-y-0.5">
                  <span className="font-semibold text-white block">Node POS Registry Verified</span>
                  <span className="text-[10px] text-zinc-500">Order successfully pushed by {order.cashierName}.</span>
                </div>
              </div>

              <div className="relative">
                <span className={`absolute -left-[16.5px] top-1 w-2.5 h-2.5 rounded-full ${
                  order.status !== 'Pending' ? 'bg-emerald-400' : 'bg-zinc-700'
                }`} />
                <div className="text-[11px] space-y-0.5">
                  <span className="font-semibold text-white block">Node KDS Dispatch</span>
                  <span className="text-[10px] text-zinc-500">Pushed to kitchen display stream for execution.</span>
                </div>
              </div>

              <div className="relative">
                <span className={`absolute -left-[16.5px] top-1 w-2.5 h-2.5 rounded-full ${
                  order.status === 'Completed' || order.status === 'Ready' ? 'bg-emerald-400' : 'bg-zinc-700'
                }`} />
                <div className="text-[11px] space-y-0.5">
                  <span className="font-semibold text-white block">Culinary Preparation Complete</span>
                  <span className="text-[10px] text-zinc-500">Sous chefs marked the order as ready.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-800 cursor-pointer"
          >
            Close Ledger Receipt
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}