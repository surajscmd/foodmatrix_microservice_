"use client";

import { useCallback, useEffect, useState } from "react";
import {
  catalogError,
  getRestaurantMenuItems,
  type RestaurantMenuEntry,
} from "@/lib/catalog-api";

export default function useRestaurantMenu(restaurantId: string) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    restaurantId: string;
    revision: number;
    items: RestaurantMenuEntry[] | null;
    error: string;
  }>();

  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMenu() {
      const items = new Map<string, RestaurantMenuEntry>();
      for (let page = 1; !controller.signal.aborted; page++) {
        const { data, pagination } = await getRestaurantMenuItems(
          restaurantId,
          page,
          50,
          { signal: controller.signal },
        );
        for (const item of data) items.set(item.id, item);
        if (page >= pagination.totalPages) break;
      }
      if (!controller.signal.aborted) {
        setResult({ restaurantId, revision, items: [...items.values()], error: "" });
      }
    }

    void loadMenu().catch((error: unknown) => {
      if (!controller.signal.aborted) {
        setResult((previous) => ({
          restaurantId,
          revision,
          items: previous?.restaurantId === restaurantId ? previous.items : null,
          error: catalogError(error, "Unable to load the restaurant menu."),
        }));
      }
    });

    return () => controller.abort();
  }, [restaurantId, revision]);

  useEffect(() => {
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refresh]);

  const current = result?.restaurantId === restaurantId ? result : undefined;
  const refreshing = current?.revision !== revision;

  return {
    items: current?.items ?? null,
    error: refreshing ? "" : (current?.error ?? ""),
    refreshing,
    refresh,
  };
}
