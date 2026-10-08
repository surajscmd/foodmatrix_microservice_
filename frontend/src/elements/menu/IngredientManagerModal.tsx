"use client";

import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Loader2,
  PackagePlus,
  Power,
  RefreshCw,
  Search,
  Wheat,
  X,
} from "lucide-react";

import { useCatalogStore } from "@/store/catalog-store";

interface IngredientManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngredientsChanged?: () => void;
}

interface FormState {
  name: string;
  uom: string;
  isActive: boolean;
}

const INITIAL_FORM: FormState = {
  name: "",
  uom: "",
  isActive: true,
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export default function IngredientManagerModal({
  isOpen,
  onClose,
  onIngredientsChanged,
}: IngredientManagerModalProps) {
  // ============================================================
  // ZUSTAND
  // ============================================================

  const ingredients = useCatalogStore((state) => state.ingredients);

  const ingredientsLoading = useCatalogStore(
    (state) => state.ingredientsLoading,
  );

  const ingredientsRefreshing = useCatalogStore(
    (state) => state.ingredientsRefreshing,
  );

  const ingredientsError = useCatalogStore(
    (state) => state.ingredientsError,
  );

  const ingredientsPage = useCatalogStore(
    (state) => state.ingredientsPage,
  );

  const ingredientsLimit = useCatalogStore(
    (state) => state.ingredientsLimit,
  );

  const ingredientsTotal = useCatalogStore(
    (state) => state.ingredientsTotal,
  );

  const ingredientsTotalPages = useCatalogStore(
    (state) => state.ingredientsTotalPages,
  );

  const fetchIngredients = useCatalogStore(
    (state) => state.fetchIngredients,
  );

  const refreshIngredients = useCatalogStore(
    (state) => state.refreshIngredients,
  );

  const addIngredient = useCatalogStore(
    (state) => state.addIngredient,
  );

  const editIngredient = useCatalogStore(
    (state) => state.editIngredient,
  );

  const deactivateIngredient = useCatalogStore(
    (state) => state.deactivateIngredient,
  );

  const activateIngredient = useCatalogStore(
    (state) => state.activateIngredient,
  );

  const clearIngredientsError = useCatalogStore(
    (state) => state.clearIngredientsError,
  );

  // ============================================================
  // LOCAL UI STATE
  // ============================================================

  const [searchTerm, setSearchTerm] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [editingIngredientId, setEditingIngredientId] = useState<
    string | null
  >(null);

  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [actionIngredientId, setActionIngredientId] =
    useState<string | null>(null);

  const [localError, setLocalError] = useState<string | null>(
    null,
  );

  // ============================================================
  // LOAD INGREDIENTS
  // ============================================================

  useEffect(() => {
    if (!isOpen || ingredients.length > 0) {
      return;
    }

    void fetchIngredients(1, ingredientsLimit);
  }, [
    isOpen,
    ingredients.length,
    ingredientsLimit,
    fetchIngredients,
  ]);

  // ============================================================
  // FILTER
  // ============================================================

  const filteredIngredients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return ingredients;
    }

    return ingredients.filter((ingredient) => {
      return (
        ingredient.name.toLowerCase().includes(query) ||
        ingredient.uom.toLowerCase().includes(query) ||
        (ingredient.isActive
          ? "active"
          : "inactive"
        ).includes(query)
      );
    });
  }, [ingredients, searchTerm]);

  // ============================================================
  // DERIVED STATE
  // ============================================================

  const isEditing = editingIngredientId !== null;

  const firstVisibleRow =
    ingredientsTotal === 0
      ? 0
      : (ingredientsPage - 1) * ingredientsLimit + 1;

  const lastVisibleRow =
    ingredientsTotal === 0
      ? 0
      : Math.min(
          ingredientsPage * ingredientsLimit,
          ingredientsTotal,
        );

  const visibleError = localError ?? ingredientsError;

  // ============================================================
  // FORM HELPERS
  // ============================================================

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingIngredientId(null);
    setIsFormOpen(false);
    setLocalError(null);
  };

  // ============================================================
  // CLOSE
  // ============================================================

  const handleClose = () => {
    setSearchTerm("");
    setLocalError(null);
    clearIngredientsError();
    resetForm();
    onClose();
  };

  // ============================================================
  // CREATE
  // ============================================================

  const openCreateForm = () => {
    clearIngredientsError();
    setLocalError(null);

    setEditingIngredientId(null);

    setForm({
      name: "",
      uom: "",
      isActive: true,
    });

    setIsFormOpen(true);
  };

  // ============================================================
  // EDIT
  // ============================================================

  const openEditForm = (ingredientId: string) => {
    const ingredient = ingredients.find(
      (item) => item.id === ingredientId,
    );

    if (!ingredient) {
      return;
    }

    clearIngredientsError();
    setLocalError(null);

    setEditingIngredientId(ingredient.id);

    setForm({
      name: ingredient.name,
      uom: ingredient.uom,
      isActive: ingredient.isActive,
    });

    setIsFormOpen(true);
  };

  // ============================================================
  // CREATE / UPDATE
  // ============================================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const name = form.name.trim();
    const uom = form.uom.trim();

    if (!name) {
      setLocalError("Ingredient name is required.");
      return;
    }

    if (!uom) {
      setLocalError("Unit of measure is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setLocalError(null);
      clearIngredientsError();

      if (editingIngredientId) {
        await editIngredient(editingIngredientId, {
          name,
          uom,
          isActive: form.isActive,
        });
      } else {
        await addIngredient({
          name,
          uom,
          isActive: form.isActive,
        });
      }

      resetForm();

      onIngredientsChanged?.();
    } catch (error) {
      setLocalError(
        getErrorMessage(
          error,
          editingIngredientId
            ? "Unable to update ingredient."
            : "Unable to create ingredient.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // ACTIVATE / DEACTIVATE
  // ============================================================

  const handleToggleStatus = async (
    ingredientId: string,
    isCurrentlyActive: boolean,
  ) => {
    if (actionIngredientId === ingredientId) {
      return;
    }

    try {
      setActionIngredientId(ingredientId);
      setLocalError(null);
      clearIngredientsError();

      if (isCurrentlyActive) {
        await deactivateIngredient(ingredientId);
      } else {
        await activateIngredient(ingredientId);
      }

      onIngredientsChanged?.();
    } catch (error) {
      const ingredient = ingredients.find(
        (item) => item.id === ingredientId,
      );

      setLocalError(
        getErrorMessage(
          error,
          `Unable to ${
            isCurrentlyActive ? "deactivate" : "activate"
          } "${ingredient?.name ?? "ingredient"}".`,
        ),
      );
    } finally {
      setActionIngredientId(null);
    }
  };

  // ============================================================
  // PAGE CHANGE
  // ============================================================

  const handlePageChange = async (page: number) => {
    if (
      page < 1 ||
      page > ingredientsTotalPages ||
      page === ingredientsPage ||
      ingredientsLoading ||
      ingredientsRefreshing
    ) {
      return;
    }

    setLocalError(null);
    clearIngredientsError();

    await fetchIngredients(page, ingredientsLimit);
  };

  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh = async () => {
    try {
      setLocalError(null);
      clearIngredientsError();

      await refreshIngredients();
    } catch (error) {
      setLocalError(
        getErrorMessage(
          error,
          "Unable to refresh ingredients.",
        ),
      );
    }
  };

  // ============================================================
  // CLOSED
  // ============================================================

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  // ============================================================
  // RENDER
  // ============================================================

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* ========================================================
          BACKDROP
      ======================================================== */}

      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-md"
        onMouseDown={handleClose}
      />

      {/* ========================================================
          MODAL
      ======================================================== */}

      <div className="relative flex h-full w-full items-center justify-center p-4 sm:p-6">
        <div
          className="relative flex h-[min(820px,calc(100vh-2rem))] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-zinc-800/90 bg-gradient-to-br from-[#0d1117] via-[#090b0f] to-[#07090c] shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
          onMouseDown={(event) => event.stopPropagation()}
        >
          {/* Ambient background */}
          {/* <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:36px_36px]" /> */}

          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-500/[0.07] blur-3xl" />

          <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-cyan-500/[0.045] blur-3xl" />

          <div className="pointer-events-none absolute right-1/3 bottom-0 h-56 w-56 rounded-full bg-violet-500/[0.035] blur-3xl" />

          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/80 to-cyan-400/60" />

          {/* ====================================================
              HEADER
          ==================================================== */}

          <div className="relative flex shrink-0 items-center justify-between border-b border-zinc-800/80 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/15 via-cyan-400/10 to-violet-400/10 shadow-[0_0_28px_rgba(52,211,153,0.08)]">
                <div className="absolute inset-0 rounded-2xl bg-emerald-400/5 blur-md" />

                <Wheat className="relative h-5 w-5 text-emerald-300" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-[0.22em] text-zinc-500">
                    Catalog
                  </span>

                  <span className="text-zinc-800">
                    /
                  </span>

                  <span className="text-[9px] font-mono font-bold uppercase tracking-[0.22em] text-cyan-400/80">
                    Ingredients
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white">
                    Ingredient Registry
                  </h2>

                  <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 font-mono text-[9px] font-bold text-cyan-400">
                    {ingredientsTotal}
                  </span>
                </div>

                <p className="mt-1 text-[10px] text-zinc-600">
                  Central ingredient master for recipes and menu
                  operations.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="group flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-500 transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
            >
              <X className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
            </button>
          </div>

          {/* ====================================================
              TOOLBAR
          ==================================================== */}

          <div className="relative flex shrink-0 flex-col gap-3 border-b border-zinc-800/80 bg-gradient-to-r from-zinc-900/40 via-zinc-950/30 to-cyan-950/10 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-500/60" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search ingredients..."
                className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 pl-9 pr-3 text-xs text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-cyan-500/40 focus:bg-cyan-500/[0.02] focus:shadow-[0_0_22px_rgba(34,211,238,0.05)]"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={
                  ingredientsRefreshing ||
                  ingredientsLoading
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 text-xs font-bold text-zinc-400 transition hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    ingredientsRefreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />

                Refresh
              </button>

              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-400/20 bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 px-4 text-xs font-bold text-emerald-300 shadow-[0_0_24px_rgba(52,211,153,0.06)] transition hover:border-emerald-400/40 hover:from-emerald-500/20 hover:to-cyan-500/15 hover:text-emerald-200"
              >
                <PackagePlus className="h-4 w-4" />
                Add Ingredient
              </button>
            </div>
          </div>

          {/* ====================================================
              ERROR
          ==================================================== */}

          {visibleError && (
            <div className="shrink-0 border-b border-red-500/10 bg-red-500/5 px-5 py-2.5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-red-400">
                  {visibleError}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setLocalError(null);
                    clearIngredientsError();
                  }}
                  className="text-[10px] font-bold uppercase tracking-wider text-red-500 transition hover:text-red-300"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* ====================================================
              BODY
          ==================================================== */}

          <div className="min-h-0 flex-1 overflow-hidden">
            {ingredientsLoading &&
            ingredients.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10">
                    <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                  </div>

                  <p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
                    Loading ingredients...
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_360px]">
                {/* ==================================================
                    INGREDIENT LIST
                ================================================== */}

                <div className="min-h-0 overflow-y-auto border-b border-zinc-800 lg:border-b-0 lg:border-r">
                  {/* Table Header */}
                  <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_90px_105px_75px] gap-3 border-b border-zinc-800/80 bg-[#090b0f]/95 px-5 py-3 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-600 backdrop-blur">
                    <span>Ingredient</span>
                    <span>UOM</span>
                    <span>Status</span>
                    <span className="text-right">
                      Actions
                    </span>
                  </div>

                  {/* Empty */}
                  {filteredIngredients.length === 0 ? (
                    <div className="flex min-h-[300px] items-center justify-center p-8">
                      <div className="text-center">
                        <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-cyan-500/10">
                          <Wheat className="h-5 w-5 text-violet-400" />
                        </div>

                        <p className="mt-4 text-sm font-semibold text-zinc-400">
                          {searchTerm
                            ? "No matching ingredients"
                            : "No ingredients found"}
                        </p>

                        <p className="mt-1 text-xs text-zinc-600">
                          {searchTerm
                            ? "Try a different search term."
                            : "Add your first ingredient to the registry."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {filteredIngredients.map(
                        (ingredient) => {
                          const isActionLoading =
                            actionIngredientId ===
                            ingredient.id;

                          return (
                            <div
                              key={ingredient.id}
                              className="group grid grid-cols-[minmax(0,1fr)_90px_105px_75px] items-center gap-3 border-b border-zinc-900/80 px-5 py-3 transition-all duration-200 hover:border-cyan-500/10 hover:bg-gradient-to-r hover:from-cyan-500/[0.025] hover:via-emerald-500/[0.02] hover:to-transparent"
                            >
                              {/* Name */}
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-zinc-200 transition group-hover:text-white">
                                  {ingredient.name}
                                </p>

                                <p className="mt-0.5 truncate font-mono text-[9px] text-zinc-700">
                                  {ingredient.id}
                                </p>
                              </div>

                              {/* UOM */}
                              <div>
                                <span className="inline-flex rounded-lg border border-violet-500/20 bg-violet-500/[0.08] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-violet-300 shadow-[0_0_14px_rgba(139,92,246,0.04)]">
                                  {ingredient.uom}
                                </span>
                              </div>

                              {/* Status */}
                              <div>
                                <span
                                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                                    ingredient.isActive
                                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                      : "border-red-500/20 bg-red-500/10 text-red-400"
                                  }`}
                                >
                                  <span
                                    className={`relative h-1.5 w-1.5 rounded-full ${
                                      ingredient.isActive
                                        ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
                                        : "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.7)]"
                                    }`}
                                  >
                                    <span
                                      className={`absolute inset-0 animate-ping rounded-full opacity-75 ${
                                        ingredient.isActive
                                          ? "bg-emerald-400"
                                          : "bg-red-400"
                                      }`}
                                    />
                                  </span>

                                  {ingredient.isActive
                                    ? "Active"
                                    : "Inactive"}
                                </span>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditForm(
                                      ingredient.id,
                                    )
                                  }
                                  title="Edit ingredient"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-zinc-600 transition hover:border-cyan-500/20 hover:bg-cyan-500/10 hover:text-cyan-300"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleToggleStatus(
                                      ingredient.id,
                                      ingredient.isActive,
                                    )
                                  }
                                  disabled={isActionLoading}
                                  title={
                                    ingredient.isActive
                                      ? "Deactivate ingredient"
                                      : "Activate ingredient"
                                  }
                                  className={`flex h-8 w-8 items-center justify-center rounded-lg border border-transparent transition ${
                                    ingredient.isActive
                                      ? "text-zinc-600 hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-300"
                                      : "text-zinc-600 hover:border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-300"
                                  } disabled:cursor-not-allowed disabled:opacity-50`}
                                >
                                  {isActionLoading ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Power className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  )}
                </div>

                {/* ==================================================
                    FORM PANEL
                ================================================== */}

                <div className="relative min-h-0 overflow-y-auto border-l border-zinc-800/60 bg-gradient-to-b from-violet-950/[0.08] via-zinc-950/20 to-cyan-950/[0.05]">
                  <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-violet-500/[0.05] blur-3xl" />

                  <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 rounded-full bg-cyan-500/[0.04] blur-3xl" />

                  {isFormOpen ? (
                    <div className="relative h-full p-5">
                      {/* Form header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-400">
                            {isEditing
                              ? "EDIT INGREDIENT"
                              : "NEW INGREDIENT"}
                          </p>

                          <h3 className="mt-1 text-base font-bold text-white">
                            {isEditing
                              ? "Update ingredient"
                              : "Register ingredient"}
                          </h3>

                          <p className="mt-1 text-xs leading-5 text-zinc-600">
                            Maintain the central ingredient
                            master used by recipes.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={resetForm}
                          disabled={isSubmitting}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-600 transition hover:bg-zinc-800 hover:text-white disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Form */}
                      <form
                        onSubmit={handleSubmit}
                        className="mt-7 space-y-5"
                      >
                        {/* Name */}
                        <div>
                          <label
                            htmlFor="ingredient-name"
                            className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-500"
                          >
                            Ingredient Name
                          </label>

                          <input
                            id="ingredient-name"
                            type="text"
                            value={form.name}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                name: event.target.value,
                              }))
                            }
                            placeholder="e.g. Basmati Rice"
                            disabled={isSubmitting}
                            autoFocus
                            className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 text-xs text-zinc-200 outline-none transition placeholder:text-zinc-700 focus:border-cyan-500/40 focus:bg-cyan-500/[0.02] focus:shadow-[0_0_22px_rgba(34,211,238,0.05)] disabled:opacity-60"
                          />
                        </div>

                        {/* UOM */}
                        <div>
                          <label
                            htmlFor="ingredient-uom"
                            className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-500"
                          >
                            Unit of Measure
                          </label>

                          <input
                            id="ingredient-uom"
                            type="text"
                            value={form.uom}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                uom: event.target.value.toUpperCase(),
                              }))
                            }
                            placeholder="e.g. KG, G, L, ML, PCS"
                            disabled={isSubmitting}
                            className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 font-mono text-xs uppercase text-zinc-200 outline-none transition placeholder:text-zinc-700 focus:border-cyan-500/40 focus:bg-cyan-500/[0.02] focus:shadow-[0_0_22px_rgba(34,211,238,0.05)] disabled:opacity-60"
                          />

                          <p className="mt-2 text-[10px] text-zinc-700">
                            Use the same unit consistently
                            when defining recipes.
                          </p>
                        </div>

                        {/* Status */}
                        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-4 shadow-[0_10px_35px_rgba(0,0,0,0.18)]">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    form.isActive
                                      ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                                      : "bg-red-400"
                                  }`}
                                />

                                <p className="text-xs font-semibold text-zinc-300">
                                  Active in catalog
                                </p>
                              </div>

                              <p className="mt-1 text-[10px] text-zinc-600">
                                Inactive ingredients cannot be
                                used for new recipe entries.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setForm((current) => ({
                                  ...current,
                                  isActive:
                                    !current.isActive,
                                }))
                              }
                              disabled={isSubmitting}
                              aria-label="Toggle ingredient status"
                              className={`relative h-6 w-11 rounded-full border transition-all duration-200 ${
                                form.isActive
                                  ? "border-emerald-400/40 bg-gradient-to-r from-emerald-500/25 to-cyan-500/20 shadow-[0_0_16px_rgba(52,211,153,0.08)]"
                                  : "border-zinc-700 bg-zinc-900"
                              }`}
                            >
                              <span
                                className={`absolute top-1 h-4 w-4 rounded-full shadow-sm transition-all duration-200 ${
                                  form.isActive
                                    ? "left-6 bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.7)]"
                                    : "left-1 bg-zinc-600"
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Error */}
                        {localError && (
                          <div className="rounded-xl border border-red-500/15 bg-red-500/5 px-3 py-2.5">
                            <p className="text-xs text-red-400">
                              {localError}
                            </p>
                          </div>
                        )}

                        {/* Buttons */}
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={resetForm}
                            disabled={isSubmitting}
                            className="h-10 flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-xs font-bold text-zinc-500 transition hover:bg-zinc-900 hover:text-white disabled:opacity-50"
                          >
                            Cancel
                          </button>

                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-gradient-to-r from-emerald-500/90 to-cyan-500/80 px-4 text-xs font-bold text-zinc-950 shadow-[0_8px_24px_rgba(52,211,153,0.12)] transition hover:from-emerald-400 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Check className="h-3.5 w-3.5" />

                                {isEditing
                                  ? "Save Changes"
                                  : "Create"}
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="relative flex h-full items-center justify-center p-8">
                      <div className="max-w-[250px] text-center">
                        <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-cyan-500/5 to-emerald-500/10 shadow-[0_0_30px_rgba(139,92,246,0.06)]">
                          <Wheat className="h-5 w-5 text-violet-300" />
                        </div>

                        <p className="mt-5 text-sm font-semibold text-zinc-300">
                          Ingredient controls
                        </p>

                        <p className="mt-2 text-xs leading-5 text-zinc-600">
                          Select an ingredient to edit it, or
                          create a new ingredient from the
                          registry.
                        </p>

                        <button
                          type="button"
                          onClick={openCreateForm}
                          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 px-4 py-2.5 text-xs font-bold text-emerald-300 transition hover:border-emerald-400/35 hover:from-emerald-500/15 hover:to-cyan-500/15 hover:text-emerald-200"
                        >
                          <PackagePlus className="h-3.5 w-3.5" />

                          Add Ingredient
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ====================================================
              FOOTER / PAGINATION
          ==================================================== */}

          <div className="flex shrink-0 items-center justify-between gap-4 border-t border-zinc-800/80 bg-gradient-to-r from-zinc-950 via-zinc-950 to-cyan-950/[0.08] px-5 py-3">
            <p className="text-[10px] text-zinc-600">
              Showing{" "}
              <span className="font-mono text-zinc-400">
                {firstVisibleRow}-{lastVisibleRow}
              </span>{" "}
              of{" "}
              <span className="font-mono text-zinc-400">
                {ingredientsTotal}
              </span>
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  void handlePageChange(
                    ingredientsPage - 1,
                  )
                }
                disabled={
                  ingredientsPage <= 1 ||
                  ingredientsLoading ||
                  ingredientsRefreshing
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-500 transition hover:border-cyan-500/20 hover:bg-cyan-500/5 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              <div className="rounded-lg border border-cyan-500/15 bg-cyan-500/[0.05] px-3 py-1.5 font-mono text-[10px] text-zinc-500">
                <span className="text-cyan-300">
                  {ingredientsPage}
                </span>

                <span className="mx-1 text-zinc-700">
                  /
                </span>

                <span>
                  {Math.max(
                    ingredientsTotalPages,
                    1,
                  )}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  void handlePageChange(
                    ingredientsPage + 1,
                  )
                }
                disabled={
                  ingredientsPage >=
                    ingredientsTotalPages ||
                  ingredientsLoading ||
                  ingredientsRefreshing
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-500 transition hover:border-cyan-500/20 hover:bg-cyan-500/5 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}