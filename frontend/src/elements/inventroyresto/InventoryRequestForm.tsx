"use client";

import { useState } from "react";
import { Send } from "lucide-react";

import { Restaurant, InventoryRequest } from "@/utils/types";

interface InventoryRequestFormProps {
  restaurants: Restaurant[];

  selectedRestId: string;

  onAddInventoryRequest: (request: Partial<InventoryRequest>) => void;

  setActiveTab: (
    tab: "local-stock" | "request-fulfillment" | "new-request",
  ) => void;
}

export default function InventoryRequestForm({
  restaurants,
  selectedRestId,
  onAddInventoryRequest,
  setActiveTab,
}: InventoryRequestFormProps) {
  const [requestItem, setRequestItem] = useState("Prime Beef Patties");

  const [requestQty, setRequestQty] = useState(100);

  const [requestUnit, setRequestUnit] = useState("lbs");

  const [requestUrgency, setRequestUrgency] = useState<
    "Standard" | "Urgent" | "Critical"
  >("Standard");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const restaurant = restaurants.find((rest) => rest.id === selectedRestId);

    if (!restaurant) return;

    onAddInventoryRequest({
      requesterRestaurantId: restaurant.id,

      requesterRestaurantName: restaurant.name,

      itemSelector: requestItem,

      quantity: requestQty,

      unit: requestUnit,

      urgency: requestUrgency,
    });

    setRequestQty(100);

    setRequestUrgency("Standard");

    setActiveTab("request-fulfillment");
  };

  return (
    <div className="max-w-xl mx-auto bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4 mb-6">
        <Send className="w-5 h-5 text-emerald-400" />

        <div>
          <h3 className="text-sm font-semibold text-white">
            Create Inventory Request
          </h3>

          <p className="text-[10px] text-zinc-500 font-mono">
            STOCK REPLENISHMENT PROTOCOL
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase text-zinc-400 font-bold">
            Requester Node
          </label>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold">
            {restaurants.find((rest) => rest.id === selectedRestId)?.name ||
              "Unknown Node"}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase text-zinc-400 font-bold">
            Ingredient Asset
          </label>

          <select
            value={requestItem}
            onChange={(e) => {
              const value = e.target.value;

              setRequestItem(value);

              if (value.includes("Buns")) {
                setRequestUnit("pcs");
              } else if (value.includes("Milk")) {
                setRequestUnit("gallons");
              } else {
                setRequestUnit("lbs");
              }
            }}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
          >
            <option>Prime Beef Patties</option>

            <option>Fresh Brioche Buns</option>

            <option>Cheddar Cheese Slices</option>

            <option>Organic Romaine Lettuce</option>

            <option>Whole Milk</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase text-zinc-400 font-bold">
              Quantity
            </label>

            <input
              type="number"
              value={requestQty}
              onChange={(e) => setRequestQty(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase text-zinc-400 font-bold">
              Unit
            </label>

            <input
              value={requestUnit}
              readOnly
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-400"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase text-zinc-400 font-bold">
            Urgency Level
          </label>

          <select
            value={requestUrgency}
            onChange={(e) => setRequestUrgency(e.target.value as "Standard" | "Urgent" | "Critical")}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
          >
            <option value="Standard">Standard Delivery</option>

            <option value="Urgent">Urgent Transfer</option>

            <option value="Critical">Critical Stockout</option>
          </select>
        </div>

        <div className="flex gap-3 pt-5 border-t border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab("local-stock")}
            className="flex-1 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="flex-1 py-2 rounded-xl bg-emerald-500 text-zinc-950 text-xs font-bold flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Submit Request
          </button>
        </div>
      </form>
    </div>
  );
}
