"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChefHat,
  Layers3,
  Loader2,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  Wheat,
  X,
} from "lucide-react";

import {
  createModifier,
  createModifierGroup,
  createRecipeItem,
  deleteRecipeItem,
  getIngredients,
  getModifierGroups,
  getModifierRecipes,
  getModifiers,
  updateModifier,
  updateModifierGroup,
  updateRecipeItem,
  type Ingredient,
  type Modifier,
  type ModifierGroup,
  type RecipeItem,
} from "@/lib/catalog-api";

// ============================================================
// PROPS
// ============================================================

interface ModifierManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModifiersChanged?: () => void;
}

// ============================================================
// FORM TYPES
// ============================================================

interface GroupFormState {
  name: string;
  sortOrder: number;
  minSelections: number;
  maxSelections: number;
  isActive: boolean;
}

interface ModifierFormState {
  groupId: string;
  name: string;
  sortOrder: number;
  extraPrice: number;
  isActive: boolean;
}

interface DraftRecipeItem {
  localId: string;
  id?: string;
  ingredientId: string;
  quantityNeeded: number;
  ingredient: {
    id: string;
    name: string;
    uom: string;
    isActive: boolean;
  };
}

interface RecipeViewItem {
  id: string;
  modifierId: string;
  ingredientId: string;
  quantityNeeded: number;
  ingredient: {
    id: string;
    name: string;
    uom: string;
    isActive: boolean;
  };
}

// ============================================================
// EMPTY FORMS
// ============================================================

const EMPTY_GROUP_FORM: GroupFormState = {
  name: "",
  sortOrder: 0,
  minSelections: 0,
  maxSelections: 1,
  isActive: true,
};

const EMPTY_MODIFIER_FORM: ModifierFormState = {
  groupId: "",
  name: "",
  sortOrder: 0,
  extraPrice: 0,
  isActive: true,
};

// ============================================================
// HELPERS
// ============================================================

function toFiniteNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function createLocalId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// ============================================================
// MODIFIER NORMALIZER
// ============================================================

function normalizeModifier(value: unknown): Modifier | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = typeof value.id === "string" ? value.id : "";
  const groupId = typeof value.groupId === "string" ? value.groupId : "";
  const name = typeof value.name === "string" ? value.name : "";

  if (!id || !groupId || !name) {
    return null;
  }

  return {
    id,
    groupId,
    name,
    sortOrder: toFiniteNumber(value.sortOrder),
    extraPrice: toFiniteNumber(value.extraPrice),
    isActive: Boolean(value.isActive),
    createdAt:
      typeof value.createdAt === "string" ? value.createdAt : undefined,
    updatedAt:
      typeof value.updatedAt === "string" ? value.updatedAt : undefined,
  };
}

// ============================================================
// MODIFIER RESPONSE NORMALIZER
//
// Backend can return:
//
// {
//   message: "...",
//   result: [
//     {
//       group: {...},
//       modifiers: [...]
//     }
//   ]
// }
// ============================================================

function extractModifiersForGroup(
  response: unknown,
  groupId: string,
): Modifier[] {
  if (!isRecord(response)) {
    return [];
  }

  const rawResult = response.result;

  if (!Array.isArray(rawResult)) {
    return [];
  }

  const flat = rawResult
    .map((item) => normalizeModifier(item))
    .filter((item): item is Modifier => item !== null);

  if (flat.length === rawResult.length && flat.length > 0) {
    return flat.filter((modifier) => modifier.groupId === groupId);
  }

  const result: Modifier[] = [];

  for (const groupBlock of rawResult) {
    if (!isRecord(groupBlock)) {
      continue;
    }

    if (!Array.isArray(groupBlock.modifiers)) {
      continue;
    }

    for (const rawModifier of groupBlock.modifiers) {
      const modifier = normalizeModifier(rawModifier);

      if (modifier && modifier.groupId === groupId) {
        result.push(modifier);
      }
    }
  }

  return result;
}

// ============================================================
// RECIPE RESPONSE NORMALIZER
//
// Actual backend response:
//
// {
//   message: "...",
//   modifier: {...},
//   data: [
//     {
//       recipeItemId,
//       ingredientId,
//       name,
//       uom,
//       isActive,
//       quantityNeeded
//     }
//   ]
// }
// ============================================================

function mapModifierRecipeRows(
  response: unknown,
  modifierId: string,
): RecipeViewItem[] {
  if (!isRecord(response)) {
    return [];
  }

  const rawData = response.data;

  if (!Array.isArray(rawData)) {
    return [];
  }

  return rawData
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .filter(
      (item) =>
        typeof item.recipeItemId === "string" &&
        typeof item.ingredientId === "string" &&
        typeof item.name === "string",
    )
    .map((item) => ({
      id: item.recipeItemId as string,
      modifierId,
      ingredientId: item.ingredientId as string,
      quantityNeeded: toFiniteNumber(item.quantityNeeded),
      ingredient: {
        id: item.ingredientId as string,
        name: item.name as string,
        uom: typeof item.uom === "string" ? item.uom : "",
        isActive: Boolean(item.isActive),
      },
    }));
}

// ============================================================
// COMPONENT
// ============================================================

