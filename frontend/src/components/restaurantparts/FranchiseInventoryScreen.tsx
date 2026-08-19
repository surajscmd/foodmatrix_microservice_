"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";

import InventoryStockPanel from "../../elements/inventroyresto/InventoryStockPanel";
import InventoryRequestForm from "../../elements/inventroyresto/InventoryRequestForm";

import {
  Restaurant,
  FranchiseInventory,
  InventoryRequest,
} from "@/utils/types";

interface FranchiseInventoryScreenProps {
  restaurants: Restaurant[];
  franchiseInventory: FranchiseInventory[];
  inventoryRequests: InventoryRequest[];

  onUpdateFranchiseStock: (
    restaurantId: string,
    itemId: string,
    newQty: number,
  ) => void;

  onAddInventoryRequest: (request: Partial<InventoryRequest>) => void;

  searchTerm: string;
}

export default function FranchiseInventoryScreen({
  restaurants,
  franchiseInventory,
  inventoryRequests,
  onUpdateFranchiseStock,
  onAddInventoryRequest,
  searchTerm,
}: FranchiseInventoryScreenProps) {
  const [selectedRestId, setSelectedRestId] = useState(
    restaurants[0]?.id || "",
  );

  const [activeTab, setActiveTab] = useState<
    "local-stock" | "request-fulfillment" | "new-request"
  >("local-stock");

  const currentStock = franchiseInventory.find(
    (item) => item.restaurantId === selectedRestId,
  );

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Header */}

      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-400" />

          <div>
            <span className="text-xs font-mono text-zinc-300 font-bold block">
              Franchise Stock Terminal
            </span>

            <span className="text-[10px] text-zinc-500 font-mono">
              Location-bound warehouse buffers
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-mono text-zinc-400 font-semibold uppercase">
            Select Node:
          </label>

          <select
            value={selectedRestId}
            onChange={(e) => setSelectedRestId(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50"
          >
            {restaurants.map((rest) => (
              <option key={rest.id} value={rest.id}>
                {rest.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}

      <div className="flex border-b border-zinc-800 gap-5">
        <button
          onClick={() => setActiveTab("local-stock")}
          className={`${activeTab === "local-stock" ? "text-emerald-400 border-emerald-500" : "text-zinc-500"} pb-3 text-xs font-bold font-mono uppercase border-b-2`}
        >
          Local Inventory
        </button>

        <button
          onClick={() => setActiveTab("request-fulfillment")}
          className={`${activeTab === "request-fulfillment" ? "text-emerald-400 border-emerald-500" : "text-zinc-500"} pb-3 text-xs font-bold font-mono uppercase border-b-2`}
        >
          Request Logs
        </button>

        <button
          onClick={() => setActiveTab("new-request")}
          className={`${activeTab === "new-request" ? "text-emerald-400 border-emerald-500" : "text-zinc-500"} pb-3 text-xs font-bold font-mono uppercase border-b-2`}
        >
          New Request
        </button>
      </div>

      {activeTab === "new-request" ? (
        <InventoryRequestForm
          restaurants={restaurants}
          selectedRestId={selectedRestId}
          onAddInventoryRequest={onAddInventoryRequest}
          setActiveTab={setActiveTab}
        />
      ) : (
        <InventoryStockPanel
          currentStock={currentStock}
          inventoryRequests={inventoryRequests}
          selectedRestId={selectedRestId}
          searchTerm={searchTerm}
          activeTab={activeTab}
          onUpdateStock={onUpdateFranchiseStock}
        />
      )}
    </div>
  );
}
