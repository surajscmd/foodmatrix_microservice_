"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Minus,
  Plus,
  UtensilsCrossed,
} from "lucide-react";

import MenuGrid from "../../elements/waiterpad/MenuGrid";
import CartPanel from "../../elements/waiterpad/CartPanel";

import { CartItem, MenuItem, Order, Restaurant } from "../../elements/waiterpad/types";

interface WaiterScreenProps {
  menuItems: MenuItem[];
  restaurants: Restaurant[];
  searchTerm: string;
  onAddOrder: (order: Partial<Order>) => void;
}

const cardClass = "rounded-2xl border border-zinc-800 bg-zinc-900/40";

// const categories = [
//   "All",
//   "Starters",
//   "Mains",
//   "Desserts",
//   "Beverages",
//   "Sides",
// ];

export default function WaiterScreen({
  menuItems,
  restaurants,
  searchTerm,
  onAddOrder,
}: WaiterScreenProps) {
  const [table, setTable] = useState("Table 1");
  const [customerName, setCustomerName] = useState("Guest");
  const [guests, setGuests] = useState(2);

  const [category, setCategory] = useState("All");

  const [cart, setCart] = useState<CartItem[]>([]);

  const [successMsg, setSuccessMsg] = useState("");

  const restaurant = restaurants[0];

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const categoryMatch = category === "All" || item.category === category;

      const searchMatch = item.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const statusMatch = item.status === "Available";

      return categoryMatch && searchMatch && statusMatch;
    });
  }, [menuItems, category, searchTerm]);

  const subtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + item.menuItem.price * item.quantity,
      0,
    );
  }, [cart]);

  const tax = subtotal * 0.1;

  const total = subtotal + tax;

  const addToCart = (menuItem: MenuItem) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.menuItem.id === menuItem.id);

      if (exists) {
        return prev.map((item) =>
          item.menuItem.id === menuItem.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      return [
        ...prev,
        {
          menuItem,
          quantity: 1,
        },
      ];
    });
  };

  const increaseQty = (id: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.menuItem.id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item,
      ),
    );
  };

  const decreaseQty = (id: string) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.menuItem.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.menuItem.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const sendOrder = () => {
    if (!restaurant) return;

    onAddOrder({
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,

      items: cart.map((item) => ({
        menuItemId: item.menuItem.id,
        name: item.menuItem.name,
        quantity: item.quantity,
        price: item.menuItem.price,
      })),

      total,

      customerName,
      tableNumber: table,

      cashierName: "Waiter Station",

      status: "Pending",

      type: "Dine-In",

      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    setCart([]);

    setSuccessMsg(`${table} order sent successfully`);

    setTimeout(() => {
      setSuccessMsg("");
    }, 4000);
  };

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Header */}

      <div
        className={`${cardClass} flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />

            <p className="font-mono text-xs uppercase tracking-[0.25em] text-zinc-400">
              Waiter Order Terminal
            </p>
          </div>

          <h1 className="mt-3 text-2xl font-bold text-white">
            Dine-In Order Management
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-zinc-500">
            Register table orders and instantly dispatch them to the kitchen.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />

              <span className="text-xs font-medium text-emerald-300">
                {successMsg}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2">
            <Clock3 className="h-4 w-4 text-zinc-500" />

            <span className="font-mono text-xs uppercase text-zinc-400">
              Station Online
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        {/* Left */}

        <div className="space-y-6 xl:col-span-8">
          {/* Service Configuration */}

          <div className={`${cardClass} p-5`}>
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-2">
                <UtensilsCrossed className="h-5 w-5 text-emerald-400" />
              </div>

              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                  Service Configuration
                </p>

                <h2 className="text-lg font-semibold text-white">
                  Table Information
                </h2>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {/* Table */}

              <div>
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  Table
                </label>

                <select
                  value={table}
                  onChange={(e) => setTable(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500"
                >
                  {Array.from({ length: 20 }, (_, i) => (
                    <option key={i}>Table {i + 1}</option>
                  ))}
                </select>
              </div>

              {/* Customer */}

              <div>
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  Customer
                </label>

                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500"
                />
              </div>
              {/* Guests */}

              <div>
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  Guests
                </label>

                <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-1">
                  <button
                    onClick={() => setGuests((prev) => Math.max(1, prev - 1))}
                    className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <span className="font-mono text-sm font-semibold text-white">
                    {guests} Pax
                  </span>

                  <button
                    onClick={() => setGuests((prev) => prev + 1)}
                    className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Restaurant */}

              <div>
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  Restaurant
                </label>

                <div className="flex h-[50px] items-center rounded-xl border border-zinc-800 bg-zinc-950 px-4">
                  <span className="truncate text-sm text-white">
                    {restaurant?.name}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu */}

          <MenuGrid
            items={filteredItems}
            category={category}
            setCategory={setCategory}
            onAddToCart={addToCart}
          />
        </div>

        {/* Right */}

        <div className="xl:col-span-4">
          <CartPanel
            table={table}
            customerName={customerName}
            guests={guests}
            cart={cart}
            subtotal={subtotal}
            tax={tax}
            total={total}
            onIncrease={increaseQty}
            onDecrease={decreaseQty}
            onRemove={removeItem}
            onClear={clearCart}
            onSend={sendOrder}
          />
        </div>
      </div>
    </div>
  );
}
