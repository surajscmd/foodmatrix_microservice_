"use client";

import { useEffect, useState } from "react";
import { Package } from "lucide-react";

import { getWarehouseStocks } from "@/lib/inventory-api";

import { getIngredients, type Ingredient } from "@/lib/catalog-api";

import type { WarehouseStockView } from "@/utils/types/inventory";

import InventoryMetrics from "@/elements/rawmaterial/InventoryMetrics";
import InventoryTable from "@/elements/rawmaterial/InventoryTable";

import AddInventoryDrawer from "@/elements/rawmaterial/AddInventoryDrawer";

import EditInventoryDrawer from "@/elements/rawmaterial/EditInventoryDrawer";
import DeleteInventoryDrawer from "@/elements/rawmaterial/DeleteInventoryDrawer";

// ======================================================
// PROPS
// ======================================================

interface InventoryScreenProps {
  warehouseId?: string;
  searchTerm?: string;
  refreshKey?: number;
  onLoadingChange?: (loading: boolean) => void;
  onUpdated?: (date: Date) => void;
}

// ======================================================
// DRAWER STATE
// ======================================================

type ActiveDrawer =
  | { type: "add" | "bulk" }
  | {
      type: "edit" | "delete";
      item: WarehouseStockView;
    };

// ======================================================
// HELPERS
// ======================================================

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

// ======================================================
// EXPORTED SCREEN
// ======================================================

export default function InventoryScreen({
  warehouseId = "",
  searchTerm = "",
  refreshKey = 0,
  onLoadingChange,
  onUpdated,
}: InventoryScreenProps) {
  if (!warehouseId.trim()) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <Package className="mx-auto mb-3 h-5 w-5 text-zinc-600" />

          <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
            Franchise information is required to load stock.
          </p>
        </div>
      </div>
    );
  }

  return (
    <InventoryWorkspace
      key={warehouseId}
      warehouseId={warehouseId}
      searchTerm={searchTerm}
      refreshKey={refreshKey}
      onLoadingChange={onLoadingChange}
      onUpdated={onUpdated}
    />
  );
}

// ======================================================
// WORKSPACE
// ======================================================

interface InventoryWorkspaceProps {
  warehouseId: string;
  searchTerm: string;
  refreshKey: number;
  onLoadingChange?: (loading: boolean) => void;
  onUpdated?: (date: Date) => void;
}

