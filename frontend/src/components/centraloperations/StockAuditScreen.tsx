"use client";

import { useEffect, useMemo, useState } from "react";

import { getIngredients } from "@/lib/catalog-api";
import { getRestaurants } from "@/lib/organization-api";

import {
  getRestaurantStockMovements,
  getWarehouseStockMovements,
} from "@/lib/inventory-api";

import type {
  Ingredient,
  InventoryRestaurant,
  MovementQuery,
  PaginatedResult,
  StockAuditFilterValues,
  StockMovementView,
} from "@/utils/types/inventory";

import StockAuditMetrics from "@/elements/stockaudit/StockAuditMetrics";
import StockAuditFilters from "@/elements/stockaudit/StockAuditFilters";
import StockAuditTable from "@/elements/stockaudit/StockAuditTable";
import StockAuditDetailsPopup from "@/elements/stockaudit/StockAuditDetailsPopup";

interface Props {
  warehouseId: string;
  refreshKey: number;
  onLoadingChange: (loading: boolean) => void;
  onUpdated: (date: Date) => void;
}

const INITIAL_FILTERS: StockAuditFilterValues = {
  location: "WAREHOUSE",
  restaurantId: "",
  ingredientId: "",
  movementType: "",
  fromDate: "",
  toDate: "",
};

