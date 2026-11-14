"use client";

import { useState } from "react";
import { Loader2, RefreshCw, Search } from "lucide-react";

import FulfillmentScreen from "@/components/centraloperations/FulfillmentScreen";
import { useOrganizationStore } from "@/store/organization-store";

export default function FulfillmentPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const franchise = useOrganizationStore((state) => state.franchise);
  const isLoading = useOrganizationStore((state) => state.isLoading);
  const error = useOrganizationStore((state) => state.error);

  const warehouseId = franchise?.id ?? "";

  return (
    <div className="min-h-screen font-sans text-zinc-300">
      <header className="sticky top-0 z-0 px-6 pt-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-4 w-1 rounded-full bg-emerald-400" />

            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                Fulfillment Ledger
              </p>
              <p className="mt-0.5 text-[10px] text-zinc-600">
                Warehouse dispatch and restaurant deliveries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="hidden text-[10px] text-zinc-600 sm:block">
                Updated{" "}
                {lastUpdated.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}

            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              disabled={refreshing || !warehouseId}
              aria-label="Sync transfers"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 transition-colors hover:border-emerald-500/30 hover:text-emerald-400 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              {refreshing ? "Syncing..." : "Sync"}
            </button>
          </div>
        </div>
      </header>

      <div className="px-6 pt-5">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            disabled={!warehouseId}
            placeholder="Search transfers, restaurants or tracking..."
            aria-label="Search transfers"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-4 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-emerald-500/50 disabled:opacity-50"
          />
        </div>
      </div>

      <main className="pb-12">
        {warehouseId ? (
          <FulfillmentScreen
            key={warehouseId}
            warehouseId={warehouseId}
            searchTerm={searchTerm}
            refreshKey={refreshKey}
            onLoadingChange={setRefreshing}
            onUpdated={setLastUpdated}
          />
        ) : (
          <div className="p-6">
            <div className="flex min-h-[260px] items-center justify-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 text-xs text-zinc-500">
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                  Loading franchise...
                </>
              ) : (
                error ?? "Franchise information is not available."
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}