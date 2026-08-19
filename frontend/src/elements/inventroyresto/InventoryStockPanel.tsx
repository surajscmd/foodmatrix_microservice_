"use client";

import { Package, Inbox } from "lucide-react";

import { FranchiseInventory, InventoryRequest } from "@/utils/types";

interface InventoryStockPanelProps {
  currentStock?: FranchiseInventory;

  inventoryRequests: InventoryRequest[];

  selectedRestId: string;

  searchTerm: string;

  activeTab: "local-stock" | "request-fulfillment";

  onUpdateStock: (restaurantId: string, itemId: string, newQty: number) => void;
}

export default function InventoryStockPanel({
  currentStock,
  inventoryRequests,
  selectedRestId,
  searchTerm,
  activeTab,
}: InventoryStockPanelProps) {
  const filteredItems =
    currentStock?.items.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  if (activeTab === "request-fulfillment") {
    const requests = inventoryRequests.filter(
      (req) => req.requesterRestaurantId === selectedRestId,
    );

    return (
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-4 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-bold font-mono text-zinc-300">
            Submitted Sourcing Tickets
          </span>

          <span className="flex items-center gap-1.5 text-[9px] font-mono bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-400">
            <Inbox className="w-3 h-3 text-emerald-400" />
            Request Outbox
          </span>
        </div>

        <div className="divide-y divide-zinc-800">
          {requests.length === 0 ? (
            <div className="p-16 text-center text-xs font-mono text-zinc-500">
              No sourcing requests submitted.
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className="p-5 flex items-center justify-between gap-4 hover:bg-zinc-900/20 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      {req.itemSelector}
                    </span>

                    <span className="text-[9px] px-2 py-0.5 rounded border text-amber-400 bg-amber-500/10 border-amber-500/20">
                      {req.urgency}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400">
                    Requesting{" "}
                    <span className="text-emerald-400 font-bold">
                      {req.quantity} {req.unit}
                    </span>
                  </p>

                  <span className="text-[9px] text-zinc-500 font-mono">
                    ID: {req.id}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-zinc-400">
                    {req.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="p-4 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between">
        <span className="text-xs font-bold font-mono text-zinc-300">
          Local Inventory Roster
        </span>

        <span className="text-[10px] text-emerald-400 font-mono">
          ● Realtime Synced
        </span>
      </div>

      <div className="divide-y divide-zinc-800">
        {filteredItems.length === 0 ? (
          <div className="p-16 text-center text-xs font-mono text-zinc-500">
            No inventory found.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.inventoryItemId}
              className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-900/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                  <Package className="w-4 h-4 text-zinc-400" />
                </div>

                <div>
                  <p className="text-xs font-bold text-white">{item.name}</p>

                  <p className="text-[10px] text-zinc-500 font-mono">
                    Minimum: {item.minThreshold} {item.unit}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-zinc-200">
                  {item.quantity} {item.unit}
                </span>

                <span
                  className={`${item.status === "In Stock" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : item.status === "Low Stock" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-rose-400 bg-rose-500/10 border-rose-500/20"} text-[10px] px-2 py-0.5 rounded-full border`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