function InventoryWorkspace({
  warehouseId,
  searchTerm,
  refreshKey,
  onLoadingChange,
  onUpdated,
}: InventoryWorkspaceProps) {
  const [items, setItems] = useState<WarehouseStockView[]>([]);

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  const [stockLoading, setStockLoading] = useState(true);
  const [stockError, setStockError] = useState("");

  const [ingredientsLoading, setIngredientsLoading] = useState(true);

  const [ingredientsError, setIngredientsError] = useState("");

  const [internalRefreshKey, setInternalRefreshKey] = useState(0);

  const [ingredientsRetryKey, setIngredientsRetryKey] = useState(0);

  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawer | null>(null);

  const [successMessage, setSuccessMessage] = useState("");

  // ====================================================
  // FETCH WAREHOUSE STOCK
  // ====================================================

  useEffect(() => {
    const controller = new AbortController();

    async function fetchStock(): Promise<void> {
      setStockLoading(true);
      setStockError("");
      onLoadingChange?.(true);

      try {
        const stockMap = new Map<string, WarehouseStockView>();

        let currentPage = 1;
        let totalPages = 1;

        do {
          if (controller.signal.aborted) return;

          const response = await getWarehouseStocks(
            warehouseId,
            {
              page: currentPage,
              limit: 50,
            },
            {
              signal: controller.signal,
            },
          );

          if (controller.signal.aborted) return;

          if (
            !Array.isArray(response.data) ||
            !response.pagination ||
            !Number.isFinite(Number(response.pagination.totalPages))
          ) {
            throw new Error("Invalid warehouse stock response.");
          }

          response.data.forEach((item) => {
            stockMap.set(item.id, item);
          });

          totalPages = Number(response.pagination.totalPages);

          currentPage += 1;
        } while (currentPage <= totalPages);

        if (!controller.signal.aborted) {
          setItems([...stockMap.values()]);
          onUpdated?.(new Date());
        }
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setStockError(
            getErrorMessage(error, "Unable to load warehouse stock."),
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setStockLoading(false);
          onLoadingChange?.(false);
        }
      }
    }

    void fetchStock();

    return () => {
      controller.abort();
      onLoadingChange?.(false);
    };
  }, [warehouseId, refreshKey, internalRefreshKey, onLoadingChange, onUpdated]);

  // ====================================================
  // FETCH CATALOG ITEMS FOR STOCK SEARCH
  // ====================================================

  useEffect(() => {
    let cancelled = false;

    async function fetchIngredients(): Promise<void> {
      setIngredientsLoading(true);
      setIngredientsError("");

      try {
        const ingredientMap = new Map<string, Ingredient>();

        let currentPage = 1;
        let totalPages = 1;

        do {
          if (cancelled) return;

          const response = await getIngredients(currentPage, 50);

          if (cancelled) return;

          if (
            !Array.isArray(response.data) ||
            !response.pagination ||
            !Number.isFinite(Number(response.pagination.totalPages))
          ) {
            throw new Error("Invalid stock item response.");
          }

          response.data.forEach((ingredient) => {
            ingredientMap.set(ingredient.id, ingredient);
          });

          totalPages = Number(response.pagination.totalPages);

          currentPage += 1;
        } while (currentPage <= totalPages);

        if (!cancelled) {
          setIngredients([...ingredientMap.values()]);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setIngredientsError(
            getErrorMessage(error, "Unable to load stock items."),
          );
        }
      } finally {
        if (!cancelled) {
          setIngredientsLoading(false);
        }
      }
    }

    void fetchIngredients();

    return () => {
      cancelled = true;
    };
  }, [ingredientsRetryKey, refreshKey]);

  // ====================================================
  // ACTIONS
  // ====================================================

  function refreshStock(): void {
    setInternalRefreshKey((current) => current + 1);
  }

  function retryIngredients(): void {
    setIngredientsRetryKey((current) => current + 1);
  }

  function openDrawer(drawer: ActiveDrawer): void {
    setSuccessMessage("");
    setActiveDrawer(drawer);
  }

  function closeDrawer(): void {
    setActiveDrawer(null);
  }

  function handleSaved(message: string): void {
    setActiveDrawer(null);
    setSuccessMessage(message);
    refreshStock();
  }

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="animate-fade-in space-y-6 p-6">
      {/* METRICS */}

      <InventoryMetrics
        items={items}
        loading={stockLoading}
        error={Boolean(stockError)}
      />

      {/* SUCCESS */}

      {successMessage && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-3"
        >
          <p className="text-xs text-emerald-400">{successMessage}</p>

          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            className="shrink-0 text-[10px] text-emerald-400 hover:text-emerald-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* STOCK TABLE */}

      <InventoryTable
        key={searchTerm}
        items={items}
        searchTerm={searchTerm}
        loading={stockLoading}
        error={stockError}
        onRefresh={refreshStock}
        onAdd={() => openDrawer({ type: "add" })}
        onBulkAdd={() => openDrawer({ type: "bulk" })}
        onEdit={(item) => openDrawer({ type: "edit", item })}
        onDelete={(item) => openDrawer({ type: "delete", item })}
      />

      {/* ADD / BULK STOCK */}

      {(activeDrawer?.type === "add" || activeDrawer?.type === "bulk") && (
        <AddInventoryDrawer
          warehouseId={warehouseId}
          bulk={activeDrawer.type === "bulk"}
          ingredients={ingredients}
          ingredientsLoading={ingredientsLoading}
          ingredientsError={ingredientsError}
          onRetryIngredients={retryIngredients}
          onClose={closeDrawer}
          onSaved={handleSaved}
        />
      )}

      {/* EDIT */}

      {activeDrawer?.type === "edit" && (
        <EditInventoryDrawer
          key={activeDrawer.item.id}
          warehouseId={warehouseId}
          item={activeDrawer.item}
          onClose={closeDrawer}
          onSaved={handleSaved}
        />
      )}

      {/* DELETE */}

      {activeDrawer?.type === "delete" && (
        <DeleteInventoryDrawer
          key={activeDrawer.item.id}
          warehouseId={warehouseId}
          item={activeDrawer.item}
          onClose={closeDrawer}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
