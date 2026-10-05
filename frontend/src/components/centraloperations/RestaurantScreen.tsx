"use client";

import { useCallback, useMemo, useState } from "react";

import {
  AlertCircle,
  AlertTriangle,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

import {
  createRestaurant,
  deleteRestaurant,
  getRestaurants,
  updateRestaurant,
} from "@/lib/organization-api";

import { useOrganizationStore } from "@/store/organization-store";

import type {
  CreateRestaurantData,
  Restaurant,
  SystemUserRole,
  UpdateRestaurantData,
} from "@/utils/types/organization";

import AddRestaurantDrawer from "@/elements/Restaurantscreen/AddRestaurantDrawer";
import DiagnosticView from "@/elements/Restaurantscreen/DiagnosticView";
import FilterBar from "@/elements/Restaurantscreen/FilterBar";
import FranchiseKPIs from "@/elements/Restaurantscreen/FranchiseKPIs";
import RestaurantGrid from "@/elements/Restaurantscreen/RestaurantGrid";

interface RestaurantScreenProps {
  searchTerm?: string;
}

type StatusFilter = "ALL" | Restaurant["status"];

type DrawerMode = "create" | "edit";

export default function RestaurantScreen({
  searchTerm = "",
}: RestaurantScreenProps) {
  // ============================================================
  // ZUSTAND
  // ============================================================

  const restaurants = useOrganizationStore((state) => state.restaurants);

  const currentUser = useOrganizationStore((state) => state.currentUser);

  const setRestaurants = useOrganizationStore((state) => state.setRestaurants);

  // ============================================================
  // LOCAL UI STATE
  // ============================================================

  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const isOrganizationLoading = useOrganizationStore(
    (state) => state.isLoading,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");

  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(
    null,
  );

  // Delete confirmation
  const [restaurantToDelete, setRestaurantToDelete] =
    useState<Restaurant | null>(null);

  // ============================================================
  // DERIVED USER DATA
  // ============================================================

  const currentUserRole: SystemUserRole | null =
    currentUser?.systemUser.role ?? null;

  const franchiseId = currentUser?.systemUser.franchiseId ?? null;

  // ============================================================
  // PERMISSIONS
  // ============================================================

  const canCreate =
    currentUserRole === "SUPER_ADMIN" || currentUserRole === "FRANCHISE_ADMIN";

  const canEdit =
    currentUserRole === "SUPER_ADMIN" ||
    currentUserRole === "FRANCHISE_ADMIN" ||
    currentUserRole === "RESTAURANT_ADMIN";

  const canDelete = currentUserRole === "SUPER_ADMIN";

  // ============================================================
  // INITIAL STATE
  // ============================================================

  // ============================================================
  // SEARCH
  // ============================================================

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  // ============================================================
  // FILTER
  // ============================================================

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((restaurant) => {
      const matchesStatus =
        statusFilter === "ALL" || restaurant.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearchTerm) {
        return true;
      }

      const searchableValues = [
        restaurant.id,
        restaurant.name,
        restaurant.address,
        restaurant.city,
        restaurant.state ?? "",
        restaurant.country,
        restaurant.timezone,
        restaurant.franchiseId,
        restaurant.status,
      ];

      return searchableValues.some((value) =>
        value.toLowerCase().includes(normalizedSearchTerm),
      );
    });
  }, [restaurants, statusFilter, normalizedSearchTerm]);

  // ============================================================
  // SELECT
  // ============================================================

  const handleSelectRestaurant = useCallback(
    (restaurantId: string) => {
      const restaurant = restaurants.find((item) => item.id === restaurantId);

      if (!restaurant) {
        return;
      }

      setSelectedRestaurant(restaurant);
    },
    [restaurants],
  );

  // ============================================================
  // BACK
  // ============================================================

  const handleBack = useCallback(() => {
    setSelectedRestaurant(null);
  }, []);

  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      const data = await getRestaurants();

      // Update shared Zustand state
      setRestaurants(data);

      setLastUpdated(new Date());

      setSelectedRestaurant((current) => {
        if (!current) {
          return null;
        }

        return data.find((restaurant) => restaurant.id === current.id) ?? null;
      });
    } catch (err) {
      console.error("Failed to refresh restaurants:", err);

      setError("Unable to refresh restaurant nodes.");
    } finally {
      setIsRefreshing(false);
    }
  }, [setRestaurants]);

  // ============================================================
  // CREATE
  // ============================================================

  const handleCreateRestaurant = useCallback(
    async (data: CreateRestaurantData) => {
      try {
        setIsSubmitting(true);
        setError(null);

        const createdRestaurant = await createRestaurant(data);

        // Update Zustand
        setRestaurants([createdRestaurant, ...restaurants]);

        setLastUpdated(new Date());

        setIsDrawerOpen(false);
        setDrawerMode("create");
        setEditingRestaurant(null);
      } catch (err) {
        console.error("Failed to create restaurant:", err);

        throw new Error("Unable to create restaurant node.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [restaurants, setRestaurants],
  );

  // ============================================================
  // OPEN EDIT
  // ============================================================

  const handleOpenEdit = useCallback(() => {
    if (!selectedRestaurant || !canEdit) {
      return;
    }

    setDrawerMode("edit");
    setEditingRestaurant(selectedRestaurant);
    setIsDrawerOpen(true);
  }, [selectedRestaurant, canEdit]);

  // ============================================================
  // UPDATE RESTAURANT
  // ============================================================

  const handleUpdateRestaurant = useCallback(
    async (restaurantId: string, data: UpdateRestaurantData) => {
      try {
        setIsSubmitting(true);
        setError(null);

        const updatedRestaurant = await updateRestaurant(restaurantId, data);

        // Update Zustand
        setRestaurants(
          restaurants.map((restaurant) =>
            restaurant.id === restaurantId ? updatedRestaurant : restaurant,
          ),
        );

        setSelectedRestaurant(updatedRestaurant);

        setLastUpdated(new Date());

        setIsDrawerOpen(false);
        setDrawerMode("create");
        setEditingRestaurant(null);
      } catch (err) {
        console.error("Failed to update restaurant:", err);

        throw new Error("Unable to update restaurant node.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [restaurants, setRestaurants],
  );

  // ============================================================
  // UPDATE STATUS
  // ============================================================

  const handleUpdateStatus = useCallback(
    async (restaurantId: string, status: Restaurant["status"]) => {
      const existing = restaurants.find(
        (restaurant) => restaurant.id === restaurantId,
      );

      if (!existing) {
        return;
      }

      if (existing.status === status) {
        return;
      }

      try {
        setIsUpdatingStatus(true);
        setError(null);

        const updated = await updateRestaurant(restaurantId, { status });

        // Update Zustand
        setRestaurants(
          restaurants.map((restaurant) =>
            restaurant.id === restaurantId ? updated : restaurant,
          ),
        );

        setSelectedRestaurant(updated);

        setLastUpdated(new Date());
      } catch (err) {
        console.error("Failed to update restaurant status:", err);

        setError("Unable to update restaurant status.");
      } finally {
        setIsUpdatingStatus(false);
      }
    },
    [restaurants, setRestaurants],
  );

  // ============================================================
  // DELETE
  // ============================================================

  const handleRequestDelete = useCallback(() => {
    if (!selectedRestaurant || !canDelete) {
      return;
    }

    setRestaurantToDelete(selectedRestaurant);
  }, [selectedRestaurant, canDelete]);

  const handleCancelDelete = useCallback(() => {
    if (isDeleting) {
      return;
    }

    setRestaurantToDelete(null);
  }, [isDeleting]);

  const handleConfirmDelete = useCallback(async () => {
    if (!restaurantToDelete || !canDelete) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);

      await deleteRestaurant(restaurantToDelete.id);

      // Update Zustand
      setRestaurants(
        restaurants.filter(
          (restaurant) => restaurant.id !== restaurantToDelete.id,
        ),
      );

      setSelectedRestaurant(null);
      setRestaurantToDelete(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to delete restaurant:", err);

      setError("Unable to delete restaurant node.");
    } finally {
      setIsDeleting(false);
    }
  }, [restaurantToDelete, canDelete, restaurants, setRestaurants]);

  // ============================================================
  // SELECTED RESTAURANT VIEW
  // ============================================================

  if (selectedRestaurant) {
    return (
      <div className="relative">
        {isUpdatingStatus && (
          <div className="absolute right-6 top-4 z-20 flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-400 shadow-xl">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
            Updating node status...
          </div>
        )}

        <DiagnosticView
          restaurant={selectedRestaurant}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={handleOpenEdit}
          onDelete={handleRequestDelete}
          onUpdateStatus={handleUpdateStatus}
          onBack={handleBack}
        />

        {/* DELETE CONFIRMATION */}
        {restaurantToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-zinc-950/70 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#0c0c0e] p-6 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-rose-500/10 p-2 text-rose-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Delete restaurant node?
                  </h3>

                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                    This will remove{" "}
                    <span className="font-semibold text-zinc-300">
                      {restaurantToDelete.name}
                    </span>{" "}
                    from the Organization Service.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                <span className="block font-mono text-[9px] uppercase text-zinc-600">
                  Node ID
                </span>

                <span className="break-all font-mono text-xs text-zinc-300">
                  {restaurantToDelete.id}
                </span>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 py-2 text-xs font-medium text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => void handleConfirmDelete()}
                  disabled={isDeleting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500 py-2 text-xs font-semibold text-zinc-950 transition-all hover:bg-rose-400 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete Node
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT / CREATE DRAWER */}
        <AddRestaurantDrawer
          key={`${drawerMode}-${editingRestaurant?.id ?? "new"}`}
          isOpen={isDrawerOpen}
          mode={drawerMode}
          isSubmitting={isSubmitting}
          franchiseId={franchiseId}
          initialRestaurant={editingRestaurant}
          onClose={() => {
            if (isSubmitting) {
              return;
            }

            setIsDrawerOpen(false);
            setDrawerMode("create");
            setEditingRestaurant(null);
          }}
          onCreateRestaurant={handleCreateRestaurant}
          onUpdateRestaurant={handleUpdateRestaurant}
        />
      </div>
    );
  }

  // ============================================================
  // INITIAL LOADING
  // ============================================================

if (isOrganizationLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-24 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/50"
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="h-64 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/50"
            />
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 font-mono text-xs text-zinc-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Connecting to Organization Service...
        </div>
      </div>
    );
  }

  // ============================================================
  // FATAL ERROR
  // ============================================================

  if (error && restaurants.length === 0) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-rose-500/10 bg-zinc-900/50 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-7 w-7 text-rose-400" />

          <h3 className="text-sm font-semibold text-white">
            Organization Service unavailable
          </h3>

          <p className="mx-auto mt-1 max-w-md text-xs text-zinc-500">{error}</p>

          <button
            type="button"
            onClick={() => void handleRefresh()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 transition-all hover:border-emerald-500/30 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry connection
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN SCREEN
  // ============================================================

  return (
    <div className="space-y-6 p-6">
      {/* Error */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/10 bg-rose-500/5 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>

          <button
            type="button"
            onClick={() => setError(null)}
            className="text-zinc-500 hover:text-white"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI */}
      <FranchiseKPIs restaurants={restaurants} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Restaurant Nodes</h2>

          <p className="mt-0.5 font-mono text-[10px] uppercase text-zinc-600">
            Organization Registry
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="hidden font-mono text-[10px] text-zinc-600 sm:block">
              Synced {lastUpdated.toLocaleTimeString()}
            </span>
          )}

          {canCreate && (
            <button
              type="button"
              onClick={() => {
                setDrawerMode("create");
                setEditingRestaurant(null);
                setIsDrawerOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-[11px] font-semibold text-zinc-950 transition-all hover:bg-emerald-400"
              id="btn-launch-restaurant"
            >
              <Plus className="h-3.5 w-3.5" />
              Launch Node
            </button>
          )}

          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
            className="rounded-xl border border-zinc-800 p-2 text-zinc-500 transition-all hover:border-emerald-500/30 hover:text-white disabled:opacity-50"
            aria-label="Refresh restaurants"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Filter */}
      <FilterBar
        status={statusFilter}
        onStatusChange={setStatusFilter}
        resultCount={filteredRestaurants.length}
        totalCount={restaurants.length}
      />

      {/* Grid */}
      <RestaurantGrid
        restaurants={filteredRestaurants}
        onSelect={handleSelectRestaurant}
      />

      {/* Create / Edit Drawer */}
      <AddRestaurantDrawer
        key={`${drawerMode}-${editingRestaurant?.id ?? "new"}`}
        isOpen={isDrawerOpen}
        mode={drawerMode}
        isSubmitting={isSubmitting}
        franchiseId={franchiseId}
        initialRestaurant={editingRestaurant}
        onClose={() => {
          if (isSubmitting) {
            return;
          }

          setIsDrawerOpen(false);
          setDrawerMode("create");
          setEditingRestaurant(null);
        }}
        onCreateRestaurant={handleCreateRestaurant}
        onUpdateRestaurant={handleUpdateRestaurant}
      />
    </div>
  );
}
