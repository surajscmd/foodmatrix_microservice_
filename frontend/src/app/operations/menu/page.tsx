"use client";

import React, { useEffect, useState } from "react";

import {
  createMenuItem,
  getMenuCategories,
  getMenuItems,
} from "@/lib/catalog-api";

import type {
  CreateMenuItemPayload,
  MenuCategory,
  MenuItem,
} from "@/lib/catalog-api";

import MenuScreen from "@/components/centraloperations/MenuScreen";

import { useOrganizationStore } from "@/store/organization-store";


// ============================================================
// NORMALIZERS
// ============================================================

function extractMenuItems(response: unknown): MenuItem[] {
  if (
    typeof response !== "object" ||
    response === null ||
    !("data" in response)
  ) {
    return [];
  }

  const firstData = (
    response as {
      data?: unknown;
    }
  ).data;

  if (Array.isArray(firstData)) {
    return firstData as MenuItem[];
  }

  if (
    typeof firstData === "object" &&
    firstData !== null &&
    "data" in firstData
  ) {
    const nestedData = (
      firstData as {
        data?: unknown;
      }
    ).data;

    if (Array.isArray(nestedData)) {
      return nestedData as MenuItem[];
    }
  }

  return [];
}

function extractCategories(response: unknown): MenuCategory[] {
  if (
    typeof response !== "object" ||
    response === null ||
    !("data" in response)
  ) {
    return [];
  }

  const data = (
    response as {
      data?: unknown;
    }
  ).data;

  if (Array.isArray(data)) {
    return data as MenuCategory[];
  }

  return [];
}


// ============================================================
// API LOADER
// ============================================================

async function fetchCatalogData() {
  const [menuItemsResponse, categoriesResponse] = await Promise.all([
    getMenuItems(1, 100),
    getMenuCategories(),
  ]);

  return {
    menuItems: extractMenuItems(menuItemsResponse),
    categories: extractCategories(categoriesResponse),
  };
}


// ============================================================
// PAGE
// ============================================================

export default function MenuManagementPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const restaurants = useOrganizationStore(
    (state) => state.restaurants,
  );


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const result = await fetchCatalogData();

        if (cancelled) {
          return;
        }

        setMenuItems(result.menuItems);
        setCategories(result.categories);
        setError(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Failed to load menu catalog:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load menu catalog.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);


  // ==========================================================
  // REFRESH DATA
  // ==========================================================

  const handleRefresh = async () => {
    setError(null);

    try {
      const result = await fetchCatalogData();

      setMenuItems(result.menuItems);
      setCategories(result.categories);
    } catch (error) {
      console.error("Failed to refresh catalog:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to refresh catalog.",
      );
    }
  };


  // ==========================================================
  // ADD MENU ITEM
  // ==========================================================

  const handleAddMenuItem = async (
    payload: CreateMenuItemPayload,
  ) => {
    await createMenuItem(payload);
    await handleRefresh();
  };


  // ==========================================================
  // INITIAL LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-300">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-emerald-400" />

            <p className="mt-4 font-mono text-xs text-zinc-600">
              LOADING CATALOG...
            </p>
          </div>
        </div>
      </div>
    );
  }


  // ==========================================================
  // INITIAL ERROR
  // ==========================================================

  if (error && menuItems.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-300">
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-center">

            <p className="font-mono text-[10px] text-rose-400">
              CATALOG LOAD FAILURE
            </p>

            <p className="mt-3 text-sm text-zinc-400">
              {error}
            </p>

            <button
              type="button"
              onClick={async () => {
                try {
                  setLoading(true);
                  setError(null);

                  const result = await fetchCatalogData();

                  setMenuItems(result.menuItems);
                  setCategories(result.categories);
                } catch (error) {
                  setError(
                    error instanceof Error
                      ? error.message
                      : "Unable to load catalog.",
                  );
                } finally {
                  setLoading(false);
                }
              }}
              className="mt-5 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-black transition hover:bg-emerald-400"
            >
              Retry
            </button>

          </div>
        </div>
      </div>
    );
  }


  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="min-h-screen  text-zinc-300">

      <main>
        <MenuScreen
          categories={categories}
          restaurants={restaurants}
          onAddMenuItem={handleAddMenuItem}
          onRefresh={handleRefresh}
        />
      </main>


      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && menuItems.length > 0 && (
        <div className="fixed bottom-5 right-5 z-40 max-w-sm rounded-xl border border-rose-500/20 bg-zinc-900 px-4 py-3 shadow-2xl">

          <p className="font-mono text-[9px] text-rose-400">
            CATALOG ERROR
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            {error}
          </p>

        </div>
      )}

    </div>
  );
}