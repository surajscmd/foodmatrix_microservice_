"use client";

import { useState } from "react";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  RotateCcw,
  MonitorPlay,
  Check,
} from "lucide-react";
import { usePosStore } from "@/store/pos.store";
import type { Order } from "@/utils/types";
import type { FulfillmentType } from "@/utils/pos.types";

interface CartPanelProps {
  onAddOrder: (order: Partial<Order>) => void;
}

export default function CartPanel({ onAddOrder }: CartPanelProps) {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    discountPct,
    setDiscount,
    fulfillmentType,
    setFulfillmentType,
    customerName,
    setCustomerName,
  } = usePosStore();

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0,
  );

  const discountValue = subtotal * (discountPct / 100);
  const taxValue = (subtotal - discountValue) * 0.1;
  const total = subtotal - discountValue + taxValue;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) return;

    const orderItems = cart.map((item) => ({
      menuItemId: item.menuItem.id,
      name: item.menuItem.name,
      quantity: item.quantity,
      price: item.menuItem.price,
    }));

    onAddOrder({
      restaurantId: "R-101",
      restaurantName: "FoodMatrix Downtown",
      items: orderItems,
      total: Number(total.toFixed(2)),
      status: "Pending",
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      type: fulfillmentType,
      cashierName: "James Loo",
      customerName,
    });

    clearCart();

    setSuccessMsg(
      "Takeout order successfully dispatched to KDS kitchen streams!",
    );

    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex flex-col h-[620px] shadow-2xl">
      {successMsg && (
        <div className="mb-3 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <Check className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-white">
            Active Terminal Cart
          </span>
        </div>

        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-[10px] text-zinc-500 hover:text-rose-400 font-mono flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Basket
          </button>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 h-full overflow-y-auto space-y-2">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 font-mono text-[10px] text-center">
            <ShoppingCart className="w-7 h-7 text-zinc-800 mb-2" />
            Cart is empty
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.menuItem.id}
              className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex-1">
                <span className="font-semibold text-white block truncate">
                  {item.menuItem.name}
                </span>

                <span className="text-[9px] text-emerald-400 font-mono">
                  ${item.menuItem.price.toFixed(2)} / unit
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateQuantity(item.menuItem.id, -1)}
                  className="p-1 border border-zinc-800 rounded text-zinc-500 hover:text-white"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>

                <span className="text-white font-mono w-4 text-center">
                  {item.quantity}
                </span>

                <button
                  onClick={() => updateQuantity(item.menuItem.id, 1)}
                  className="p-1 border border-zinc-800 rounded text-zinc-500 hover:text-white"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>

                <button
                  onClick={() => removeFromCart(item.menuItem.id)}
                  className="text-zinc-600 hover:text-rose-400 ml-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-3 pt-3 border-t border-zinc-800"
      >
        <div className="grid grid-cols-2 gap-3">
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl py-1.5 px-2 text-xs text-white"
            placeholder="Customer"
          />

          <select
            value={fulfillmentType}
            onChange={(e) =>
              setFulfillmentType(e.target.value as FulfillmentType)
            }
           className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-emerald-500 cursor-pointer transition-colors"
          >
            <option className="bg-zinc-950 text-white" value="Takeout">
              Takeout
            </option>

            <option className="bg-zinc-950 text-white" value="Drive-Thru">
              Drive-Thru
            </option>
          </select>
        </div>

        <div className="grid grid-cols-4 gap-1 bg-zinc-950 p-1 border border-zinc-800 rounded-xl">
          {[0, 10, 15, 20].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDiscount(value)}
              className={`py-1 rounded-lg text-[9px] font-mono ${
                discountPct === value
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-zinc-500"
              }`}
            >
              {value === 0 ? "None" : `${value}%`}
            </button>
          ))}
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-[10px] font-mono space-y-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span>Tax</span>
            <span>${taxValue.toFixed(2)}</span>
          </div>

          <div className="border-t border-zinc-800 pt-2 flex justify-between text-emerald-400 font-bold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        <button
          disabled={cart.length === 0}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <MonitorPlay className="w-4 h-4" />
          Send Takeout/Drive-Thru to KDS
        </button>
      </form>
    </div>
  );
}