export default function ModifierManagerModal({
  isOpen,
  onClose,
  onModifiersChanged,
}: ModifierManagerModalProps) {
  // ==========================================================
  // GROUP STATE
  // ==========================================================

  const [groups, setGroups] = useState<ModifierGroup[]>([]);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId],
  );

  // ==========================================================
  // GROUP EDITOR
  // ==========================================================

  const [isGroupEditorOpen, setIsGroupEditorOpen] = useState(false);

  const [groupEditorMode, setGroupEditorMode] = useState<"create" | "edit">(
    "create",
  );

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  const [groupForm, setGroupForm] = useState<GroupFormState>(EMPTY_GROUP_FORM);

  const [isSavingGroup, setIsSavingGroup] = useState(false);

  // ==========================================================
  // MODIFIERS
  // ==========================================================

  const [modifiers, setModifiers] = useState<Modifier[]>([]);

  const [modifierSearch, setModifierSearch] = useState("");

  const [isLoadingModifiers, setIsLoadingModifiers] = useState(false);

  // ==========================================================
  // MODIFIER EDITOR
  // ==========================================================

  const [isModifierEditorOpen, setIsModifierEditorOpen] = useState(false);

  const [modifierEditorMode, setModifierEditorMode] = useState<
    "create" | "edit"
  >("create");

  const [editingModifierId, setEditingModifierId] = useState<string | null>(
    null,
  );

  const [modifierForm, setModifierForm] =
    useState<ModifierFormState>(EMPTY_MODIFIER_FORM);

  const [isSavingModifier, setIsSavingModifier] = useState(false);

  // ==========================================================
  // RECIPE EDITOR
  // ==========================================================

  const [recipeItems, setRecipeItems] = useState<DraftRecipeItem[]>([]);

  const [originalRecipeItems, setOriginalRecipeItems] = useState<RecipeItem[]>(
    [],
  );

  const [isLoadingRecipe, setIsLoadingRecipe] = useState(false);

  // ==========================================================
  // INGREDIENT SEARCH
  // ==========================================================

  const [ingredientSearch, setIngredientSearch] = useState("");

  const [ingredientResults, setIngredientResults] = useState<Ingredient[]>([]);

  const [isSearchingIngredients, setIsSearchingIngredients] = useState(false);

  // ==========================================================
  // RECIPE VIEW
  // ==========================================================

  const [recipeDrawerModifier, setRecipeDrawerModifier] =
    useState<Modifier | null>(null);

  const [isRecipeDrawerOpen, setIsRecipeDrawerOpen] = useState(false);

  const [recipeViewItems, setRecipeViewItems] = useState<RecipeViewItem[]>([]);

  const [isLoadingRecipeView, setIsLoadingRecipeView] = useState(false);

  // ==========================================================
  // DERIVED
  // ==========================================================

  const filteredModifiers = useMemo(() => {
    const query = modifierSearch.trim().toLowerCase();

    if (!query) {
      return modifiers;
    }

    return modifiers.filter((modifier) =>
      modifier.name.toLowerCase().includes(query),
    );
  }, [modifiers, modifierSearch]);

  const activeModifierCount = useMemo(
    () => modifiers.filter((modifier) => modifier.isActive).length,
    [modifiers],
  );

  // const activeGroupCount = useMemo(
  //   () => groups.filter((group) => group.isActive).length,
  //   [groups],
  // );

  // const selectedGroupIndex = selectedGroup
  //   ? groups.findIndex((group) => group.id === selectedGroup.id) + 1
  //   : 0;

  // ==========================================================
  // LOAD GROUPS
  // ==========================================================

  const loadGroups = useCallback(async (preferredGroupId?: string) => {
    try {
      const response = await getModifierGroups();

      const nextGroups = Array.isArray(response) ? response : [];

      setGroups(nextGroups);

      setSelectedGroupId((current) => {
        if (
          preferredGroupId &&
          nextGroups.some((group) => group.id === preferredGroupId)
        ) {
          return preferredGroupId;
        }

        if (current && nextGroups.some((group) => group.id === current)) {
          return current;
        }

        return nextGroups[0]?.id ?? null;
      });
    } catch (error) {
      console.error("Failed to load modifier groups:", error);

      setGroups([]);
      setSelectedGroupId(null);
    }
  }, []);

  // ==========================================================
  // LOAD MODIFIERS
  // ==========================================================

  const loadModifiers = useCallback(async (groupId: string) => {
    if (!groupId) {
      setModifiers([]);
      return;
    }

    setIsLoadingModifiers(true);

    try {
      const response = await getModifiers(groupId);

      setModifiers(extractModifiersForGroup(response, groupId));
    } catch (error) {
      console.error("Failed to load modifiers:", error);

      setModifiers([]);
    } finally {
      setIsLoadingModifiers(false);
    }
  }, []);

  // ==========================================================
  // OPEN
  // ==========================================================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadGroups();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isOpen, loadGroups]);

  // ==========================================================
  // GROUP CHANGE
  // ==========================================================

  useEffect(() => {
    if (!isOpen || !selectedGroupId) {
      return;
    }

    const groupId = selectedGroupId;

    const timer = window.setTimeout(() => {
      void loadModifiers(groupId);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isOpen, selectedGroupId, loadModifiers]);

  // ==========================================================
  // CREATE GROUP
  // ==========================================================

  const openCreateGroup = () => {
    setGroupEditorMode("create");
    setEditingGroupId(null);

    setGroupForm({
      ...EMPTY_GROUP_FORM,
    });

    setIsGroupEditorOpen(true);
  };

  // ==========================================================
  // EDIT GROUP
  // ==========================================================

  const openEditGroup = (group: ModifierGroup) => {
    setGroupEditorMode("edit");
    setEditingGroupId(group.id);

    setGroupForm({
      name: group.name,
      sortOrder: toFiniteNumber(group.sortOrder),
      minSelections: toFiniteNumber(group.minSelections),
      maxSelections: toFiniteNumber(group.maxSelections),
      isActive: Boolean(group.isActive),
    });

    setIsGroupEditorOpen(true);
  };

  // ==========================================================
  // SAVE GROUP
  // ==========================================================

  const saveGroup = async () => {
    const name = groupForm.name.trim();

    if (!name) {
      return;
    }

    if (groupForm.minSelections > groupForm.maxSelections) {
      return;
    }

    setIsSavingGroup(true);

    try {
      if (groupEditorMode === "create") {
        const created = await createModifierGroup({
          name,
          sortOrder: groupForm.sortOrder,
          minSelections: groupForm.minSelections,
          maxSelections: groupForm.maxSelections,
          isActive: groupForm.isActive,
        });

        setIsGroupEditorOpen(false);

        await loadGroups(created.id);

        onModifiersChanged?.();

        return;
      }

      if (!editingGroupId) {
        return;
      }

      await updateModifierGroup(editingGroupId, {
        name,
        sortOrder: groupForm.sortOrder,
        minSelections: groupForm.minSelections,
        maxSelections: groupForm.maxSelections,
        isActive: groupForm.isActive,
      });

      setIsGroupEditorOpen(false);

      await loadGroups(editingGroupId);

      await loadModifiers(editingGroupId);

      onModifiersChanged?.();
    } catch (error) {
      console.error("Failed to save modifier group:", error);
    } finally {
      setIsSavingGroup(false);
    }
  };

  // ==========================================================
  // TOGGLE GROUP
  // ==========================================================

  const toggleGroupStatus = async (group: ModifierGroup) => {
    try {
      await updateModifierGroup(group.id, {
        isActive: !group.isActive,
      });

      await loadGroups(group.id);

      if (selectedGroupId === group.id) {
        await loadModifiers(group.id);
      }

      onModifiersChanged?.();
    } catch (error) {
      console.error("Failed to update group:", error);
    }
  };

  // ==========================================================
  // RESET RECIPE
  // ==========================================================

  const resetRecipeEditor = () => {
    setRecipeItems([]);
    setOriginalRecipeItems([]);
    setIngredientSearch("");
    setIngredientResults([]);
    setIsLoadingRecipe(false);
  };

  // ==========================================================
  // CREATE MODIFIER
  // ==========================================================

  const openCreateModifier = () => {
    if (!selectedGroup || !selectedGroup.isActive) {
      return;
    }

    setModifierEditorMode("create");
    setEditingModifierId(null);

    setModifierForm({
      ...EMPTY_MODIFIER_FORM,
      groupId: selectedGroup.id,
    });

    resetRecipeEditor();

    setIsModifierEditorOpen(true);
  };

  // ==========================================================
  // LOAD RECIPE
  // ==========================================================

  const loadModifierRecipe = async (modifierId: string) => {
    setIsLoadingRecipe(true);

    try {
      const response = await getModifierRecipes(modifierId);

      const rows = mapModifierRecipeRows(response, modifierId);

      const drafts: DraftRecipeItem[] = rows.map((row) => ({
        localId: row.id,
        id: row.id,
        ingredientId: row.ingredientId,
        quantityNeeded: row.quantityNeeded,
        ingredient: row.ingredient,
      }));

      const originals: RecipeItem[] = rows.map((row) => ({
        id: row.id,
        menuItemId: null,
        modifierId: row.modifierId,
        ingredientId: row.ingredientId,
        quantityNeeded: row.quantityNeeded,
        ingredient: row.ingredient,
      }));

      setRecipeItems(drafts);
      setOriginalRecipeItems(originals);
    } catch (error) {
      console.error("Failed to load modifier recipe:", error);

      setRecipeItems([]);
      setOriginalRecipeItems([]);
    } finally {
      setIsLoadingRecipe(false);
    }
  };

  // ==========================================================
  // EDIT MODIFIER
  // ==========================================================

  const openEditModifier = async (modifier: Modifier) => {
    setModifierEditorMode("edit");
    setEditingModifierId(modifier.id);

    setModifierForm({
      groupId: modifier.groupId,
      name: modifier.name,
      sortOrder: toFiniteNumber(modifier.sortOrder),
      extraPrice: toFiniteNumber(modifier.extraPrice),
      isActive: Boolean(modifier.isActive),
    });

    resetRecipeEditor();

    setIsModifierEditorOpen(true);

    await loadModifierRecipe(modifier.id);
  };

  // ==========================================================
  // RECIPE DRAWER
  // ==========================================================

  const openRecipeDrawer = async (modifier: Modifier) => {
    setRecipeDrawerModifier(modifier);

    setRecipeViewItems([]);

    setIsRecipeDrawerOpen(true);

    setIsLoadingRecipeView(true);

    try {
      const response = await getModifierRecipes(modifier.id);

      setRecipeViewItems(mapModifierRecipeRows(response, modifier.id));
    } catch (error) {
      console.error("Failed to load recipe:", error);

      setRecipeViewItems([]);
    } finally {
      setIsLoadingRecipeView(false);
    }
  };

  const closeRecipeDrawer = () => {
    setIsRecipeDrawerOpen(false);
    setRecipeDrawerModifier(null);
    setRecipeViewItems([]);
  };

  // ==========================================================
  // INGREDIENT SEARCH
  // ==========================================================

  useEffect(() => {
    if (!isModifierEditorOpen) {
      return;
    }

    const query = ingredientSearch.trim().toLowerCase();

    if (query.length < 2) {
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(() => {
      const run = async () => {
        setIsSearchingIngredients(true);

        try {
          const response = await getIngredients(1, 100);

          if (cancelled) {
            return;
          }

          const ingredients = Array.isArray(response?.data)
            ? response.data
            : [];

          const filtered = ingredients.filter(
            (ingredient) =>
              ingredient.isActive &&
              ingredient.name.toLowerCase().includes(query),
          );

          setIngredientResults(filtered);
        } catch (error) {
          if (cancelled) {
            return;
          }

          console.error("Failed to search ingredients:", error);

          setIngredientResults([]);
        } finally {
          if (!cancelled) {
            setIsSearchingIngredients(false);
          }
        }
      };

      void run();
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [ingredientSearch, isModifierEditorOpen]);

  // ==========================================================
  // INGREDIENT SEARCH INPUT
  // ==========================================================

  const handleIngredientSearchChange = (value: string) => {
    setIngredientSearch(value);

    if (value.trim().length < 2) {
      setIngredientResults([]);
      setIsSearchingIngredients(false);
    }
  };

  // ==========================================================
  // ADD INGREDIENT
  // ==========================================================

  const addIngredientToRecipe = (ingredient: Ingredient) => {
    if (!ingredient.isActive) {
      return;
    }

    const exists = recipeItems.some(
      (item) => item.ingredientId === ingredient.id,
    );

    if (exists) {
      return;
    }

    setRecipeItems((current) => [
      ...current,
      {
        localId: createLocalId(),
        ingredientId: ingredient.id,
        quantityNeeded: 1,
        ingredient: {
          id: ingredient.id,
          name: ingredient.name,
          uom: ingredient.uom,
          isActive: Boolean(ingredient.isActive),
        },
      },
    ]);

    setIngredientSearch("");
    setIngredientResults([]);
  };

  // ==========================================================
  // QUANTITY
  // ==========================================================

  const updateRecipeQuantity = (localId: string, quantity: number) => {
    const safe = Number.isFinite(quantity) ? Math.max(quantity, 0) : 0;

    setRecipeItems((current) =>
      current.map((item) =>
        item.localId === localId
          ? {
              ...item,
              quantityNeeded: safe,
            }
          : item,
      ),
    );
  };

  // ==========================================================
  // REMOVE RECIPE ITEM
  // ==========================================================

  const removeRecipeItem = (localId: string) => {
    setRecipeItems((current) =>
      current.filter((item) => item.localId !== localId),
    );
  };

  // ==========================================================
  // TOGGLE MODIFIER
  // ==========================================================

  const toggleModifierStatus = async (modifier: Modifier) => {
    try {
      await updateModifier(modifier.id, {
        isActive: !modifier.isActive,
      });

      if (selectedGroupId) {
        await loadModifiers(selectedGroupId);
      }

      onModifiersChanged?.();
    } catch (error) {
      console.error("Failed to update modifier:", error);
    }
  };

  // ==========================================================
  // SAVE RECIPE
  // ==========================================================

  const saveRecipeChanges = async (modifierId: string) => {
    const originalById = new Map(
      originalRecipeItems.map((item) => [
        item.id,
        toFiniteNumber(item.quantityNeeded),
      ]),
    );

    const currentIds = new Set(
      recipeItems
        .filter((item) => Boolean(item.id))
        .map((item) => item.id as string),
    );

    const removed = originalRecipeItems.filter(
      (item) => !currentIds.has(item.id),
    );

    for (const item of removed) {
      await deleteRecipeItem(item.id);
    }

    for (const item of recipeItems) {
      if (!item.id) {
        continue;
      }

      const previous = originalById.get(item.id);

      const current = toFiniteNumber(item.quantityNeeded);

      if (current <= 0) {
        await deleteRecipeItem(item.id);

        continue;
      }

      if (previous !== undefined && previous !== current) {
        await updateRecipeItem(item.id, {
          quantityNeeded: current,
        });
      }
    }

    const newItems = recipeItems.filter(
      (item) => !item.id && toFiniteNumber(item.quantityNeeded) > 0,
    );

    for (const item of newItems) {
      await createRecipeItem({
        modifierId,
        ingredientId: item.ingredientId,
        quantityNeeded: toFiniteNumber(item.quantityNeeded),
      });
    }
  };

  // ==========================================================
  // SAVE MODIFIER
  // ==========================================================

  const saveModifier = async () => {
    const name = modifierForm.name.trim();

    if (!name || !modifierForm.groupId) {
      return;
    }

    setIsSavingModifier(true);

    try {
      if (modifierEditorMode === "create") {
        const response = await createModifier({
          groupId: modifierForm.groupId,
          name,
          sortOrder: modifierForm.sortOrder,
          extraPrice: toFiniteNumber(modifierForm.extraPrice),
          isActive: modifierForm.isActive,
        });

        const modifierId = response?.result?.modifier?.id;

        if (!modifierId) {
          throw new Error("Modifier ID was not returned.");
        }

        for (const item of recipeItems) {
          const quantity = toFiniteNumber(item.quantityNeeded);

          if (quantity <= 0) {
            continue;
          }

          await createRecipeItem({
            modifierId,
            ingredientId: item.ingredientId,
            quantityNeeded: quantity,
          });
        }
      } else if (editingModifierId) {
        await updateModifier(editingModifierId, {
          groupId: modifierForm.groupId,
          name,
          sortOrder: modifierForm.sortOrder,
          extraPrice: toFiniteNumber(modifierForm.extraPrice),
          isActive: modifierForm.isActive,
        });

        await saveRecipeChanges(editingModifierId);
      }

      setIsModifierEditorOpen(false);

      if (selectedGroupId) {
        await loadModifiers(selectedGroupId);
      }

      onModifiersChanged?.();
    } catch (error) {
      console.error("Failed to save modifier:", error);
    } finally {
      setIsSavingModifier(false);
    }
  };

  // ==========================================================
  // CLOSE
  // ==========================================================

  const closeModal = () => {
    if (isSavingGroup || isSavingModifier) {
      return;
    }

    setIsGroupEditorOpen(false);

    setIsModifierEditorOpen(false);

    closeRecipeDrawer();

    resetRecipeEditor();

    onClose();
  };

  // ==========================================================
  // RENDER GUARD
  // ==========================================================

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  // ============================================================
  // RENDER
  // ============================================================

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modifier-manager-title"
    >
      {/* ======================================================
          BACKDROP
      ====================================================== */}

      <button
        type="button"
        aria-label="Close modifier manager"
        onClick={closeModal}
        disabled={isSavingGroup || isSavingModifier}
        className="
          absolute
          inset-0
          bg-black/70
          backdrop-blur-md
        "
      />

      {/* ======================================================
          MODAL
      ====================================================== */}

      <div
        onMouseDown={(event) => event.stopPropagation()}
        className="
          relative
          flex
          h-[min(820px,calc(100vh-2rem))]
          w-full
          max-w-6xl
          flex-col
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
        {/* ====================================================
            AMBIENT LIGHT
        ==================================================== */}

        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-500/[0.06] blur-3xl" />

        <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-cyan-500/[0.035] blur-3xl" />

        <div className="pointer-events-none absolute right-1/4 bottom-0 h-56 w-56 rounded-full bg-violet-500/[0.025] blur-3xl" />

        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-cyan-400/50" />

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="relative flex shrink-0 items-center justify-between border-b border-zinc-800/80 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="
                relative
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-2xl
                border
                border-emerald-400/20
                bg-gradient-to-br
                from-emerald-400/15
                via-cyan-400/10
                to-violet-400/10
                shadow-[0_0_28px_rgba(52,211,153,0.08)]
              "
            >
              <div className="absolute inset-0 rounded-2xl bg-emerald-400/5 blur-md" />

              <SlidersHorizontal className="relative h-5 w-5 text-emerald-300" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                  Catalog
                </span>

                <span className="text-zinc-800">/</span>

                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-cyan-400/80">
                  Modifiers
                </span>
              </div>

              <div className="mt-1 flex items-center gap-2">
                <h2
                  id="modifier-manager-title"
                  className="text-sm font-bold text-white"
                >
                  Modifier Registry
                </h2>

                <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 font-mono text-[9px] font-bold text-cyan-400">
                  {modifiers.length}
                </span>
              </div>

              <p className="mt-1 text-[10px] text-zinc-600">
                Manage modifier groups, options and recipes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeModal}
            disabled={isSavingGroup || isSavingModifier}
            className="
              group
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-zinc-800
              bg-zinc-900/80
              text-zinc-500
              transition-all
              duration-200
              hover:border-rose-500/30
              hover:bg-rose-500/10
              hover:text-rose-400
            "
          >
            <X className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
          </button>
        </div>

        {/* ====================================================
            MAIN
        ==================================================== */}

        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="grid h-full grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
            {/* ==================================================
                LEFT — GROUPS
            ================================================== */}

            <aside
              className="
                min-h-0
                overflow-y-auto
                border-b
                border-zinc-800
                bg-gradient-to-b
                from-violet-950/[0.035]
                via-zinc-950/10
                to-cyan-950/[0.025]
                lg:border-b-0
                lg:border-r
              "
            >
              {/* Group Header */}

              <div className="sticky top-0 z-20 border-b border-zinc-800/80 bg-[#090b0f]/95 px-4 py-4 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                      Modifier Groups
                    </p>

                    <p className="mt-1 text-[10px] text-zinc-600">
                      Choose a group to manage its options.
                    </p>
                  </div>
                </div>

                {/* Prominent Add Group */}

                <button
                  type="button"
                  onClick={openCreateGroup}
                  className="
                    group
                    relative
                    mt-4
                    flex
                    h-10
                    w-full
                    items-center
                    justify-center
                    gap-2
                    overflow-hidden
                    rounded-xl
                    border
                    border-emerald-400/20
                    bg-gradient-to-r
                    from-emerald-500/[0.12]
                    via-cyan-500/[0.08]
                    to-violet-500/[0.08]
                    text-xs
                    font-bold
                    text-emerald-300
                    shadow-[0_8px_24px_rgba(52,211,153,0.06)]
                    transition-all
                    duration-200
                    hover:border-emerald-400/35
                    hover:from-emerald-500/[0.17]
                    hover:via-cyan-500/[0.11]
                    hover:to-violet-500/[0.10]
                    hover:text-emerald-200
                  "
                >
                  <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />

                  <Plus className="relative h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />

                  <span className="relative">Add Modifier Group</span>
                </button>
              </div>

              {/* Groups */}

              <div className="space-y-1.5 p-3">
                {groups.length === 0 ? (
                  <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/15 bg-gradient-to-br from-violet-500/10 via-cyan-500/5 to-emerald-500/10">
                      <Layers3 className="h-5 w-5 text-violet-300" />
                    </div>

                    <p className="mt-4 text-sm font-semibold text-zinc-400">
                      No groups yet
                    </p>

                    <p className="mt-1 max-w-[210px] text-xs leading-5 text-zinc-600">
                      Create a group first, then add modifier options inside it.
                    </p>
                  </div>
                ) : (
                  groups.map((group, index) => {
                    const isSelected = selectedGroupId === group.id;

                    const modifierCount = Array.isArray(group.modifiers)
                      ? group.modifiers.length
                      : 0;

                    return (
                      <div
                        key={group.id}
                        className={`
                          group
                          relative
                          overflow-hidden
                          rounded-xl
                          border
                          transition-all
                          duration-200
                          ${
                            isSelected
                              ? "border-cyan-400/20 bg-gradient-to-r from-cyan-400/[0.065] via-emerald-400/[0.025] to-violet-500/[0.04]"
                              : "border-transparent bg-transparent hover:border-zinc-800/80 hover:bg-zinc-900/40"
                          }
                        `}
                      >
                        {isSelected && (
                          <div className="absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-emerald-400 via-cyan-400 to-violet-500" />
                        )}

                        <div className="flex items-stretch">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedGroupId(group.id);
                              setModifiers([]);
                              setModifierSearch("");
                            }}
                            className="min-w-0 flex-1 px-3.5 py-3 text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`
                                  flex
                                  h-8
                                  w-8
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-lg
                                  border
                                  font-mono
                                  text-[8px]
                                  font-bold
                                  ${
                                    isSelected
                                      ? "border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-300"
                                      : "border-zinc-800 bg-zinc-900/60 text-zinc-600"
                                  }
                                `}
                              >
                                {String(index + 1).padStart(2, "0")}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                      group.isActive
                                        ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
                                        : "bg-zinc-600"
                                    }`}
                                  />

                                  <p
                                    className={`
                                      truncate
                                      text-xs
                                      font-bold
                                      ${
                                        isSelected
                                          ? "text-white"
                                          : "text-zinc-300"
                                      }
                                    `}
                                  >
                                    {group.name}
                                  </p>
                                </div>

                                <div className="mt-1.5 flex items-center gap-2">
                                  <span className="font-mono text-[8px] text-violet-400/75">
                                    {group.minSelections}–{group.maxSelections}
                                  </span>

                                  <span className="text-zinc-800">•</span>

                                  <span className="font-mono text-[8px] text-zinc-600">
                                    {modifierCount} option
                                    {modifierCount === 1 ? "" : "s"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>

                          <div className="flex items-center pr-1">
                            <div className="flex items-center gap-1.5 pr-1.5">
                              {/* Edit Group */}
                              <button
                                type="button"
                                onClick={() => openEditGroup(group)}
                                title="Edit group"
                                className="
      group/edit
      flex
      h-8
      w-8
      items-center
      justify-center
      rounded-lg
      border
      border-cyan-400/10
      bg-cyan-400/[0.035]
      text-cyan-300/60
      transition-all
      duration-200
      hover:-translate-y-0.5
      hover:border-cyan-400/30
      hover:bg-cyan-400/10
      hover:text-cyan-200
      hover:shadow-[0_4px_14px_rgba(34,211,238,0.08)]
    "
                              >
                                <Pencil className="h-3.5 w-3.5 transition-transform duration-200 group-hover/edit:scale-110" />
                              </button>

                              {/* Toggle Group */}
                              <button
                                type="button"
                                onClick={() => void toggleGroupStatus(group)}
                                title={
                                  group.isActive
                                    ? "Deactivate group"
                                    : "Activate group"
                                }
                                className={`
      group/toggle
      flex
      h-8
      w-8
      items-center
      justify-center
      rounded-lg
      border
      transition-all
      duration-200
      hover:-translate-y-0.5
      ${
        group.isActive
          ? "border-rose-400/10 bg-rose-400/[0.035] text-rose-300/60 hover:border-rose-400/30 hover:bg-rose-400/10 hover:text-rose-200 hover:shadow-[0_4px_14px_rgba(251,113,133,0.08)]"
          : "border-emerald-400/10 bg-emerald-400/[0.035] text-emerald-300/60 hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-200 hover:shadow-[0_4px_14px_rgba(52,211,153,0.08)]"
      }
    `}
                              >
                                <Power className="h-3.5 w-3.5 transition-transform duration-200 group-hover/toggle:scale-110" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="relative flex items-center justify-between border-t border-cyan-400/10 bg-black/[0.08] px-3.5 py-2">
                            <span
                              className={`
                                inline-flex
                                items-center
                                gap-1.5
                                rounded-full
                                border
                                px-2
                                py-0.5
                                text-[8px]
                                font-bold
                                uppercase
                                tracking-wide
                                ${
                                  group.isActive
                                    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                                    : "border-rose-400/20 bg-rose-400/10 text-rose-300"
                                }
                              `}
                            >
                              <span
                                className={`
                                  h-1.5 w-1.5 rounded-full
                                  ${
                                    group.isActive
                                      ? "bg-emerald-400 shadow-[0_0_7px_rgba(52,211,153,0.9)]"
                                      : "bg-rose-400"
                                  }
                                `}
                              />

                              {group.isActive ? "Available" : "Inactive"}
                            </span>

                            <span className="font-mono text-[8px] text-zinc-700">
                              ORDER {group.sortOrder}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </aside>

            {/* ==================================================
                RIGHT — MODIFIERS
            ================================================== */}

            <main
              className="
                min-h-0
                overflow-y-auto
                bg-gradient-to-br
                from-[#090b0f]
                via-[#090b0f]
                to-[#100c15]
              "
            >
              {!selectedGroup ? (
                <div className="flex min-h-full items-center justify-center p-8">
                  <div className="max-w-xs text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/15 bg-gradient-to-br from-violet-500/10 via-cyan-500/5 to-emerald-500/10">
                      <SlidersHorizontal className="h-5 w-5 text-violet-300" />
                    </div>

                    <p className="mt-4 text-sm font-semibold text-zinc-400">
                      Select a modifier group
                    </p>

                    <p className="mt-1 text-xs leading-5 text-zinc-600">
                      Select a group from the left to view and manage its
                      modifiers.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* ==================================================
                      SIMPLE GROUP HEADER
                  ================================================== */}

                  <div className="border-b border-zinc-800/80 bg-gradient-to-r from-zinc-900/30 via-transparent to-violet-950/[0.05] px-5 py-3.5 sm:px-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-bold text-white">
                            {selectedGroup.name}
                          </h3>

                          <span
                            className={`
                              inline-flex
                              items-center
                              gap-1.5
                              rounded-full
                              border
                              px-2
                              py-0.5
                              text-[8px]
                              font-bold
                              uppercase
                              ${
                                selectedGroup.isActive
                                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                                  : "border-rose-400/20 bg-rose-400/10 text-rose-300"
                              }
                            `}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                selectedGroup.isActive
                                  ? "bg-emerald-400"
                                  : "bg-rose-400"
                              }`}
                            />

                            {selectedGroup.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <p className="mt-1 text-[10px] text-zinc-600">
                          Select {selectedGroup.minSelections}–
                          {selectedGroup.maxSelections} option
                          {selectedGroup.maxSelections === 1 ? "" : "s"}.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditGroup(selectedGroup)}
                          title="Edit group"
                          className="
                            flex
                            h-8
                            w-8
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            border
                            border-transparent
                            text-zinc-600
                            transition
                            hover:border-cyan-500/20
                            hover:bg-cyan-500/10
                            hover:text-cyan-300
                          "
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ==================================================
                      SIMPLE TOOLBAR
                  ================================================== */}

                  <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-800/80 bg-gradient-to-r from-zinc-900/25 via-zinc-950/10 to-transparent px-5 py-3 sm:px-6">
                    <div className="relative min-w-0 flex-1 sm:max-w-sm">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-500/50" />

                      <input
                        type="text"
                        value={modifierSearch}
                        onChange={(event) =>
                          setModifierSearch(event.target.value)
                        }
                        placeholder="Search modifiers..."
                        className="
                          h-9
                          w-full
                          rounded-lg
                          border
                          border-zinc-800
                          bg-zinc-950/80
                          pl-9
                          pr-3
                          text-xs
                          text-zinc-200
                          outline-none
                          transition
                          placeholder:text-zinc-600
                          focus:border-cyan-500/35
                          focus:bg-cyan-500/[0.02]
                        "
                      />
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void loadModifiers(selectedGroup.id)}
                        disabled={isLoadingModifiers}
                        title="Refresh modifiers"
                        className="
                          group
                          flex
                          h-9
                          w-9
                          items-center
                          justify-center
                          rounded-lg
                          border
                          border-zinc-800
                          bg-zinc-950/80
                          text-zinc-500
                          transition
                          hover:border-cyan-500/25
                          hover:bg-cyan-500/5
                          hover:text-cyan-300
                        "
                      >
                        <RefreshCw
                          className={`h-3.5 w-3.5 ${
                            isLoadingModifiers
                              ? "animate-spin"
                              : "transition-transform group-hover:rotate-90"
                          }`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={openCreateModifier}
                        disabled={!selectedGroup.isActive}
                        className="
                          inline-flex
                          h-9
                          items-center
                          gap-2
                          rounded-lg
                          border
                          border-emerald-400/20
                          bg-gradient-to-r
                          from-emerald-500/90
                          to-cyan-500/80
                          px-3.5
                          text-[10px]
                          font-bold
                          text-zinc-950
                          shadow-[0_6px_18px_rgba(52,211,153,0.08)]
                          transition
                          hover:from-emerald-400
                          hover:to-cyan-400
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Modifier
                      </button>
                    </div>
                  </div>

                  {/* ==================================================
                      TABLE HEADER
                  ================================================== */}

                  <div className="hidden grid-cols-[minmax(0,1fr)_100px_110px_150px] gap-4 border-b border-zinc-800/80 bg-[#090b0f]/95 px-5 py-3 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-600 backdrop-blur md:grid">
                    <span>Modifier</span>

                    <span>Price</span>

                    <span>Status</span>

                    <span className="text-right">Actions</span>
                  </div>

                  {/* ==================================================
                      MODIFIER CONTENT
                  ================================================== */}

                  {isLoadingModifiers ? (
                    <div className="flex min-h-[350px] items-center justify-center">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-4 w-4 animate-spin text-violet-300" />

                        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-600">
                          Loading modifiers
                        </span>
                      </div>
                    </div>
                  ) : filteredModifiers.length === 0 ? (
                    <div className="flex min-h-[350px] items-center justify-center p-8">
                      <div className="text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/15 bg-gradient-to-br from-violet-500/10 via-cyan-500/5 to-emerald-500/10">
                          <SlidersHorizontal className="h-5 w-5 text-violet-300" />
                        </div>

                        <p className="mt-4 text-sm font-semibold text-zinc-400">
                          {modifierSearch
                            ? "No matching modifiers"
                            : "No modifiers in this group"}
                        </p>

                        <p className="mt-1 text-xs text-zinc-600">
                          {modifierSearch
                            ? "Try a different search term."
                            : "Add your first modifier option."}
                        </p>

                        {!modifierSearch && selectedGroup.isActive && (
                          <button
                            type="button"
                            onClick={openCreateModifier}
                            className="
                              mt-5
                              inline-flex
                              items-center
                              gap-2
                              rounded-lg
                              border
                              border-emerald-400/20
                              bg-gradient-to-r
                              from-emerald-500/10
                              to-cyan-500/10
                              px-4
                              py-2.5
                              text-xs
                              font-bold
                              text-emerald-300
                              transition
                              hover:border-emerald-400/35
                              hover:text-emerald-200
                            "
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add Modifier
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      {filteredModifiers.map((modifier, index) => {
                        const price = toFiniteNumber(modifier.extraPrice);

                        return (
                          <div
                            key={modifier.id}
                            className="
                              group
                              relative
                              border-b
                              border-zinc-900/90
                              px-5
                              py-3
                              transition-all
                              duration-200
                              hover:bg-gradient-to-r
                              hover:from-cyan-500/[0.022]
                              hover:via-transparent
                              hover:to-violet-500/[0.018]
                            "
                          >
                            <div
                              className={`
                                absolute
                                inset-y-0
                                left-0
                                w-[2px]
                                opacity-0
                                transition-opacity
                                group-hover:opacity-100
                                ${
                                  modifier.isActive
                                    ? "bg-gradient-to-b from-emerald-400 via-cyan-400 to-transparent"
                                    : "bg-rose-400"
                                }
                              `}
                            />

                            {/* Desktop */}

                            <div className="hidden grid-cols-[minmax(0,1fr)_100px_110px_150px] items-center gap-4 md:grid">
                              <div className="flex min-w-0 items-center gap-3">
                                <div
                                  className={`
                                    flex
                                    h-9
                                    w-9
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-xl
                                    border
                                    ${
                                      modifier.isActive
                                        ? "border-emerald-400/15 bg-gradient-to-br from-emerald-400/10 to-cyan-400/[0.03]"
                                        : "border-zinc-800 bg-zinc-900/60"
                                    }
                                  `}
                                >
                                  <span
                                    className={`font-mono text-[9px] font-bold ${
                                      modifier.isActive
                                        ? "text-emerald-300"
                                        : "text-zinc-600"
                                    }`}
                                  >
                                    {String(index + 1).padStart(2, "0")}
                                  </span>
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                        modifier.isActive
                                          ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.65)]"
                                          : "bg-zinc-600"
                                      }`}
                                    />

                                    <p className="truncate text-xs font-bold text-zinc-200 transition group-hover:text-white">
                                      {modifier.name}
                                    </p>
                                  </div>

                                  <p className="mt-1 truncate pl-3.5 font-mono text-[8px] text-zinc-700">
                                    {modifier.id}
                                  </p>
                                </div>
                              </div>

                              <div>
                                <span className="font-mono text-[10px] font-bold text-amber-300">
                                  ₹{price.toFixed(2)}
                                </span>
                              </div>

                              <div>
                                <span
                                  className={`
                                    inline-flex
                                    items-center
                                    gap-1.5
                                    rounded-full
                                    border
                                    px-2.5
                                    py-1
                                    text-[8px]
                                    font-bold
                                    uppercase
                                    tracking-wide
                                    ${
                                      modifier.isActive
                                        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                                        : "border-rose-400/20 bg-rose-400/10 text-rose-300"
                                    }
                                  `}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${
                                      modifier.isActive
                                        ? "bg-emerald-400"
                                        : "bg-rose-400"
                                    }`}
                                  />

                                  {modifier.isActive ? "Active" : "Inactive"}
                                </span>
                              </div>

                              <div className="flex justify-end gap-2">
                                {/* Recipe */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    void openRecipeDrawer(modifier)
                                  }
                                  title="View recipe"
                                  className="
      inline-flex
      h-8
      items-center
      gap-1.5
      rounded-lg
      border
      border-violet-400/20
      bg-violet-400/[0.07]
      px-2.5
      text-[9px]
      font-bold
      text-violet-300
      transition-all
      duration-200
      hover:-translate-y-0.5
      hover:border-violet-400/40
      hover:bg-violet-400/[0.14]
      hover:text-violet-200
      hover:shadow-[0_4px_16px_rgba(167,139,250,0.10)]
    "
                                >
                                  <ChefHat className="h-3.5 w-3.5" />
                                  <span>Recipe</span>
                                </button>

                                {/* Edit */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    void openEditModifier(modifier)
                                  }
                                  title="Edit modifier"
                                  className="flex h-8 w-8 p-2  items-center justify-center rounded-lg border border-cyan-400/15 bg-cyan-400/[0.045]
                                              text-cyan-300/80
                                              transition-all
                                              duration-200
                                              hover:-translate-y-0.5
                                              hover:border-cyan-400/35
                                              hover:bg-cyan-400/[0.10]
                                               hover:text-cyan-200
                                               "
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>

                                {/* Power */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    void toggleModifierStatus(modifier)
                                  }
                                  title={
                                    modifier.isActive
                                      ? "Deactivate modifier"
                                      : "Activate modifier"
                                  }
                                  className={`      flex
      h-8
      w-8
      p-2
      items-center
      justify-center
      rounded-lg
      border
      transition-all
      duration-200
      hover:-translate-y-0.5
      ${
        modifier.isActive
          ? "border-rose-400/15 bg-rose-400/[0.04] text-rose-300/70 hover:border-rose-400/35 hover:bg-rose-400/[0.10] hover:text-rose-200"
          : "border-emerald-400/15 bg-emerald-400/[0.04] text-emerald-300/70 hover:border-emerald-400/35 hover:bg-emerald-400/[0.10] hover:text-emerald-200"
      }
    `}
                                >
                                  <Power className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Mobile */}

                            <div className="md:hidden">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`
                                    flex
                                    h-9
                                    w-9
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-xl
                                    border
                                    ${
                                      modifier.isActive
                                        ? "border-emerald-400/15 bg-gradient-to-br from-emerald-400/10 to-cyan-400/[0.03]"
                                        : "border-zinc-800 bg-zinc-900/60"
                                    }
                                  `}
                                >
                                  <span className="font-mono text-[9px] font-bold text-emerald-300">
                                    {String(index + 1).padStart(2, "0")}
                                  </span>
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`h-1.5 w-1.5 rounded-full ${
                                        modifier.isActive
                                          ? "bg-emerald-400"
                                          : "bg-zinc-600"
                                      }`}
                                    />
                                    <p className="truncate text-xs font-bold text-zinc-200">
                                      {modifier.name}
                                    </p>
                                  </div>
                                  <p className="mt-1 truncate font-mono text-[8px] text-zinc-700">
                                    {modifier.id}
                                  </p>
                                </div>

                                <span className="shrink-0 rounded-lg border border-amber-400/15 bg-amber-400/[0.08] px-2 py-1 font-mono text-[9px] font-bold text-amber-300">
                                  ₹{price.toFixed(2)}
                                </span>
                              </div>

                              <div className="mt-3 flex items-center justify-between">
                                <span
                                  className={`
                                    inline-flex
                                    items-center
                                    gap-1.5
                                    rounded-full
                                    border
                                    px-2
                                    py-0.5
                                    text-[8px]
                                    font-bold
                                    uppercase
                                    tracking-wide
                                    ${
                                      modifier.isActive
                                        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                                        : "border-rose-400/20 bg-rose-400/10 text-rose-300"
                                    }
                                  `}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${
                                      modifier.isActive
                                        ? "bg-emerald-400"
                                        : "bg-rose-400"
                                    }`}
                                  />
                                  {modifier.isActive ? "Active" : "Inactive"}
                                </span>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void openRecipeDrawer(modifier)
                                    }
                                    title="View recipe"
                                    className="
                                      inline-flex
                                      h-8
                                      items-center
                                      gap-1.5
                                      rounded-lg
                                      border
                                      border-violet-400/20
                                      bg-violet-400/[0.07]
                                      px-2.5
                                      text-[9px]
                                      font-bold
                                      text-violet-300
                                      transition-all
                                      hover:-translate-y-0.5
                                      hover:border-violet-400/35
                                      hover:bg-violet-400/[0.12]
                                      hover:text-violet-200
                                    "
                                  >
                                    <ChefHat className="h-3.5 w-3.5" />
                                    <span>Recipe</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      void openEditModifier(modifier)
                                    }
                                    title="Edit modifier"
                                    className="
                                      flex
                                      h-8
                                      w-8
                                      items-center
                                      justify-center
                                      rounded-lg
                                      border
                                      border-cyan-400/15
                                      bg-cyan-400/[0.055]
                                      text-cyan-300/80
                                      transition-all
                                      hover:-translate-y-0.5
                                      hover:border-cyan-400/30
                                      hover:bg-cyan-400/[0.10]
                                      hover:text-cyan-300
                                    "
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      void toggleModifierStatus(modifier)
                                    }
                                    title={
                                      modifier.isActive
                                        ? "Deactivate modifier"
                                        : "Activate modifier"
                                    }
                                    className={`
                                      flex
                                      h-8
                                      w-8
                                      items-center
                                      justify-center
                                      rounded-lg
                                      border
                                      transition-all
                                      hover:-translate-y-0.5
                                      ${
                                        modifier.isActive
                                          ? "border-rose-400/15 bg-rose-400/[0.055] text-rose-300/80 hover:border-rose-400/30 hover:bg-rose-400/[0.10] hover:text-rose-300"
                                          : "border-emerald-400/15 bg-emerald-400/[0.055] text-emerald-300/80 hover:border-emerald-400/30 hover:bg-emerald-400/[0.10] hover:text-emerald-300"
                                      }
                                    `}
                                  >
                                    <Power className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ==================================================
                      FOOTER
                  ================================================== */}

                  {filteredModifiers.length > 0 && (
                    <div className="flex items-center justify-between border-t border-zinc-800/80 bg-gradient-to-r from-zinc-950 via-zinc-950 to-cyan-950/[0.04] px-5 py-3">
                      <span className="font-mono text-[8px] text-zinc-600">
                        {filteredModifiers.length} OPTIONS
                      </span>

                      <span className="font-mono text-[8px] text-zinc-700">
                        {activeModifierCount} ACTIVE
                      </span>
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>

        {/* ======================================================
            GROUP EDITOR
        ====================================================== */}

        {isGroupEditorOpen && (
          <div className="absolute inset-0 z-[60] flex justify-end bg-black/45 backdrop-blur-sm">
            <div className="h-full w-full max-w-[420px] border-l border-cyan-400/10 bg-gradient-to-b from-[#0e141a] via-[#090b0f] to-[#07090c] shadow-[-30px_0_100px_rgba(0,0,0,0.65)]">
              <div className="flex h-full flex-col">
                <div className="relative shrink-0 border-b border-zinc-800/80 bg-gradient-to-r from-emerald-500/[0.07] via-cyan-500/[0.03] to-violet-500/[0.04] px-5 py-5">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan-400/10 blur-3xl" />

                  <div className="relative flex items-start justify-between gap-4">
                    <div>
                      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                        Group Setup
                      </span>

                      <h3 className="mt-1 text-base font-bold text-white">
                        {groupEditorMode === "create"
                          ? "Add Modifier Group"
                          : "Edit Modifier Group"}
                      </h3>

                      <p className="mt-1 text-[10px] text-zinc-600">
                        Configure the group and selection rules.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsGroupEditorOpen(false)}
                      disabled={isSavingGroup}
                      className="group flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/70 text-zinc-600 transition hover:border-rose-500/25 hover:bg-rose-500/10 hover:text-rose-300"
                    >
                      <X className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
                    </button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                  <div className="space-y-5 p-5">
                    <div>
                      <label className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                        Group Name
                      </label>

                      <input
                        autoFocus
                        value={groupForm.name}
                        onChange={(event) =>
                          setGroupForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        placeholder="e.g. Toppings"
                        disabled={isSavingGroup}
                        className="
                          h-11
                          w-full
                          rounded-xl
                          border
                          border-zinc-800
                          bg-zinc-950/80
                          px-3
                          text-xs
                          text-zinc-200
                          outline-none
                          transition
                          placeholder:text-zinc-600
                          focus:border-cyan-500/35
                        "
                      />
                    </div>

                    <div className="border-t border-zinc-800/80 pt-5">
                      <div className="mb-4">
                        <p className="text-xs font-bold text-zinc-300">
                          Selection Rules
                        </p>

                        <p className="mt-1 text-[10px] text-zinc-600">
                          Define how many options customers can choose.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-2 block font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-zinc-600">
                            Minimum
                          </label>

                          <input
                            type="number"
                            min={0}
                            value={groupForm.minSelections}
                            onChange={(event) =>
                              setGroupForm((current) => ({
                                ...current,
                                minSelections: toFiniteNumber(
                                  event.target.value,
                                ),
                              }))
                            }
                            disabled={isSavingGroup}
                            className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 font-mono text-xs text-zinc-200 outline-none focus:border-violet-400/30"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-zinc-600">
                            Maximum
                          </label>

                          <input
                            type="number"
                            min={0}
                            value={groupForm.maxSelections}
                            onChange={(event) =>
                              setGroupForm((current) => ({
                                ...current,
                                maxSelections: toFiniteNumber(
                                  event.target.value,
                                ),
                              }))
                            }
                            disabled={isSavingGroup}
                            className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 font-mono text-xs text-zinc-200 outline-none focus:border-violet-400/30"
                          />
                        </div>
                      </div>

                      {groupForm.minSelections > groupForm.maxSelections && (
                        <p className="mt-2 text-[10px] font-semibold text-rose-300">
                          Minimum cannot exceed maximum.
                        </p>
                      )}
                    </div>

                    <div className="border-t border-zinc-800/80 pt-5">
                      <label className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                        Sort Order
                      </label>

                      <input
                        type="number"
                        min={0}
                        value={groupForm.sortOrder}
                        onChange={(event) =>
                          setGroupForm((current) => ({
                            ...current,
                            sortOrder: toFiniteNumber(event.target.value),
                          }))
                        }
                        disabled={isSavingGroup}
                        className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 font-mono text-xs text-zinc-200 outline-none focus:border-cyan-500/30"
                      />
                    </div>

                    <div className="border-t border-zinc-800/80 pt-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-zinc-300">
                            Availability
                          </p>

                          <p className="mt-1 text-[10px] text-zinc-600">
                            Make this group available for active menu flows.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setGroupForm((current) => ({
                              ...current,
                              isActive: !current.isActive,
                            }))
                          }
                          disabled={isSavingGroup}
                          className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                            groupForm.isActive
                              ? "bg-gradient-to-r from-emerald-400 to-cyan-400"
                              : "bg-zinc-700"
                          }`}
                        >
                          <span
                            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-lg transition ${
                              groupForm.isActive ? "left-6" : "left-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 border-t border-zinc-800/80 bg-zinc-950/85 p-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsGroupEditorOpen(false)}
                      disabled={isSavingGroup}
                      className="h-10 flex-1 rounded-xl border border-zinc-800 bg-zinc-950 text-xs font-bold text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => void saveGroup()}
                      disabled={
                        isSavingGroup ||
                        !groupForm.name.trim() ||
                        groupForm.minSelections > groupForm.maxSelections
                      }
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-gradient-to-r from-emerald-500/90 to-cyan-500/80 text-xs font-bold text-zinc-950 shadow-[0_8px_24px_rgba(52,211,153,0.10)] transition hover:from-emerald-400 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSavingGroup ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}

                      {groupEditorMode === "create"
                        ? "Create Group"
                        : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================
            MODIFIER EDITOR
        ====================================================== */}

        {isModifierEditorOpen && (
          <div className="absolute inset-0 z-[60] flex justify-end bg-black/45 backdrop-blur-sm">
            <div className="h-full w-full max-w-[470px] border-l border-emerald-400/10 bg-gradient-to-b from-[#0e141a] via-[#090b0f] to-[#07090c] shadow-[-30px_0_100px_rgba(0,0,0,0.7)]">
              <div className="flex h-full flex-col">
                <div className="relative shrink-0 border-b border-zinc-800/80 bg-gradient-to-r from-emerald-500/[0.08] via-cyan-500/[0.035] to-violet-500/[0.045] px-5 py-5">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />

                  <div className="relative flex items-start justify-between gap-4">
                    <div>
                      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                        Modifier Setup
                      </span>

                      <h3 className="mt-1 text-base font-bold text-white">
                        {modifierEditorMode === "create"
                          ? "Add Modifier"
                          : "Edit Modifier"}
                      </h3>

                      <p className="mt-1 max-w-sm text-[10px] text-zinc-600">
                        Configure the option, pricing and recipe.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsModifierEditorOpen(false)}
                      disabled={isSavingModifier}
                      className="group flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/70 text-zinc-600 transition hover:border-rose-500/25 hover:bg-rose-500/10 hover:text-rose-300"
                    >
                      <X className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
                    </button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                  <div className="p-5">
                    <div className="space-y-5">
                      <div>
                        <label className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                          Modifier Name
                        </label>

                        <input
                          autoFocus
                          value={modifierForm.name}
                          onChange={(event) =>
                            setModifierForm((current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                          placeholder="e.g. Extra Cheese"
                          disabled={isSavingModifier}
                          className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3.5 text-xs text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-emerald-400/35 focus:bg-emerald-400/[0.015]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                          Modifier Group
                        </label>

                        <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3.5 py-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/15 bg-cyan-400/[0.06]">
                            <SlidersHorizontal className="h-3.5 w-3.5 text-cyan-300" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-zinc-200">
                              {groups.find(
                                (group) => group.id === modifierForm.groupId,
                              )?.name ?? "Unknown group"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-amber-400/70">
                            Extra Price
                          </label>

                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-amber-400">
                              ₹
                            </span>

                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={modifierForm.extraPrice}
                              onChange={(event) =>
                                setModifierForm((current) => ({
                                  ...current,
                                  extraPrice: toFiniteNumber(
                                    event.target.value,
                                  ),
                                }))
                              }
                              disabled={isSavingModifier}
                              className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-8 pr-3 font-mono text-xs text-amber-300 outline-none focus:border-amber-400/30"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-cyan-400/70">
                            Sort Order
                          </label>

                          <input
                            type="number"
                            min={0}
                            value={modifierForm.sortOrder}
                            onChange={(event) =>
                              setModifierForm((current) => ({
                                ...current,
                                sortOrder: toFiniteNumber(event.target.value),
                              }))
                            }
                            disabled={isSavingModifier}
                            className="h-11 w-full rounded-xl border border-cyan-400/10 bg-cyan-400/[0.025] px-3 font-mono text-xs text-cyan-200 outline-none focus:border-cyan-400/30"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-zinc-800/80 pt-5">
                        <div>
                          <p className="text-xs font-bold text-zinc-300">
                            Availability
                          </p>

                          <p className="mt-1 text-[10px] text-zinc-600">
                            Available in active menu flows.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setModifierForm((current) => ({
                              ...current,
                              isActive: !current.isActive,
                            }))
                          }
                          disabled={isSavingModifier}
                          className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                            modifierForm.isActive
                              ? "bg-gradient-to-r from-emerald-400 to-cyan-400"
                              : "bg-zinc-700"
                          }`}
                        >
                          <span
                            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-lg transition ${
                              modifierForm.isActive ? "left-6" : "left-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ==================================================
                      RECIPE
                  ================================================== */}

                  <div className="border-t border-zinc-800/80">
                    <div className="flex items-center justify-between bg-gradient-to-r from-violet-500/[0.05] to-transparent px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="
                            flex
                            h-9
                            w-9
                            items-center
                            justify-center
                            rounded-xl
                            border
                            border-violet-400/25
                            bg-gradient-to-br
                            from-violet-400/15
                            to-cyan-400/[0.06]
                            shadow-[0_0_18px_rgba(167,139,250,0.08)]
                          "
                        >
                          <ChefHat className="h-4 w-4 text-violet-300" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-zinc-100">
                              Recipe
                            </p>

                            <span
                              className="
                                rounded-full
                                border
                                border-violet-400/20
                                bg-violet-400/10
                                px-1.5
                                py-0.5
                                font-mono
                                text-[8px]
                                font-bold
                                text-violet-300
                              "
                            >
                              BOM
                            </span>
                          </div>

                          <p className="mt-0.5 text-[10px] text-zinc-600">
                            Ingredient consumption
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full border border-violet-400/15 bg-violet-400/10 px-2 py-0.5 font-mono text-[8px] font-bold text-violet-300">
                        {recipeItems.length}
                      </span>
                    </div>

                    <div className="px-5 pt-4">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-400/50" />

                        <input
                          value={ingredientSearch}
                          onChange={(event) =>
                            handleIngredientSearchChange(event.target.value)
                          }
                          placeholder="Search ingredient..."
                          disabled={isSavingModifier}
                          className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-10 pr-3 text-xs text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-violet-400/30"
                        />
                      </div>

                      {ingredientSearch.trim().length >= 2 &&
                        !isSearchingIngredients && (
                          <div className="mt-2 overflow-hidden rounded-xl border border-zinc-800 bg-[#07090c]">
                            {ingredientResults
                              .filter(
                                (ingredient) =>
                                  ingredient.isActive &&
                                  !recipeItems.some(
                                    (item) =>
                                      item.ingredientId === ingredient.id,
                                  ),
                              )
                              .map((ingredient) => (
                                <button
                                  type="button"
                                  key={ingredient.id}
                                  onClick={() =>
                                    addIngredientToRecipe(ingredient)
                                  }
                                  className="group flex w-full items-center justify-between border-b border-zinc-900 px-3 py-2.5 text-left last:border-b-0 hover:bg-violet-400/[0.04]"
                                >
                                  <div className="flex min-w-0 items-center gap-2.5">
                                    <Wheat className="h-3.5 w-3.5 shrink-0 text-violet-300" />

                                    <div className="min-w-0">
                                      <p className="truncate text-xs font-semibold text-zinc-200">
                                        {ingredient.name}
                                      </p>

                                      <p className="font-mono text-[8px] text-zinc-600">
                                        {ingredient.uom}
                                      </p>
                                    </div>
                                  </div>

                                  <Plus className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                                </button>
                              ))}
                          </div>
                        )}
                    </div>

                    <div className="p-5">
                      {isLoadingRecipe ? (
                        <div className="flex justify-center py-10">
                          <Loader2 className="h-5 w-5 animate-spin text-violet-300" />
                        </div>
                      ) : recipeItems.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center">
                          <ChefHat className="mx-auto h-5 w-5 text-violet-400/60" />

                          <p className="mt-3 text-xs font-semibold text-zinc-500">
                            No ingredients
                          </p>

                          <p className="mt-1 text-[10px] text-zinc-700">
                            Search above to add ingredients.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className="mb-1 grid grid-cols-[minmax(0,1fr)_90px_32px] gap-2 px-2 pb-2 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-zinc-700">
                            <span>Ingredient</span>
                            <span className="text-right">Quantity</span>
                            <span />
                          </div>

                          {recipeItems.map((item, index) => (
                            <div
                              key={item.localId}
                              className="grid grid-cols-[minmax(0,1fr)_90px_32px] items-center gap-2 border-b border-zinc-900 px-2 py-3"
                            >
                              <div className="flex min-w-0 items-center gap-2.5">
                                <span className="font-mono text-[8px] font-bold text-violet-400">
                                  {String(index + 1).padStart(2, "0")}
                                </span>

                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold text-zinc-200">
                                    {item.ingredient.name}
                                  </p>

                                  <p className="mt-0.5 font-mono text-[8px] text-zinc-600">
                                    {item.ingredient.uom}
                                  </p>
                                </div>
                              </div>

                              <input
                                type="number"
                                min={0}
                                step={0.0001}
                                value={
                                  Number.isFinite(item.quantityNeeded)
                                    ? item.quantityNeeded
                                    : 0
                                }
                                onChange={(event) =>
                                  updateRecipeQuantity(
                                    item.localId,
                                    toFiniteNumber(event.target.value),
                                  )
                                }
                                disabled={isSavingModifier}
                                className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 text-right font-mono text-xs text-violet-200 outline-none focus:border-violet-400/30"
                              />

                              <button
                                type="button"
                                onClick={() => removeRecipeItem(item.localId)}
                                disabled={isSavingModifier}
                                title="Remove ingredient"
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-zinc-700 transition hover:border-rose-400/20 hover:bg-rose-400/10 hover:text-rose-300 disabled:opacity-40"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 border-t border-zinc-800/80 bg-zinc-950/85 p-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModifierEditorOpen(false)}
                      disabled={isSavingModifier}
                      className="h-11 flex-1 rounded-xl border border-zinc-800 bg-zinc-950 text-xs font-bold text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => void saveModifier()}
                      disabled={
                        isSavingModifier ||
                        !modifierForm.name.trim() ||
                        !modifierForm.groupId ||
                        !groups.some(
                          (group) =>
                            group.id === modifierForm.groupId && group.isActive,
                        )
                      }
                      className="inline-flex h-11 flex-[1.35] items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-gradient-to-r from-emerald-500/90 to-cyan-500/80 text-xs font-bold text-zinc-950 shadow-[0_8px_24px_rgba(52,211,153,0.12)] transition hover:from-emerald-400 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSavingModifier ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}

                      {modifierEditorMode === "create"
                        ? "Create Modifier"
                        : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================
            RECIPE VIEW DRAWER
        ====================================================== */}

        {isRecipeDrawerOpen && (
          <div className="absolute inset-0 z-[70] flex justify-end bg-black/45 backdrop-blur-sm">
            <div className="h-full w-full max-w-[400px] border-l border-violet-400/10 bg-gradient-to-b from-[#100e17] via-[#090b0f] to-[#07090c] shadow-[-30px_0_100px_rgba(0,0,0,0.7)]">
              <div className="flex h-full flex-col">
                {/* Header */}

                <div className="relative shrink-0 border-b border-zinc-800/80 bg-gradient-to-br from-violet-500/[0.08] via-transparent to-cyan-500/[0.02] px-5 py-5">
                  <div className="relative flex items-start justify-between gap-4">
                    <div>
                      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-violet-300">
                        Recipe
                      </span>

                      <h3 className="mt-1 text-sm font-bold text-white">
                        {recipeDrawerModifier?.name ?? "Modifier Recipe"}
                      </h3>

                      <p className="mt-1 text-[10px] text-zinc-600">
                        Ingredient consumption for this modifier.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={closeRecipeDrawer}
                      className="group flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/70 text-zinc-600 transition hover:border-rose-500/25 hover:bg-rose-500/10 hover:text-rose-300"
                    >
                      <X className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
                    </button>
                  </div>
                </div>

                {/* Stats */}

                {recipeDrawerModifier && (
                  <div className="grid grid-cols-2 border-b border-zinc-800/80">
                    <div className="border-r border-zinc-800/80 px-5 py-4">
                      <p className="font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-zinc-600">
                        Extra Price
                      </p>

                      <p className="mt-1 text-lg font-black text-amber-300">
                        ₹
                        {toFiniteNumber(
                          recipeDrawerModifier.extraPrice,
                        ).toFixed(2)}
                      </p>
                    </div>

                    <div className="px-5 py-4">
                      <p className="font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-zinc-600">
                        Ingredients
                      </p>

                      <p className="mt-1 text-lg font-black text-violet-300">
                        {recipeViewItems.length}
                      </p>
                    </div>
                  </div>
                )}

                <div className="min-h-0 flex-1 overflow-y-auto">
                  {isLoadingRecipeView ? (
                    <div className="flex min-h-[320px] items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-violet-300" />
                    </div>
                  ) : recipeViewItems.length === 0 ? (
                    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
                      <ChefHat className="h-6 w-6 text-violet-400/60" />

                      <p className="mt-4 text-sm font-semibold text-zinc-400">
                        No recipe ingredients
                      </p>

                      <p className="mt-1 max-w-xs text-xs leading-5 text-zinc-600">
                        Add ingredients from the modifier editor.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-[minmax(0,1fr)_80px] gap-3 border-b border-zinc-800/80 bg-zinc-950/30 px-5 py-3 font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-zinc-700">
                        <span>Ingredient</span>

                        <span className="text-right">Quantity</span>
                      </div>

                      {recipeViewItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="border-b border-zinc-900 px-5 py-4 transition hover:bg-violet-400/[0.025]"
                        >
                          <div className="grid grid-cols-[minmax(0,1fr)_80px] gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <span className="font-mono text-[8px] font-bold text-violet-400">
                                {String(index + 1).padStart(2, "0")}
                              </span>

                              <div className="min-w-0">
                                <p className="truncate text-xs font-bold text-zinc-200">
                                  {item.ingredient.name}
                                </p>

                                <p className="mt-1 font-mono text-[8px] text-zinc-600">
                                  {item.ingredient.uom}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="font-mono text-sm font-black text-violet-300">
                                {item.quantityNeeded}
                              </p>

                              <p className="font-mono text-[8px] text-zinc-700">
                                {item.ingredient.uom}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}

                <div className="shrink-0 border-t border-zinc-800/80 bg-zinc-950/85 p-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (!recipeDrawerModifier) {
                        return;
                      }

                      const modifier = recipeDrawerModifier;
                      closeRecipeDrawer();
                      void openEditModifier(modifier);
                    }}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-violet-400/20 bg-gradient-to-r from-violet-500/10 via-cyan-500/5 to-violet-500/10 text-xs font-bold text-violet-200 transition hover:border-violet-400/35 hover:bg-violet-400/[0.12]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Modifier & Recipe
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
