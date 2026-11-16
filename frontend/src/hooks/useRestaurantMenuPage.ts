"use client";

import { useCallback, useEffect, useState } from "react";
import {
  catalogError,
  getMenuCategories,
  getRestaurantMenuItems,
  type MenuCategory,
  type RestaurantMenuFilters,
  type RestaurantMenuPage,
} from "@/lib/catalog-api";

type MenuQuery = RestaurantMenuFilters & { page: number; limit: number };

export default function useRestaurantMenuPage(restaurantId: string) {
  const [query, setQuery] = useState<MenuQuery>({ page: 1, limit: 10 });
  const [search, setSearch] = useState("");
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    query: MenuQuery;
    revision: number;
    menu: RestaurantMenuPage | null;
    error: string;
  }>();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [categoryError, setCategoryError] = useState("");

  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  const term = search.trim() || undefined;
  const searching = term !== query.search;

  useEffect(() => {
    if (!searching) return;
    const timeout = window.setTimeout(() => {
      setQuery((current) => ({ ...current, page: 1, search: term }));
    }, 240);
    return () => window.clearTimeout(timeout);
  }, [searching, term]);

  useEffect(() => {
    const { page, limit, ...filters } = query;
    const controller = new AbortController();
    void getRestaurantMenuItems(restaurantId, page, limit, {
      ...filters,
      includeAvailabilityCounts: true,
      signal: controller.signal,
    })
      .then((menu) => {
        if (controller.signal.aborted) return;
        const lastPage = Math.max(1, menu.pagination.totalPages);
        if (page > lastPage) {
          setQuery((current) =>
            current === query ? { ...query, page: lastPage } : current,
          );
          return;
        }
        setResult({ query, revision, menu, error: "" });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResult((previous) => ({
          query,
          revision,
          menu: previous?.query === query ? previous.menu : null,
          error: catalogError(error, "Unable to load the restaurant menu."),
        }));
      });

    return () => controller.abort();
  }, [restaurantId, query, revision]);

  useEffect(() => {
    const controller = new AbortController();
    void getMenuCategories(controller.signal)
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        setCategories(data.filter((category) => category.isActive));
        setCategoryError("");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setCategoryError(catalogError(error, "Unable to load menu categories."));
      });
    return () => controller.abort();
  }, [revision]);

  useEffect(() => {
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refresh]);

  const current = result?.query === query ? result : undefined;
  const refreshing = current?.revision !== revision;
  const availabilityCounts =
    result?.query.categoryId === query.categoryId &&
    result?.query.search === query.search
      ? result?.menu?.availabilityCounts
      : undefined;

  return {
    query,
    search,
    setSearch,
    categories,
    categoryError,
    availabilityCounts,
    menu: current?.menu ?? null,
    error: refreshing ? "" : (current?.error ?? ""),
    refreshing,
    searching,
    refresh,
    changeFilters: (filters: Partial<Omit<MenuQuery, "page" | "search">>) =>
      setQuery((current) => ({ ...current, ...filters, page: 1, search: term })),
    changePage: (page: number) => setQuery((current) => ({ ...current, page })),
  };
}
