"use client";

import { useState } from "react";
import {
  Plus,
  SlidersHorizontal,
  Tags,
  Wheat,
} from "lucide-react";

import CategoryManagerModal from "./CategoryManagerModal";
import IngredientManagerModal from "./IngredientManagerModal";
import ModifierManagerModal from "./ModifierManagerModal";

interface MenuControlsProps {
  onOpenDrawer: () => void;
  onCategoriesChanged?: () => void;
  onIngredientsChanged?: () => void;
  onModifiersChanged?: () => void;
}

export default function MenuControls({
  onOpenDrawer,
  onCategoriesChanged,
  onIngredientsChanged,
  onModifiersChanged,
}: MenuControlsProps) {
  const [isCategoryModalOpen, setIsCategoryModalOpen] =
    useState(false);

  const [isIngredientModalOpen, setIsIngredientModalOpen] =
    useState(false);

  const [isModifierModalOpen, setIsModifierModalOpen] =
    useState(false);

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        {/* Categories */}
        <button
          type="button"
          onClick={() => setIsCategoryModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-200 transition hover:border-cyan-500/40 hover:bg-zinc-800 hover:text-cyan-400"
        >
          <Tags className="h-4 w-4" />
          Categories
        </button>

        {/* Ingredients */}
        <button
          type="button"
          onClick={() => setIsIngredientModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-200 transition hover:border-violet-500/40 hover:bg-zinc-800 hover:text-violet-400"
        >
          <Wheat className="h-4 w-4" />
          Ingredients
        </button>

        {/* Modifiers */}
        <button
          type="button"
          onClick={() => setIsModifierModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-200 transition hover:border-emerald-500/40 hover:bg-zinc-800 hover:text-emerald-400"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Modifiers
        </button>

        {/* New Menu Item */}
        <button
          type="button"
          onClick={onOpenDrawer}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-black transition hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4" />
          New Menu Item
        </button>
      </div>

      {/* Category Manager */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoriesChanged={onCategoriesChanged}
      />

      {/* Ingredient Manager */}
      <IngredientManagerModal
        isOpen={isIngredientModalOpen}
        onClose={() => setIsIngredientModalOpen(false)}
        onIngredientsChanged={onIngredientsChanged}
      />

      {/* Modifier Manager */}
      <ModifierManagerModal
        isOpen={isModifierModalOpen}
        onClose={() => setIsModifierModalOpen(false)}
        onModifiersChanged={onModifiersChanged}
      />
    </>
  );
}