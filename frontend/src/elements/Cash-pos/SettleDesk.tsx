"use client";
import { usePosStore } from "@/store/pos.store";
import type { Order } from "@/utils/types";
import {
  Check,
  DollarSign,
  Receipt,
  CreditCard,
  Smartphone,
} from "lucide-react";

interface SettleDeskProps {
  orders: Order[];
  onProgressOrder: (orderId: string, status: Order["status"]) => void;
  onUpdateOrderDetails?: (orderId: string, updates: Partial<Order>) => void;
}

export default function SettleDesk({
  orders,
  onProgressOrder,
  onUpdateOrderDetails,
}: SettleDeskProps) {
  const {
    selectedSettleOrderId,
    setSelectedSettleOrder,
    paymentMethod,
    setPaymentMethod,
  } = usePosStore();

  const unpaidOrders = orders.filter(
    (order) =>
      order.type === "Dine-In" &&
      order.status !== "Completed" &&
      order.status !== "Cancelled",
  );

  const activeOrder =
    unpaidOrders.find((order) => order.id === selectedSettleOrderId) ||
    unpaidOrders[0] ||
    null;

  const settleOrder = () => {
    if (!activeOrder) return;
    onProgressOrder(activeOrder.id, "Completed");
    setSelectedSettleOrder(null);
  };

  return (
    <div className="border-t border-zinc-800 pt-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
          <DollarSign className="w-5 h-5" />
        </div>

        <div>
          <h3 className="text-sm font-mono text-white uppercase font-bold">
            Dine-In Settle Desk
          </h3>
          <p className="text-xs text-zinc-500">
            Consolidated terminal to settle waiter served tables.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT ORDER LIST */}
        <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
          <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block border-b border-zinc-800 pb-2">
            Unpaid Active Tables ({unpaidOrders.length})
          </span>

          <div className="space-y-2 mt-4">
            {unpaidOrders.length === 0 ? (
              <div className="py-12 text-center text-zinc-600 font-mono text-[10px]">
                <Check className="mx-auto mb-2 text-emerald-500/30" />
                All tables settled
              </div>
            ) : (
              unpaidOrders.map((order) => {
                const selected = activeOrder?.id === order.id;

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedSettleOrder(order.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selected
                        ? "bg-emerald-500/10 border-emerald-500/40"
                        : "bg-zinc-950 border-zinc-800"
                    }`}
                  >
                    <div className="flex justify-between">
                      <div>
                        <span className="text-xs font-bold text-white">
                          {order.customerName || "Guest"}
                        </span>

                        {order.tableNumber && (
                          <span className="ml-2 text-[9px] bg-zinc-800 px-1.5 rounded text-zinc-400">
                            {order.tableNumber}
                          </span>
                        )}
                      </div>

                      <span className="text-xs font-mono text-white">
                        ${order.total.toFixed(2)}
                      </span>
                    </div>

                    <p className="text-[9px] text-zinc-500 font-mono mt-1">
                      {order.timestamp} •{" "}
                      {order.items.reduce(
                        (sum, item) => sum + item.quantity,
                        0,
                      )}{" "}
                      items
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RECEIPT PANEL */}
        <div className="lg:col-span-7 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
          {activeOrder ? (
            <div className="space-y-5">
              <div className="flex justify-between border-b border-zinc-800 pb-3">
                <div>
                  <div className="flex items-center gap-2 text-white text-xs font-bold">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    Settle Bill
                  </div>
                  <p className="text-[9px] text-zinc-500 font-mono">
                    UID: {activeOrder.id}
                  </p>
                </div>

                <span className="text-emerald-400 font-mono text-xs font-bold">
                  ${activeOrder.total.toFixed(2)}
                </span>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2 text-xs">
                {activeOrder.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between text-zinc-300"
                  >
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  value={activeOrder.customerName || ""}
                  onChange={(e) =>
                    onUpdateOrderDetails?.(activeOrder.id, {
                      customerName: e.target.value,
                    })
                  }
                  className="bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white px-2 py-2"
                  placeholder="Customer"
                />

                <input
                  value={activeOrder.tableNumber || ""}
                  onChange={(e) =>
                    onUpdateOrderDetails?.(activeOrder.id, {
                      tableNumber: e.target.value,
                    })
                  }
                  className="bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white px-2 py-2"
                  placeholder="Table"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Cash", icon: DollarSign },
                  { label: "Card", icon: CreditCard },
                  { label: "UPI", icon: Smartphone },
                ].map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() =>
                      setPaymentMethod(label as "Cash" | "Card" | "UPI")
                    }
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                      paymentMethod === label
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={settleOrder}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-3 rounded-xl text-xs font-bold flex justify-center items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Settle & Issue Tax Receipt
              </button>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-zinc-600 font-mono text-xs">
              Select unpaid table receipt
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
