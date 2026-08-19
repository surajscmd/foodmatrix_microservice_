"use client";

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChefHat,
  Clock,
  CookingPot,
  PlayCircle,
  Utensils,
} from "lucide-react";

import { Order } from "@/utils/types";

interface KitchenScreenProps {
  orders: Order[];
  onProgressOrder: (id: string, nextStatus: Order["status"]) => void;
}

export default function KitchenScreen({
  orders,
  onProgressOrder,
}: KitchenScreenProps) {
  const activeOrders = orders.filter(
    (order) =>
      order.status === "Pending" ||
      order.status === "Preparing" ||
      order.status === "Ready",
  );

  const pendingCount = activeOrders.filter(
    (o) => o.status === "Pending",
  ).length;

  const preparingCount = activeOrders.filter(
    (o) => o.status === "Preparing",
  ).length;

  const readyCount = activeOrders.filter((o) => o.status === "Ready").length;

  const delayedCount = activeOrders.filter(
    (o) => o.id === "ORD-8001" || o.id === "ORD-8005",
  ).length;

  const averagePrepTime =
    activeOrders.length > 0
      ? Math.round(
          activeOrders.reduce(
            (total, order) =>
              total +
              order.items.reduce((sum, item) => sum + item.quantity * 3, 0),
            0,
          ) / activeOrders.length,
        )
      : 0;

  const prepQueue: Record<string, number> = {};

  activeOrders.forEach((order) => {
    order.items.forEach((item) => {
      prepQueue[item.name] = (prepQueue[item.name] || 0) + item.quantity;
    });
  });

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* =======================================================
          PAGE HEADER
      ======================================================= */}

      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-emerald-400" />
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-[0.25em] font-mono text-zinc-500">
                Restaurant Operations
              </span>

              <h1 className="text-2xl font-bold text-white mt-1">
                Kitchen Display System
              </h1>
            </div>
          </div>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-500">
            Track incoming tickets, coordinate food preparation, monitor kitchen
            throughput and dispatch completed orders to the service floor in
            real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/40">
            <span className="block text-[10px] uppercase font-mono text-zinc-500">
              Station
            </span>

            <span className="text-sm font-semibold text-white">
              Main Kitchen
            </span>
          </div>

          <div className="px-4 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10">
            <span className="block text-[10px] uppercase font-mono text-emerald-400">
              Status
            </span>

            <span className="text-sm font-semibold text-emerald-300">
              Operational
            </span>
          </div>
        </div>
      </div>

      {/* =======================================================
          KPI CARDS
      ======================================================= */}

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {/* Active */}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Utensils className="w-5 h-5 text-emerald-400" />
            </div>

            <span className="text-[10px] uppercase font-mono text-emerald-400">
              Live
            </span>
          </div>

          <h2 className="mt-4 text-3xl font-bold text-white">
            {activeOrders.length}
          </h2>

          <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
            Active Tickets
          </p>
        </div>

        {/* Pending */}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>

            <span className="text-[10px] uppercase font-mono text-amber-400">
              Queue
            </span>
          </div>

          <h2 className="mt-4 text-3xl font-bold text-white">{pendingCount}</h2>

          <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
            Pending
          </p>
        </div>

        {/* Preparing */}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <CookingPot className="w-5 h-5 text-blue-400" />
            </div>

            <span className="text-[10px] uppercase font-mono text-blue-400">
              Cooking
            </span>
          </div>

          <h2 className="mt-4 text-3xl font-bold text-white">
            {preparingCount}
          </h2>

          <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
            Preparing
          </p>
        </div>

        {/* Ready */}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>

            <span className="text-[10px] uppercase font-mono text-emerald-400">
              Pickup
            </span>
          </div>

          <h2 className="mt-4 text-3xl font-bold text-white">{readyCount}</h2>

          <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
            Ready Orders
          </p>
        </div>

        {/* Average */}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>

            <span className="text-[10px] uppercase font-mono text-rose-400">
              Delay
            </span>
          </div>

          <div className="flex items-end gap-2 mt-4">
            <h2 className="text-3xl font-bold text-white">{averagePrepTime}</h2>

            <span className="mb-1 text-sm text-zinc-500">min</span>
          </div>

          <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
            Avg Prep • {delayedCount} Delayed
          </p>
        </div>
      </div>
      {/* =======================================================
          CONSOLIDATED PREP QUEUE
      ======================================================= */}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 p-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CookingPot className="w-5 h-5 text-emerald-400" />
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-widest font-mono text-zinc-500">
                Kitchen Preparation
              </span>

              <h2 className="text-sm font-semibold text-white mt-1">
                Consolidated Cook Queue
              </h2>
            </div>
          </div>

          <span className="text-xs text-zinc-500">
            Live ingredient demand generated from all active tickets.
          </span>
        </div>

        <div className="p-5 flex flex-wrap gap-2">
          {Object.keys(prepQueue).length === 0 ? (
            <div className="text-sm text-zinc-500">
              No dishes currently waiting for preparation.
            </div>
          ) : (
            Object.entries(prepQueue).map(([name, qty]) => (
              <div
                key={name}
                className="px-3 py-2 rounded-xl bg-zinc-950 border border-emerald-500/15 flex items-center gap-2"
              >
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {qty}×
                </span>

                <span className="text-sm text-white">{name}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* =======================================================
          ACTIVE TICKETS
      ======================================================= */}

      {activeOrders.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 py-20 flex flex-col items-center justify-center">
          <ChefHat className="w-12 h-12 text-zinc-700 mb-4" />

          <h3 className="text-lg font-semibold text-white">
            Kitchen Queue Empty
          </h3>

          <p className="text-sm text-zinc-500 mt-2">
            No active orders have been received from POS terminals.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {activeOrders.map((order) => {
            const delayed = order.id === "ORD-8001" || order.id === "ORD-8005";

            return (
              <div
                key={order.id}
                className={`relative rounded-2xl border bg-zinc-900/40 overflow-hidden transition-all duration-300 hover:border-emerald-500/20 ${
                  delayed ? "border-rose-500/30" : "border-zinc-800"
                }`}
              >
                {delayed && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500 animate-pulse" />
                )}

                {/* ===========================
                    Ticket Header
                =========================== */}

                <div className="p-5 border-b border-zinc-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-zinc-500">
                        {order.id}
                      </span>

                      <h3 className="mt-1 text-base font-semibold text-white">
                        {order.cashierName}
                      </h3>
                    </div>

                    <div className="text-right">
                      <div className="px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[10px] uppercase font-mono text-zinc-400">
                        {order.type}
                      </div>

                      <div className="mt-2 flex items-center justify-end gap-1 text-xs text-zinc-500">
                        <Clock className="w-3.5 h-3.5" />

                        {order.timestamp}
                      </div>
                    </div>
                  </div>

                  {delayed && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-2 py-1 text-[10px] uppercase font-mono text-rose-400">
                      <AlertTriangle className="w-3 h-3" />
                      Critical Delay
                    </div>
                  )}
                </div>

                {/* ===========================
                    Ticket Items
                =========================== */}

                <div className="p-5 space-y-3 min-h-[170px] max-h-[170px] overflow-y-auto">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold font-mono text-emerald-400">
                          {item.quantity}×
                        </span>

                        <span className="text-sm font-medium text-white">
                          {item.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer continues in Part 3 */}
                {/* ===========================
                    Ticket Footer
                =========================== */}

                <div className="border-t border-zinc-800 p-5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[11px] font-bold uppercase border ${
                        order.status === "Pending"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : order.status === "Preparing"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}
                    >
                      {order.status}
                    </span>

                    {order.status === "Pending" && (
                      <button
                        onClick={() => onProgressOrder(order.id, "Preparing")}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase transition-colors cursor-pointer"
                      >
                        <PlayCircle className="w-4 h-4" />
                        Start Prep
                      </button>
                    )}

                    {order.status === "Preparing" && (
                      <button
                        onClick={() => onProgressOrder(order.id, "Ready")}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 text-xs font-bold uppercase transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark Ready
                      </button>
                    )}

                    {order.status === "Ready" && (
                      <button
                        onClick={() => onProgressOrder(order.id, "Completed")}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold uppercase transition-colors cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
