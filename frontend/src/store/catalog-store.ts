"use client";

import { create } from "zustand";

import {
  createIngredient,
  deleteIngredient,
  getIngredientById,
  getIngredients,
  updateIngredient,
} from "@/lib/catalog-api";

import type {
  CreateIngredientPayload,
  Ingredient,
  UpdateIngredientPayload,
} from "@/lib/catalog-api";

interface CatalogStore {
  // ============================================================
  // INGREDIENTS
  // ============================================================

  ingredients: Ingredient[];

  ingredientsLoading: boolean;
  ingredientsRefreshing: boolean;

  ingredientsError: string | null;

  ingredientsPage: number;
  ingredientsLimit: number;
  ingredientsTotal: number;
  ingredientsTotalPages: number;

  // ============================================================
  // INGREDIENT ACTIONS
  // ============================================================

  fetchIngredients: (
    page?: number,
    limit?: number,
  ) => Promise<void>;

  refreshIngredients: () => Promise<void>;

  getIngredient: (
    ingredientId: string,
  ) => Promise<Ingredient>;

  addIngredient: (
    data: CreateIngredientPayload,
  ) => Promise<Ingredient>;

  editIngredient: (
    ingredientId: string,
    data: UpdateIngredientPayload,
  ) => Promise<Ingredient>;

  deactivateIngredient: (
    ingredientId: string,
  ) => Promise<Ingredient>;

  activateIngredient: (
    ingredientId: string,
  ) => Promise<Ingredient>;

  setIngredients: (ingredients: Ingredient[]) => void;

  clearIngredientsError: () => void;

  resetIngredients: () => void;
}

const INITIAL_STATE = {
  ingredients: [],

  ingredientsLoading: false,
  ingredientsRefreshing: false,

  ingredientsError: null,

  ingredientsPage: 1,
  ingredientsLimit: 20,
  ingredientsTotal: 0,
  ingredientsTotalPages: 0,
};