export default function StockAuditScreen({
  warehouseId,
  refreshKey,
  onLoadingChange,
  onUpdated,
}: Props) {
  const [query, setQuery] = useState({
    filters: INITIAL_FILTERS,
    page: 1,
    limit: 10,
  });

  const [result, setResult] = useState<
    PaginatedResult<StockMovementView>
  >({
    data: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [sourcesKey, setSourcesKey] = useState(0);
  const sourcesRequest = useMemo(
    () => ({ warehouseId, sourcesKey }),
    [warehouseId, sourcesKey],
  );
  type SourceResult<T> = {
    request: typeof sourcesRequest;
    data: T[];
    error: string;
  };
  const [restaurantsResult, setRestaurantsResult] =
    useState<SourceResult<InventoryRestaurant>>();
  const [ingredientsResult, setIngredientsResult] =
    useState<SourceResult<Ingredient>>();

  const [selectedMovement, setSelectedMovement] =
    useState<StockMovementView | null>(null);

  // ======================================================
  // LOAD FILTER OPTIONS
  // ======================================================

  useEffect(() => {
    let cancelled = false;

    const loadRestaurants = async () => {
      try {
        const data = await getRestaurants();

        if (cancelled) return;

        setRestaurantsResult({
          request: sourcesRequest,
          data: data
            .filter((restaurant) => restaurant.franchiseId === warehouseId)
            .map((restaurant) => ({
              id: restaurant.id,
              name: restaurant.name,
            })),
          error: "",
        });
      } catch (error) {
        if (!cancelled) {
          setRestaurantsResult((previous) => ({
            request: sourcesRequest,
            data:
              previous?.request.warehouseId === warehouseId
                ? previous.data
                : [],
            error:
              error instanceof Error
                ? error.message
                : "Unable to load restaurants.",
          }));
        }
      }
    };

    const loadIngredients = async () => {
      try {
        const records = new Map<string, Ingredient>();

        let page = 1;
        let totalPages = 1;

        do {
          if (cancelled) return;

          const response = await getIngredients(page, 50);

          if (cancelled) return;

          if (
            !Array.isArray(response.data) ||
            !Number.isInteger(response.pagination?.totalPages) ||
            response.pagination.totalPages < 0
          ) {
            throw new Error("Invalid stock item response.");
          }

          for (const ingredient of response.data) {
            records.set(ingredient.id, {
              id: ingredient.id,
              name: ingredient.name,
              uom: ingredient.uom,
              isActive: ingredient.isActive,
            });
          }

          totalPages = response.pagination.totalPages;
          page++;
        } while (page <= totalPages);

        setIngredientsResult({
          request: sourcesRequest,
          data: [...records.values()],
          error: "",
        });
      } catch (error) {
        if (!cancelled) {
          setIngredientsResult((previous) => ({
            request: sourcesRequest,
            data: previous?.data ?? [],
            error:
              error instanceof Error
                ? error.message
                : "Unable to load stock items.",
          }));
        }
      }
    };

    void Promise.all([loadRestaurants(), loadIngredients()]);

    return () => {
      cancelled = true;
    };
  }, [warehouseId, sourcesRequest]);

  // ======================================================
  // LOAD AUDIT PAGE
  // ======================================================

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError("");
      onLoadingChange(true);

      try {
        const { filters, page, limit } = query;

        const filtersQuery: MovementQuery = {
          page,
          limit,
          ...(filters.ingredientId
            ? { ingredientId: filters.ingredientId }
            : {}),
          ...(filters.movementType
            ? { movementType: filters.movementType }
            : {}),
        };

        if (filters.fromDate) {
          filtersQuery.fromDate = new Date(
            `${filters.fromDate}T00:00:00`,
          ).toISOString();
        }

        if (filters.toDate) {
          filtersQuery.toDate = new Date(
            `${filters.toDate}T23:59:59.999`,
          ).toISOString();
        }

        if (
          filters.location === "RESTAURANT" &&
          !filters.restaurantId
        ) {
          throw new Error("Select a restaurant first.");
        }

        const response =
          filters.location === "WAREHOUSE"
            ? await getWarehouseStockMovements(
                warehouseId,
                filtersQuery,
                { signal: controller.signal },
              )
            : await getRestaurantStockMovements(
                filters.restaurantId,
                filtersQuery,
                { signal: controller.signal },
              );

        if (controller.signal.aborted) return;

        if (
          !Array.isArray(response?.data) ||
          !response.pagination ||
          !Number.isInteger(response.pagination.totalPages) ||
          response.pagination.totalPages < 0
        ) {
          throw new Error("Invalid stock audit response.");
        }

        const lastPage = Math.max(
          1,
          response.pagination.totalPages,
        );

        if (query.page > lastPage) {
          setQuery((current) =>
            current === query
              ? { ...current, page: lastPage }
              : current,
          );
          return;
        }

        setResult(response);
        onUpdated(new Date());
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load stock audit.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          onLoadingChange(false);
        }
      }
    };

    void load();

    return () => controller.abort();
  }, [
    warehouseId,
    query,
    refreshKey,
    reloadKey,
    onLoadingChange,
    onUpdated,
  ]);

  const restaurants =
    restaurantsResult?.request.warehouseId === warehouseId
      ? restaurantsResult.data
      : [];
  const restaurantsLoading = restaurantsResult?.request !== sourcesRequest;
  const ingredientsLoading = ingredientsResult?.request !== sourcesRequest;
  const locationName =
    query.filters.location === "WAREHOUSE"
      ? "Warehouse"
      : restaurants.find(
          (item) => item.id === query.filters.restaurantId,
        )?.name ?? "Restaurant";

  return (
    <div className="animate-fade-in space-y-6 p-6">
      <StockAuditMetrics
        movements={result.data}
        total={result.pagination.total}
        loading={loading}
        failed={Boolean(error)}
      />

      <StockAuditFilters
        value={query.filters}
        restaurants={restaurants}
        ingredients={ingredientsResult?.data ?? []}
        restaurantsLoading={restaurantsLoading}
        ingredientsLoading={ingredientsLoading}
        restaurantsError={restaurantsLoading ? "" : restaurantsResult.error}
        ingredientsError={ingredientsLoading ? "" : ingredientsResult.error}
        loading={loading}
        onRetrySources={() => setSourcesKey((value) => value + 1)}
        onApply={(filters) => {
          setSelectedMovement(null);
          setQuery((current) => ({
            ...current,
            filters,
            page: 1,
          }));
        }}
      />

      <StockAuditTable
        movements={result.data}
        pagination={result.pagination}
        locationName={locationName}
        loading={loading}
        error={error}
        onRetry={() => setReloadKey((value) => value + 1)}
        onPageChange={(page) =>
          setQuery((current) => ({ ...current, page }))
        }
        onLimitChange={(limit) =>
          setQuery((current) => ({
            ...current,
            limit,
            page: 1,
          }))
        }
        onView={setSelectedMovement}
      />

      {selectedMovement && (
        <StockAuditDetailsPopup
          key={selectedMovement.id}
          movement={selectedMovement}
          locationName={locationName}
          onClose={() => setSelectedMovement(null)}
        />
      )}
    </div>
  );
}
