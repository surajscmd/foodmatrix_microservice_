"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Trash2,
  XCircle,
} from "lucide-react";

import type { Restaurant } from "@/utils/types/organization";

import {
  getMenuItems,
  getMenuItemsByCategory,
  getMenuCategories,
  updateMenuItem,
  type MenuItem,
  type MenuCategory,
  type Pagination,
} from "@/lib/catalog-api";

interface MenuTableProps {
  onSelectMenuItem: (item: MenuItem) => void;
  onEditMenuItem: (item: MenuItem) => void;
  onDeactivateMenuItem: (item: MenuItem) => Promise<void>;
  searchTerm?: string;
  restaurants: Restaurant[];
  refreshKey?: number;
}

export default function MenuTable({
  onSelectMenuItem,
  onEditMenuItem,
  onDeactivateMenuItem,
  searchTerm = "",
  restaurants,
  refreshKey = 0,
}: MenuTableProps) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState("");

  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const [confirmDeactivateItemId, setConfirmDeactivateItemId] = useState<
    string | null
  >(null);

  const [deactivatingItemId, setDeactivatingItemId] = useState<string | null>(
    null,
  );

  const [retryKey, setRetryKey] = useState(0);

  // ==========================================================
  // FETCH CATEGORIES
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    getMenuCategories()
      .then((response) => {
        if (cancelled) return;
        setCategories(response.data);
      })
      .catch((err) => {
        if (cancelled) return;

        console.error("Failed to fetch categories:", err);
        setCategories([]);
      })
      .finally(() => {
        if (!cancelled) {
          setCategoriesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================================
  // FETCH MENU ITEMS
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    const request = selectedCategory
      ? getMenuItemsByCategory(selectedCategory)
      : getMenuItems(page, limit);

    request
      .then((response) => {
        if (cancelled) return;

        const responseItems = response.data.map((item) => {
          if (item.category?.name) {
            return item;
          }

          const category = categories.find(
            (categoryItem) => categoryItem.id === item.categoryId,
          );

          return {
            ...item,
            category: category ?? item.category,
          };
        });

        setItems(responseItems);
        setPagination(selectedCategory ? null : response.pagination);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;

        console.error("Failed to fetch menu items:", err);
        setItems([]);
        setPagination(null);
        setError("Failed to load menu items.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page, limit, selectedCategory, categories, refreshKey, retryKey]);

  // ==========================================================
  // SEARCH
  // ==========================================================

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return items;

    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        item.category?.name?.toLowerCase().includes(query),
    );
  }, [items, searchTerm]);

  // ==========================================================
  // PAGINATION VALUES
  // ==========================================================

  const totalPages = pagination?.totalPages ?? 0;
  const total = pagination?.total ?? 0;

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = total === 0 ? 0 : Math.min(page * limit, total);

  // ==========================================================
  // PAGINATION HANDLERS
  // ==========================================================

  const goToPage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) {
      return;
    }

    setLoading(true);
    setError(null);
    setPage(newPage);
  };

  const handleLimitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLoading(true);
    setError(null);
    setLimit(Number(event.target.value));
    setPage(1);
  };

  const handleCategoryChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setLoading(true);
    setError(null);
    setPage(1);
    setSelectedCategory(event.target.value);
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRetryKey((previous) => previous + 1);
  };

  // ==========================================================
  // AVAILABILITY TOGGLE
  // ==========================================================

  const handleToggleAvailability = async (
    event: React.MouseEvent<HTMLButtonElement>,
    item: MenuItem,
  ) => {
    event.stopPropagation();

    if (updatingItemId === item.id || deactivatingItemId) {
      return;
    }

    try {
      setUpdatingItemId(item.id);
      setActionError(null);

      const response = await updateMenuItem(item.id, {
        isAvailable: !item.isAvailable,
      });

      const updatedItem = response.data;

      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === item.id
            ? {
                ...currentItem,
                ...updatedItem,
                category: updatedItem.category ?? currentItem.category,
              }
            : currentItem,
        ),
      );
    } catch (err) {
      console.error("Failed to update menu item availability:", err);

      setActionError(
        err instanceof Error
          ? err.message
          : "Failed to update menu item availability.",
      );
    } finally {
      setUpdatingItemId(null);
    }
  };

  // ==========================================================
  // DEACTIVATE MENU ITEM
  // ==========================================================

  const handleConfirmDeactivate = async (
    event: React.MouseEvent<HTMLButtonElement>,
    item: MenuItem,
  ) => {
    event.stopPropagation();

    if (deactivatingItemId || updatingItemId) {
      return;
    }

    try {
      setDeactivatingItemId(item.id);
      setActionError(null);

      await onDeactivateMenuItem(item);

      setConfirmDeactivateItemId(null);
    } catch (err) {
      console.error("Failed to deactivate menu item:", err);

      setActionError(
        err instanceof Error ? err.message : "Failed to deactivate menu item.",
      );
    } finally {
      setDeactivatingItemId(null);
    }
  };

  // ==========================================================
  // PAGE NUMBERS
  // ==========================================================

  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 0) return [];

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages: (number | "...")[] = [1];

    if (page > 4) pages.push("...");

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let current = start; current <= end; current++) {
      pages.push(current);
    }

    if (page < totalPages - 3) pages.push("...");

    pages.push(totalPages);

    return pages;
  };

  // ==========================================================
  // INITIAL LOADING
  // ==========================================================

  if (loading && items.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
        <div className="flex min-h-[420px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />

            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
              Loading menu items...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR STATE
  // ==========================================================

  if (error && items.length === 0) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-12 text-center">
        <p className="font-mono text-xs text-rose-400">{error}</p>

        <button
          type="button"
          onClick={handleRetry}
          className="mt-4 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800"
        >
          Retry
        </button>
      </div>
    );
  }

  // ==========================================================
  // MAIN TABLE
  // ==========================================================

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
      {/* Loading overlay */}
      {loading && items.length > 0 && (
        <div className="pointer-events-none absolute inset-0 z-20 bg-zinc-950/20 backdrop-blur-[1px]">
          <div className="absolute right-4 top-4">
            <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />

              <span className="font-mono text-[9px] uppercase text-zinc-500">
                Loading
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Table header and category filter */}
      <div className="flex flex-col gap-3 border-b border-zinc-800 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-zinc-300">Menu Items</p>

          <p className="mt-1 text-[10px] text-zinc-600">
            {selectedCategory
              ? `Showing ${filteredItems.length} items in selected category`
              : `Showing ${filteredItems.length} of ${total} menu items`}
          </p>
        </div>

        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
          disabled={categoriesLoading || loading}
          aria-label="Filter menu items by category"
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-300 outline-none transition focus:border-emerald-500/50 disabled:cursor-wait disabled:opacity-50"
        >
          <option value="">
            {categoriesLoading ? "Loading categories..." : "All Categories"}
          </option>

          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Action error */}
      {actionError && (
        <div className="flex items-start justify-between gap-3 border-b border-rose-500/20 bg-rose-500/5 px-5 py-3">
          <p className="text-xs text-rose-400">{actionError}</p>

          <button
            type="button"
            onClick={() => setActionError(null)}
            className="shrink-0 text-[10px] font-semibold text-rose-400 hover:text-rose-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Empty state */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center">
          <p className="font-mono text-xs text-zinc-600">NO MENU ITEMS FOUND</p>

          {searchTerm && (
            <p className="mt-2 text-xs text-zinc-700">
              Try changing your search.
            </p>
          )}

          {selectedCategory && !searchTerm && (
            <p className="mt-2 text-xs text-zinc-700">
              No items found in this category.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left">
              <thead>
                <tr className="border-b border-zinc-800/80 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-600">
                  <th className="px-5 py-3.5">Item</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Base Price</th>
                  <th className="px-5 py-3.5">Restaurant Coverage</th>
                  <th className="px-5 py-3.5">Recipe</th>
                  <th className="px-5 py-3.5">Modifiers</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-900">
                {filteredItems.map((item) => {
                  const isUpdating = updatingItemId === item.id;
                  const isDeactivating = deactivatingItemId === item.id;

                  const isConfirmingDeactivate =
                    confirmDeactivateItemId === item.id;

                  // Stored restaurant configuration records.
                  const configuredRestaurants =
                    item.configuredRestaurantCount ?? 0;

                  // Total restaurants included in the coverage calculation.
                  const totalRestaurants = restaurants.length;

                  // Treat only explicit restaurant-level false values
                  // as unavailable.
                  const unavailableRestaurantIds =
                    item.unavailableRestaurantIds ?? [];

                  const unavailableRestaurantCount = restaurants.filter(
                    (restaurant) =>
                      unavailableRestaurantIds.includes(restaurant.id),
                  ).length;

                  // Global availability takes priority over restaurant overrides.
                  const availableRestaurantCount = item.isAvailable
                    ? Math.max(0, totalRestaurants - unavailableRestaurantCount)
                    : 0;

                  // Effective availability percentage.
                  const coveragePercentage =
                    totalRestaurants > 0
                      ? Math.round(
                          (availableRestaurantCount / totalRestaurants) * 100,
                        )
                      : 0;

                  const recipeCount = item.recipeIngredientCount ?? 0;
                  const modifierCount = item.modifierGroupCount ?? 0;

                  return (
                    <React.Fragment key={item.id}>
                      {/* MENU ITEM ROW */}
                      <tr
                        onClick={() => onSelectMenuItem(item)}
                        className="group cursor-pointer transition-all duration-200 hover:bg-zinc-900/60"
                      >
                        {/* ITEM */}
                        <td className="px-5 py-4">
                          <div className="flex min-w-[300px] items-center gap-3">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                                item.isAvailable
                                  ? "border-emerald-500/15 bg-emerald-500/[0.06]"
                                  : "border-zinc-800 bg-zinc-900"
                              }`}
                            >
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  item.isAvailable
                                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.45)]"
                                    : "bg-zinc-600"
                                }`}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-semibold text-zinc-100 transition-colors group-hover:text-white">
                                {item.name}
                              </p>

                              <div className="mt-1 flex min-w-0 items-center gap-2">
                                <span className="inline-flex shrink-0 items-center rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-[10px] font-semibold tracking-wide text-zinc-500">
                                  {item.sku}
                                </span>

                                {item.description && (
                                  <>
                                    <span className="h-0.5 w-0.5 shrink-0 rounded-full bg-zinc-700" />

                                    <span className="block w-[220px] line-clamp-2 text-[12px] leading-4 text-zinc-600">
                                      {item.description}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* CATEGORY */}
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center rounded-md border border-zinc-800 bg-zinc-900/70 px-2.5 py-1.5 text-[10px] font-medium text-zinc-400">
                            {item.category?.name ?? "Uncategorized"}
                          </span>
                        </td>

                        {/* BASE PRICE */}
                        <td className="px-5 py-4">
                          <div className="flex items-baseline gap-0.5">
                            <span className="text-[10px] text-zinc-600">₹</span>

                            <span className="font-mono text-[13px] font-semibold tabular-nums text-zinc-200">
                              {Number(item.basePrice).toFixed(2)}
                            </span>
                          </div>

                          <p className="mt-0.5 text-[9px] uppercase tracking-wider text-zinc-700">
                            Master price
                          </p>
                        </td>

                        {/* RESTAURANT COVERAGE */}
                        <td className="px-5 py-4">
                          <div className="min-w-[145px]">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-baseline gap-1">
                                <span className="font-mono text-[13px] font-semibold tabular-nums text-zinc-200">
                                  {availableRestaurantCount}
                                </span>

                                <span className="font-mono text-[10px] text-zinc-600">
                                  / {totalRestaurants}
                                </span>
                              </div>

                              <span
                                className={`font-mono text-[9px] font-bold ${
                                  coveragePercentage === 100
                                    ? "text-emerald-400"
                                    : coveragePercentage > 0
                                      ? "text-amber-400"
                                      : "text-zinc-600"
                                }`}
                              >
                                {coveragePercentage}%
                              </span>
                            </div>

                            <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-800">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  coveragePercentage === 100
                                    ? "bg-emerald-400"
                                    : coveragePercentage > 0
                                      ? "bg-amber-400"
                                      : "bg-zinc-700"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    coveragePercentage,
                                    100,
                                  )}%`,
                                }}
                              />
                            </div>

                            <p className="mt-1.5 text-[9px] text-zinc-700">
                              Effective restaurant availability
                            </p>

                            <p className="mt-0.5 text-[9px] text-zinc-600">
                              {configuredRestaurants} configuration
                              {configuredRestaurants === 1 ? "" : "s"} stored
                            </p>
                          </div>
                        </td>

                        {/* RECIPE */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900">
                              <span className="font-mono text-[10px] font-bold text-zinc-400">
                                {recipeCount}
                              </span>
                            </div>

                            <div>
                              <p className="text-[10px] font-medium text-zinc-300">
                                {recipeCount === 1
                                  ? "ingredient"
                                  : "ingredients"}
                              </p>

                              <p className="text-[9px] text-zinc-700">
                                Recipe items
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* MODIFIERS */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900">
                              <span className="font-mono text-[10px] font-bold text-zinc-400">
                                {modifierCount}
                              </span>
                            </div>

                            <div>
                              <p className="text-[10px] font-medium text-zinc-300">
                                {modifierCount === 1 ? "group" : "groups"}
                              </p>

                              <p className="text-[9px] text-zinc-700">
                                Modifier sets
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-4">
                          <div
                            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 ${
                              item.isAvailable
                                ? "border-emerald-500/15 bg-emerald-500/[0.05]"
                                : "border-rose-500/15 bg-rose-500/[0.05]"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                item.isAvailable
                                  ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                                  : "bg-rose-400"
                              }`}
                            />

                            <span
                              className={`text-[9px] font-bold tracking-wider ${
                                item.isAvailable
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                              }`}
                            >
                              {item.isAvailable ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </div>
                        </td>

                        {/* ACTIONS */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={isUpdating || isDeactivating}
                              onClick={(event) =>
                                handleToggleAvailability(event, item)
                              }
                              className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-all duration-200 disabled:cursor-wait disabled:opacity-50 ${
                                item.isAvailable
                                  ? "border-amber-500/20 bg-amber-500/[0.04] text-amber-400 hover:border-amber-500/40 hover:bg-amber-500/[0.08]"
                                  : "border-sky-500/20 bg-sky-500/[0.04] text-sky-400 hover:border-sky-500/40 hover:bg-sky-500/[0.08]"
                              }`}
                            >
                              {isUpdating ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Updating
                                </>
                              ) : item.isAvailable ? (
                                "Disable"
                              ) : (
                                "Enable"
                              )}
                            </button>

                            {/* EDIT */}
                            <button
                              type="button"
                              title="Edit menu item"
                              aria-label={`Edit ${item.name}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                onEditMenuItem(item);
                              }}
                              className="
    group
    flex
    h-8
    w-8
    shrink-0
    items-center
    justify-center
    rounded-lg
    border
    border-cyan-500/20
    bg-gradient-to-br
    from-cyan-500/[0.10]
    to-cyan-500/[0.03]
    text-cyan-400/80
    shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]
    transition-all
    duration-200
    hover:border-cyan-400/40
    hover:from-cyan-500/20
    hover:to-cyan-500/[0.08]
    hover:text-cyan-300
    hover:shadow-[0_0_14px_rgba(34,211,238,0.12)]
    active:scale-95
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-cyan-500/40
    focus-visible:ring-offset-2
    focus-visible:ring-offset-zinc-950
  "
                            >
                              <Pencil className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-[-8deg] group-hover:scale-110" />
                            </button>

                            {/* DEACTIVATE */}
                            {item.isAvailable && (
                              <button
                                type="button"
                                title="Deactivate menu item"
                                aria-label={`Deactivate ${item.name}`}
                                disabled={isDeactivating || isUpdating}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setActionError(null);
                                  setConfirmDeactivateItemId(item.id);
                                }}
                                className="
    group
    flex
    h-8
    w-8
    shrink-0
    items-center
    justify-center
    rounded-lg
    border
    border-rose-500/20
    bg-gradient-to-br
    from-rose-500/[0.10]
    to-rose-500/[0.03]
    text-rose-400/90
    shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]
    transition-all
    duration-200
    hover:border-rose-400/40
    hover:from-rose-500/20
    hover:to-rose-500/[0.08]
    hover:text-rose-300
    hover:shadow-[0_0_14px_rgba(244,63,94,0.12)]
    active:scale-95
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-rose-500/40
    focus-visible:ring-offset-2
    focus-visible:ring-offset-zinc-950
    disabled:cursor-not-allowed
    disabled:opacity-40
  "
                              >
                                <Trash2 className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6" />
                              </button>
                            )}

                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-700 transition-all group-hover:translate-x-0.5 group-hover:text-emerald-400" />
                          </div>
                        </td>
                      </tr>

                      {/* =================================================
                          RECIPE-STYLE DEACTIVATION CONFIRMATION

                          IMPORTANT:
                          This confirmation row belongs inside the same
                          fragment and tbody as its menu item.
                      ================================================= */}

                      {isConfirmingDeactivate && (
                        <tr className="border-b border-zinc-900">
                          <td colSpan={8} className="p-0">
                            <div className="border-t border-rose-500/10 bg-rose-500/[0.035] px-4 py-3">
                              <div className="flex items-center justify-between gap-4">
                                {/* Confirmation message */}
                                <div className="flex min-w-0 items-center gap-2.5">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10">
                                    <XCircle className="h-3.5 w-3.5 text-rose-400" />
                                  </div>

                                  <div className="min-w-0">
                                    <p className="text-[11px] font-medium text-zinc-300">
                                      Are you sure?
                                    </p>

                                    <p className="mt-0.5 text-[10px] text-zinc-600">
                                      Deactivate{" "}
                                      <span className="font-medium text-zinc-400">
                                        {item.name}
                                      </span>{" "}
                                      from the master catalog?
                                    </p>
                                  </div>
                                </div>

                                {/* Confirmation actions */}
                                <div className="flex shrink-0 items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={isDeactivating}
                                    onClick={() => {
                                      setConfirmDeactivateItemId(null);
                                      setActionError(null);
                                    }}
                                    className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-[10px] font-medium text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    Cancel
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isDeactivating}
                                    onClick={(event) =>
                                      void handleConfirmDeactivate(event, item)
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1.5 text-[10px] font-medium text-rose-300 transition hover:border-rose-500/30 hover:bg-rose-500/15 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    {isDeactivating && (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    )}

                                    {isDeactivating
                                      ? "Deactivating..."
                                      : "Deactivate"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {!selectedCategory && pagination && totalPages > 1 && (
            <div className="flex flex-col gap-4 border-t border-zinc-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-[11px] text-zinc-500">
                Showing{" "}
                <span className="font-semibold text-zinc-300">
                  {startItem}-{endItem}
                </span>{" "}
                of <span className="font-semibold text-zinc-300">{total}</span>{" "}
                menu items
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <select
                  value={limit}
                  onChange={handleLimitChange}
                  disabled={loading}
                  aria-label="Items per page"
                  className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-[11px] text-zinc-400 outline-none transition focus:border-emerald-500/50 disabled:opacity-50"
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>

                <button
                  type="button"
                  disabled={loading || page === 1}
                  onClick={() => goToPage(page - 1)}
                  className="flex h-8 items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-[11px] text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((pageNumber, index) => {
                    if (pageNumber === "...") {
                      return (
                        <span
                          key={`ellipsis-${index}`}
                          className="px-1.5 text-xs text-zinc-700"
                        >
                          ...
                        </span>
                      );
                    }

                    const isActive = pageNumber === page;

                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        disabled={loading}
                        onClick={() => goToPage(pageNumber)}
                        className={`h-8 min-w-8 rounded-lg px-2 text-[11px] font-semibold transition disabled:cursor-wait ${
                          isActive
                            ? "bg-emerald-500 text-zinc-950"
                            : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={loading || page === totalPages}
                  onClick={() => goToPage(page + 1)}
                  className="flex h-8 items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-[11px] text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