export const useCatalogStore = create<CatalogStore>((set, get) => ({
  ...INITIAL_STATE,

  // ============================================================
  // FETCH INGREDIENTS
  // ============================================================

  fetchIngredients: async (page = 1, limit = 20) => {
    try {
      set({
        ingredientsLoading: true,
        ingredientsError: null,
      });

      const response = await getIngredients(page, limit);

      /*
       * Backend response:
       *
       * {
       *   message: string,
       *   data: Ingredient[],
       *   pagination: {
       *     page,
       *     limit,
       *     total,
       *     totalPages
       *   }
       * }
       */

      set({
        ingredients: response.data ?? [],

        ingredientsPage:
          response.pagination?.page ?? page,

        ingredientsLimit:
          response.pagination?.limit ?? limit,

        ingredientsTotal:
          response.pagination?.total ?? 0,

        ingredientsTotalPages:
          response.pagination?.totalPages ?? 0,

        ingredientsLoading: false,
        ingredientsRefreshing: false,
        ingredientsError: null,
      });
    } catch (error) {
      console.error("Failed to fetch ingredients:", error);

      set({
        ingredientsLoading: false,
        ingredientsRefreshing: false,

        ingredientsError:
          error instanceof Error
            ? error.message
            : "Failed to fetch ingredients.",
      });
    }
  },

  // ============================================================
  // REFRESH
  // ============================================================

  refreshIngredients: async () => {
    const {
      ingredientsPage,
      ingredientsLimit,
    } = get();

    try {
      set({
        ingredientsRefreshing: true,
        ingredientsError: null,
      });

      const response = await getIngredients(
        ingredientsPage,
        ingredientsLimit,
      );

      set({
        ingredients: response.data ?? [],

        ingredientsPage:
          response.pagination?.page ?? ingredientsPage,

        ingredientsLimit:
          response.pagination?.limit ?? ingredientsLimit,

        ingredientsTotal:
          response.pagination?.total ?? 0,

        ingredientsTotalPages:
          response.pagination?.totalPages ?? 0,

        ingredientsRefreshing: false,
        ingredientsError: null,
      });
    } catch (error) {
      console.error("Failed to refresh ingredients:", error);

      set({
        ingredientsRefreshing: false,

        ingredientsError:
          error instanceof Error
            ? error.message
            : "Failed to refresh ingredients.",
      });
    }
  },

  // ============================================================
  // GET SINGLE INGREDIENT
  // ============================================================

  getIngredient: async (ingredientId: string) => {
    const response = await getIngredientById(ingredientId);

    return response.data;
  },

  // ============================================================
  // CREATE
  // ============================================================

  addIngredient: async (
    data: CreateIngredientPayload,
  ) => {
    try {
      set({
        ingredientsError: null,
      });

      const response = await createIngredient(data);

      const ingredient = response.data;

      /*
       * Add immediately to current Zustand list when possible.
       *
       * We don't force a full refetch here because the backend
       * may paginate the collection.
       */

      set((state) => ({
        ingredients: [
          ...state.ingredients,
          ingredient,
        ],
        ingredientsTotal:
          state.ingredientsTotal + 1,
        ingredientsError: null,
      }));

      return ingredient;
    } catch (error) {
      console.error("Failed to create ingredient:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Failed to create ingredient.";

      set({
        ingredientsError: message,
      });

      throw error;
    }
  },

  // ============================================================
  // UPDATE
  // ============================================================

  editIngredient: async (
    ingredientId: string,
    data: UpdateIngredientPayload,
  ) => {
    try {
      set({
        ingredientsError: null,
      });

      const response = await updateIngredient(
        ingredientId,
        data,
      );

      const updatedIngredient = response.data;

      set((state) => ({
        ingredients: state.ingredients.map(
          (ingredient) =>
            ingredient.id === ingredientId
              ? updatedIngredient
              : ingredient,
        ),

        ingredientsError: null,
      }));

      return updatedIngredient;
    } catch (error) {
      console.error("Failed to update ingredient:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Failed to update ingredient.";

      set({
        ingredientsError: message,
      });

      throw error;
    }
  },

  // ============================================================
  // DEACTIVATE
  // ============================================================

  deactivateIngredient: async (
    ingredientId: string,
  ) => {
    try {
      set({
        ingredientsError: null,
      });

      const response = await deleteIngredient(
        ingredientId,
      );

      const deactivatedIngredient = response.data;

      set((state) => ({
        ingredients: state.ingredients.map(
          (ingredient) =>
            ingredient.id === ingredientId
              ? deactivatedIngredient
              : ingredient,
        ),

        ingredientsError: null,
      }));

      return deactivatedIngredient;
    } catch (error) {
      console.error(
        "Failed to deactivate ingredient:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to deactivate ingredient.";

      set({
        ingredientsError: message,
      });

      throw error;
    }
  },

  // ============================================================
  // ACTIVATE
  // ============================================================

  activateIngredient: async (
    ingredientId: string,
  ) => {
    try {
      set({
        ingredientsError: null,
      });

      const response = await updateIngredient(
        ingredientId,
        {
          isActive: true,
        },
      );

      const activatedIngredient = response.data;

      set((state) => ({
        ingredients: state.ingredients.map(
          (ingredient) =>
            ingredient.id === ingredientId
              ? activatedIngredient
              : ingredient,
        ),

        ingredientsError: null,
      }));

      return activatedIngredient;
    } catch (error) {
      console.error(
        "Failed to activate ingredient:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to activate ingredient.";

      set({
        ingredientsError: message,
      });

      throw error;
    }
  },

  // ============================================================
  // SET INGREDIENTS
  // ============================================================

  setIngredients: (ingredients) => {
    set({
      ingredients,
    });
  },

  // ============================================================
  // CLEAR ERROR
  // ============================================================

  clearIngredientsError: () => {
    set({
      ingredientsError: null,
    });
  },

  // ============================================================
  // RESET
  // ============================================================

  resetIngredients: () => {
    set({
      ...INITIAL_STATE,
    });
  },
}));