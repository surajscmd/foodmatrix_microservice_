"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import StockAuditScreen from "@/components/centraloperations/StockAuditScreen";
import { useOrganizationStore } from "@/store/organization-store";

export default function StockAuditPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const franchise = useOrganizationStore((state) => state.franchise);
  const isLoading = useOrganizationStore((state) => state.isLoading);
  const organizationError = useOrganizationStore((state) => state.error);

  const warehouseId = franchise?.id ?? "";

  return (
    <div className="min-h-screen font-sans text-zinc-300">
      <header className="sticky top-0 z-0 px-6 pt-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-4 w-1 rounded-full bg-emerald-400" />

            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                Stock Audit
              </p>

              <p className="mt-0.5 text-[10px] text-zinc-600">
                Inventory movements, references and stock corrections
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
              disabled={refreshing || !warehouseId}
              onClick={() => setRefreshKey((value) => value + 1)}
              aria-label="Sync stock audit"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 transition-colors hover:border-emerald-500/30 hover:bg-zinc-900 hover:text-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
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

      <main className="pb-12">
        {warehouseId ? (
          <StockAuditScreen
            key={warehouseId}
            warehouseId={warehouseId}
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
                <p
                  role={organizationError ? "alert" : "status"}
                  className={organizationError ? "text-rose-300" : ""}
                >
                  {organizationError ??
                    "Franchise information is not available."}
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}