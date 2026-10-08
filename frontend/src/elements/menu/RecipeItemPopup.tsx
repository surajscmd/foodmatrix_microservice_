"use client";

import { useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChefHat,
  Loader2,
  Search,
  X,
} from "lucide-react";

import type { Ingredient } from "@/lib/catalog-api";

interface RecipeItemPopupProps {
  isOpen: boolean;
  mode: "create" | "edit";
  ingredients: Ingredient[];
  selectedIngredientId: string | null;
  quantity: string;
  searchTerm: string;
  isSubmitting?: boolean;
  isLoadingIngredients?: boolean;
  onIngredientChange: (ingredientId: string) => void;
  onQuantityChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export default function RecipeItemPopup({
  isOpen,
  mode,
  ingredients,
  selectedIngredientId,
  quantity,
  searchTerm,
  isSubmitting = false,
  isLoadingIngredients = false,
  onIngredientChange,
  onQuantityChange,
  onSearchChange,
  onSubmit,
  onClose,
}: RecipeItemPopupProps) {
  const filteredIngredients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return ingredients;
    }

    return ingredients.filter((ingredient) =>
      ingredient.name.toLowerCase().includes(query),
    );
  }, [ingredients, searchTerm]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  const selectedIngredient = ingredients.find(
    (ingredient) => ingredient.id === selectedIngredientId,
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-item-popup-title"
    >
      <button
        type="button"
        aria-label="Close recipe popup"
        onClick={onClose}
        disabled={isSubmitting}
        className="absolute inset-0 cursor-default bg-black/65 backdrop-blur-md"
      />

      <div
        onMouseDown={(event) => event.stopPropagation()}
        className="
          relative
          w-full
          max-w-lg
          overflow-hidden
          rounded-3xl
          border
          border-zinc-800/90
          bg-gradient-to-br
          from-[#0d1117]
          via-[#090b0f]
          to-[#07090c]
          shadow-[0_30px_90px_rgba(0,0,0,0.65)]
        "
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-emerald-500/[0.07] blur-3xl" />

        <div className="pointer-events-none absolute -left-20 bottom-0 h-52 w-52 rounded-full bg-cyan-500/[0.045] blur-3xl" />

        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/80 to-cyan-400/60" />

        <div className="relative flex items-center justify-between border-b border-zinc-800/80 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/15 via-cyan-400/10 to-violet-400/10">
              <ChefHat className="h-4 w-4 text-emerald-300" />
            </div>

            <div className="min-w-0">
              <p
                id="recipe-item-popup-title"
                className="text-sm font-semibold text-zinc-100"
              >
                {mode === "create"
                  ? "Add Recipe Ingredient"
                  : "Edit Recipe Ingredient"}
              </p>

              <p className="mt-0.5 text-xs text-zinc-600">
                {mode === "create"
                  ? "Add an ingredient and define its quantity."
                  : "Update the ingredient or quantity."}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-500 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative space-y-5 p-5">
          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              Ingredient
            </label>

            <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3">
              <Search className="h-4 w-4 shrink-0 text-zinc-600" />

              <input
                value={searchTerm}
                onChange={(event) =>
                  onSearchChange(event.target.value)
                }
                placeholder="Search ingredients..."
                disabled={isSubmitting}
                className="h-10 w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600 disabled:opacity-50"
              />
            </div>

            <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-zinc-800">
              {isLoadingIngredients ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                </div>
              ) : filteredIngredients.length > 0 ? (
                filteredIngredients.map((ingredient) => {
                  const selected =
                    selectedIngredientId === ingredient.id;

                  return (
                    <button
                      key={ingredient.id}
                      type="button"
                      onClick={() =>
                        onIngredientChange(ingredient.id)
                      }
                      disabled={isSubmitting}
                      className={`flex w-full items-center justify-between gap-3 border-b border-zinc-800/70 px-4 py-3 text-left transition last:border-b-0 disabled:opacity-50 ${
                        selected
                          ? "bg-emerald-500/[0.07]"
                          : "hover:bg-zinc-900/70"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-200">
                          {ingredient.name}
                        </p>

                        <p className="mt-0.5 text-[10px] uppercase text-zinc-600">
                          {ingredient.uom}
                        </p>
                      </div>

                      {selected && (
                        <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-xs text-zinc-600">
                    No ingredients found.
                  </p>
                </div>
              )}
            </div>

            {selectedIngredient && (
              <p className="mt-2 text-[10px] text-zinc-600">
                Selected:{" "}
                <span className="text-zinc-400">
                  {selectedIngredient.name}
                </span>
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              Quantity
            </label>

            <div className="flex overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60">
              <input
                type="number"
                min="0"
                step="0.001"
                value={quantity}
                onChange={(event) =>
                  onQuantityChange(event.target.value)
                }
                placeholder="0.000"
                disabled={isSubmitting}
                className="h-11 min-w-0 flex-1 bg-transparent px-4 text-sm font-medium text-zinc-200 outline-none placeholder:text-zinc-700 disabled:opacity-50"
              />

              <div className="flex min-w-[70px] items-center justify-center border-l border-zinc-800 bg-zinc-950/40 px-3 text-xs font-medium uppercase text-zinc-500">
                {selectedIngredient?.uom ?? "UOM"}
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-end gap-2 border-t border-zinc-800/80 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={
              !selectedIngredientId ||
              !quantity ||
              Number(quantity) <= 0 ||
              isSubmitting
            }
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}

            {mode === "create"
              ? "Add Ingredient"
              : "Save Changes"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}