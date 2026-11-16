"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

import {
  deleteMenuItem,
  updateMenuItem,
  type CreateMenuItemPayload,
  type MenuCategory,
  type MenuItem,
} from "@/lib/catalog-api";

import MenuMetrics from "@/elements/menu/MenuMetrics";
import MenuControls from "@/elements/menu/MenuControls";
import MenuTable from "@/elements/menu/MenuTable";
import AddMenuItemDrawer from "@/elements/menu/AddMenuItemDrawer";
import MenuItemInformationView from "@/elements/menu/MenuItemInformationView";

import { useOrganizationStore } from "@/store/organization-store";
import type { Restaurant } from "@/utils/types/organization";

interface MenuScreenProps {
  categories: MenuCategory[];
  restaurants: Restaurant[];
  onAddMenuItem: (data: CreateMenuItemPayload) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export default function MenuScreen({
  categories,
  restaurants,
  onAddMenuItem,
  onRefresh,
}: MenuScreenProps) {
  const canEditSharedCatalog = useOrganizationStore(
    (state) => state.currentUser?.systemUser.role === "SUPER_ADMIN",
  );
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);

  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);

  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(
    null,
  );

  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [metricsRefreshKey, setMetricsRefreshKey] = useState(0);
  const [menuTableRefreshKey, setMenuTableRefreshKey] = useState(0);

  const refreshAfterMutation = () => {
    setLastUpdated(new Date());
    setMenuTableRefreshKey((previous) => previous + 1);
    setMetricsRefreshKey((previous) => previous + 1);

    // The successful mutation should not be reported as failed just
    // because a secondary refresh fails.
    void onRefresh().catch((error) => {
      console.error("Failed to refresh catalog data:", error);
    });
  };

  const handleSync = async () => {
    if (refreshing) return;

    try {
      setRefreshing(true);
      await onRefresh();

      setLastUpdated(new Date());
      setMetricsRefreshKey((previous) => previous + 1);
      setMenuTableRefreshKey((previous) => previous + 1);
    } catch (error) {
      console.error("Failed to sync menu catalog:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const openCreateDrawer = () => {
    setEditingMenuItem(null);
    setIsAddDrawerOpen(true);
  };

  const openEditDrawer = (item: MenuItem) => {
    setEditingMenuItem(item);
    setIsAddDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsAddDrawerOpen(false);
    setEditingMenuItem(null);
  };

  const handleSaveMenuItem = async (data: CreateMenuItemPayload) => {
    if (editingMenuItem) {
      await updateMenuItem(editingMenuItem.id, data);
    } else {
      await onAddMenuItem(data);
    }

    refreshAfterMutation();
  };

  const handleDeactivateMenuItem = async (item: MenuItem) => {
    await deleteMenuItem(item.id);
    refreshAfterMutation();
  };

  if (selectedMenuItem) {
    return (
      <MenuItemInformationView
        canEditSharedCatalog={canEditSharedCatalog}
        menuItem={selectedMenuItem}
        restaurants={restaurants}
        onBack={() => setSelectedMenuItem(null)}
        onRefresh={onRefresh}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-0 px-6 pt-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-4 w-1 rounded-full bg-emerald-400" />

            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                Catalog Overview
              </p>

              <p className="mt-0.5 text-[10px] text-zinc-600">
                Master menu catalog and operational status
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
              onClick={handleSync}
              disabled={refreshing}
              title="Sync menu"
              aria-label="Sync menu"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 transition-all duration-200 hover:border-emerald-500/30 hover:bg-zinc-900 hover:text-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
              />

              <span>{refreshing ? "Syncing..." : "Sync"}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="animate-fade-in space-y-6 p-6">
        <MenuMetrics refreshKey={metricsRefreshKey} />

        {canEditSharedCatalog && (
          <MenuControls onOpenDrawer={openCreateDrawer} />
        )}

        <MenuTable
          canEditSharedCatalog={canEditSharedCatalog}
          restaurants={restaurants}
          refreshKey={menuTableRefreshKey}
          onSelectMenuItem={setSelectedMenuItem}
          onEditMenuItem={openEditDrawer}
          onDeactivateMenuItem={handleDeactivateMenuItem}
        />

        {canEditSharedCatalog && isAddDrawerOpen && (
          <AddMenuItemDrawer
            key={editingMenuItem?.id ?? "create-menu-item"}
            isOpen={isAddDrawerOpen}
            categories={categories}
            menuItem={editingMenuItem}
            onClose={closeDrawer}
            onSubmit={handleSaveMenuItem}
          />
        )}
      </main>
    </div>
  );
}
