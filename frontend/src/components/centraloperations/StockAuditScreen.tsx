"use client";

import { useEffect, useState } from "react";

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

  const [restaurants, setRestaurants] =
    useState<InventoryRestaurant[]>([]);

  const [ingredients, setIngredients] =
    useState<Ingredient[]>([]);

  const [restaurantsLoading, setRestaurantsLoading] =
    useState(true);

  const [ingredientsLoading, setIngredientsLoading] =
    useState(true);

  const [restaurantsError, setRestaurantsError] = useState("");
  const [ingredientsError, setIngredientsError] = useState("");
  const [sourcesKey, setSourcesKey] = useState(0);

  const [selectedMovement, setSelectedMovement] =
    useState<StockMovementView | null>(null);

  // ======================================================
  // LOAD FILTER OPTIONS
  // ======================================================

  useEffect(() => {
    let cancelled = false;

    setRestaurantsLoading(true);
    setIngredientsLoading(true);
    setRestaurantsError("");
    setIngredientsError("");

    const loadRestaurants = async () => {
      try {
        const data = await getRestaurants();

        if (cancelled) return;

        setRestaurants(
          data
            .filter((restaurant) => restaurant.franchiseId === warehouseId)
            .map((restaurant) => ({
              id: restaurant.id,
              name: restaurant.name,
            })),
        );
      } catch (error) {
        if (!cancelled) {
          setRestaurantsError(
            error instanceof Error
              ? error.message
              : "Unable to load restaurants.",
          );
        }
      } finally {
        if (!cancelled) setRestaurantsLoading(false);
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

        setIngredients([...records.values()]);
      } catch (error) {
        if (!cancelled) {
          setIngredientsError(
            error instanceof Error
              ? error.message
              : "Unable to load stock items.",
          );
        }
      } finally {
        if (!cancelled) setIngredientsLoading(false);
      }
    };

    void Promise.all([loadRestaurants(), loadIngredients()]);

    return () => {
      cancelled = true;
    };
  }, [warehouseId, sourcesKey]);

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
        ingredients={ingredients}
        restaurantsLoading={restaurantsLoading}
        ingredientsLoading={ingredientsLoading}
        restaurantsError={restaurantsError}
        ingredientsError={ingredientsError}
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