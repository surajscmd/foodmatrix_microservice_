import { create } from "zustand";

import type {
  CurrentUserData,
  Franchise,
  OrganizationWorkspace,
  Restaurant,
} from "@/utils/types/organization";

interface OrganizationState {
  // ============================================================
  // AUTHENTICATED USER
  // ============================================================

  currentUser: CurrentUserData | null;

  // ============================================================
  // ORGANIZATION
  // ============================================================

  franchise: Franchise | null;

  // ============================================================
  // RESTAURANTS
  // ============================================================

  restaurants: Restaurant[];

  // ============================================================
  // SELECTED RESTAURANT
  // ============================================================

  selectedRestaurant: Restaurant | null;

  // ============================================================
  // LOADING / ERROR
  // ============================================================

  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  hydrateWorkspace: (workspace: OrganizationWorkspace) => void;
  restoreWorkspace: () => Promise<void>;

  // ============================================================
  // USER
  // ============================================================

  setCurrentUser: (data: CurrentUserData) => void;

  // ============================================================
  // FRANCHISE
  // ============================================================

  setFranchise: (data: Franchise | null) => void;

  // ============================================================
  // RESTAURANTS
  // ============================================================

  setRestaurants: (restaurants: Restaurant[]) => void;

  addRestaurant: (restaurant: Restaurant) => void;

  updateRestaurant: (restaurant: Restaurant) => void;

  removeRestaurant: (restaurantId: string) => void;

  // ============================================================
  // SELECTED RESTAURANT
  // ============================================================

  setSelectedRestaurant: (restaurant: Restaurant | null) => void;

  // ============================================================
  // STATE
  // ============================================================

  setLoading: (loading: boolean) => void;

  setHydrated: (hydrated: boolean) => void;

  setError: (error: string | null) => void;

  // ============================================================
  // CLEAR
  // ============================================================

  clearOrganization: () => void;
}

const initialState = {
  currentUser: null,
  franchise: null,
  restaurants: [],
  selectedRestaurant: null,
  isLoading: false,
  isHydrated: false,
  error: null,
};

let restoreRequest: AbortController | null = null;

export const useOrganizationStore = create<OrganizationState>((set, get) => ({
  ...initialState,

  hydrateWorkspace: (workspace) => {
    restoreRequest?.abort();
    restoreRequest = null;
    set({ ...workspace, isLoading: false, isHydrated: true, error: null });
  },

  restoreWorkspace: async () => {
    if (restoreRequest || (get().isHydrated && !get().error)) return;

    const pending = new AbortController();
    restoreRequest = pending;
    set({ isLoading: true, isHydrated: false, error: null });
    const fallback = "We couldn’t load your workspace. Please try again.";

    try {
      const response = await fetch("/api/workspace", {
        cache: "no-store",
        signal: pending.signal,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.workspace) {
        throw new Error(typeof data?.message === "string" ? data.message : fallback);
      }
      if (restoreRequest === pending) {
        const workspace: OrganizationWorkspace = data.workspace;
        set({ ...workspace, isLoading: false, isHydrated: true, error: null });
      }
    } catch (error) {
      if (restoreRequest === pending) {
        set({
          ...initialState,
          isHydrated: true,
          error: error instanceof Error && error.name !== "TypeError" ? error.message : fallback,
        });
      }
    } finally {
      if (restoreRequest === pending) restoreRequest = null;
    }
  },

  // ==========================================================
  // USER
  // ==========================================================

  setCurrentUser: (data) => {
    set({
      currentUser: data,
    });
  },

  // ==========================================================
  // FRANCHISE
  // ==========================================================

  setFranchise: (data) => {
    set({
      franchise: data,
    });
  },

  // ==========================================================
  // RESTAURANTS
  // ==========================================================

  setRestaurants: (restaurants) => {
    set({
      restaurants,
    });
  },

  addRestaurant: (restaurant) => {
    set((state) => ({
      restaurants: [...state.restaurants, restaurant],
    }));
  },

  updateRestaurant: (restaurant) => {
    set((state) => ({
      restaurants: state.restaurants.map((item) =>
        item.id === restaurant.id ? restaurant : item,
      ),

      selectedRestaurant:
        state.selectedRestaurant?.id === restaurant.id
          ? restaurant
          : state.selectedRestaurant,
    }));
  },

  removeRestaurant: (restaurantId) => {
    set((state) => ({
      restaurants: state.restaurants.filter(
        (restaurant) => restaurant.id !== restaurantId,
      ),

      selectedRestaurant:
        state.selectedRestaurant?.id === restaurantId
          ? null
          : state.selectedRestaurant,
    }));
  },

  // ==========================================================
  // SELECTED RESTAURANT
  // ==========================================================

  setSelectedRestaurant: (restaurant) => {
    set({
      selectedRestaurant: restaurant,
    });
  },

  // ==========================================================
  // STATE
  // ==========================================================

  setLoading: (loading) => {
    set({
      isLoading: loading,
    });
  },

  setHydrated: (hydrated) => {
    set({
      isHydrated: hydrated,
    });
  },

  setError: (error) => {
    set({
      error,
    });
  },

  // ==========================================================
  // CLEAR
  // ==========================================================

  clearOrganization: () => {
    restoreRequest?.abort();
    restoreRequest = null;
    set({
      ...initialState,
    });
  },
}));
