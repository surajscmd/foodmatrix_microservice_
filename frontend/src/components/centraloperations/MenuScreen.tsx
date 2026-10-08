"use client";

import React, { useState } from "react";

import { RefreshCw } from "lucide-react";

import type {
  CreateMenuItemPayload,
  MenuCategory,
  MenuItem,
} from "@/lib/catalog-api";

import MenuMetrics from "@/elements/menu/MenuMetrics";
import MenuControls from "@/elements/menu/MenuControls";
import MenuTable from "@/elements/menu/MenuTable";
import AddMenuItemDrawer from "@/elements/menu/AddMenuItemDrawer";
import MenuItemInformationView from "@/elements/menu/MenuItemInformationView";

import type { Restaurant } from "@/utils/types/organization";

interface MenuScreenProps {
  categories: MenuCategory[];
  restaurants: Restaurant[];

  onAddMenuItem: (
    data: CreateMenuItemPayload,
  ) => Promise<void>;

  onRefresh: () => Promise<void>;
}

export default function MenuScreen({
  categories,
  restaurants,
  onAddMenuItem,
  onRefresh,
}: MenuScreenProps) {
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);

  const [selectedMenuItem, setSelectedMenuItem] =
    useState<MenuItem | null>(null);

  const [refreshing, setRefreshing] = useState(false);

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const [metricsRefreshKey, setMetricsRefreshKey] = useState(0);


  // ==========================================================
  // SYNC
  // ==========================================================

  const handleSync = async () => {
    if (refreshing) {
      return;
    }

    try {
      setRefreshing(true);

      await onRefresh();

      setLastUpdated(new Date());

      setMetricsRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to sync menu catalog:", error);
    } finally {
      setRefreshing(false);
    }
  };


  // ==========================================================
  // MENU ITEM INFORMATION
  // ==========================================================

  if (selectedMenuItem) {
    return (
      <MenuItemInformationView
        menuItem={selectedMenuItem}
        restaurants={restaurants}
        onBack={() => setSelectedMenuItem(null)}
        onRefresh={onRefresh}
      />
    );
  }


  // ==========================================================
  // MENU REGISTRY
  // ==========================================================

  return (
    <div className="min-h-screen ">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-0 px-6 pt-4">
        <div className="flex items-center justify-between gap-4">

          {/* TITLE */}
          <div className="flex items-center gap-3">
            <div className="h-4 w-1 rounded-full bg-emerald-400" />

            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                Workforce Overview
              </p>

              <p className="mt-0.5 text-[10px] text-zinc-600">
                Current workforce health and operational status
              </p>
            </div>
          </div>


          {/* =================================================
              RIGHT SIDE
          ================================================= */}

          <div className="flex items-center gap-3">

            {/* LAST UPDATED */}
            {lastUpdated && (
              <span className="hidden text-[10px] text-zinc-600 sm:block">
                Updated{" "}
                {lastUpdated.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}


            {/* =================================================
                SYNC BUTTON
            ================================================= */}

            <button
              type="button"
              onClick={handleSync}
              disabled={refreshing}
              title="Sync menu"
              aria-label="Sync menu"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 transition-all duration-200 hover:border-emerald-500/30 hover:bg-zinc-900 hover:text-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />

              <span>
                {refreshing ? "Syncing..." : "Sync"}
              </span>
            </button>

          </div>
        </div>
      </header>


      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="animate-fade-in space-y-6 p-6">

        <MenuMetrics
          refreshKey={metricsRefreshKey}
        />

        <MenuControls
          onOpenDrawer={() => setIsAddDrawerOpen(true)}
        />

        <MenuTable
          restaurants={restaurants}
          onSelectMenuItem={setSelectedMenuItem}
        />

        <AddMenuItemDrawer
          isOpen={isAddDrawerOpen}
          categories={categories}
          onClose={() => setIsAddDrawerOpen(false)}
          onSubmit={onAddMenuItem}
        />

      </main>

    </div>
  );
}