"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

import {
  ArrowLeft,
  BadgeDollarSign,
  CheckCircle2,
  ChefHat,
  CircleOff,
  ClipboardList,
  Edit3,
  Layers3,
  Loader2,
  Package,
  Plus,
  Store,
  Unlink2,
  Utensils,
  XCircle,
} from "lucide-react";

import {
  assignModifierGroupToMenuItem,
  getMenuItemById,
  getMenuItemModifierGroups,
  getMenuItemRecipes,
  getMenuItemRestaurantPricing,
  getModifierGroups,
  removeModifierGroupFromMenuItem,
  type MenuItem,
  type ModifierGroup,
} from "@/lib/catalog-api";

import AddModifierGroupPopup from "./AddModifierGroupPopup";

import type { Restaurant } from "@/utils/types/organization";

import RestaurantMenuEditDrawer from "./RestaurantMenuEditDrawer";

// ============================================================
// TYPES
// ============================================================

interface MenuItemInformationViewProps {
  menuItem: MenuItem;
  restaurants: Restaurant[];
  onBack: () => void;
  onRefresh: () => Promise<void>;
}

interface RecipeRow {
  id: string;
  ingredientId: string;
  quantityNeeded: number | string;
  ingredientName: string;
  uom: string;
  isActive: boolean;
}

interface ModifierRow {
  id: string;
  groupId: string;
  name: string;
  extraPrice: number | string;
  sortOrder: number;
  isActive: boolean;
}

interface ModifierGroupRow {
  id: string;
  name: string;
  sortOrder: number;
  minSelections: number;
  maxSelections: number;
  isActive: boolean;
  modifiers: ModifierRow[];
}

interface RestaurantPricingItem {
  restaurantMenuItemId?: string;
  restaurantId: string;
  price: number | string;
  priceDifference?: number | string;
  isAvailable: boolean;
  updatedAt?: string;
}

interface RestaurantPricingResponseShape {
  restaurants?: RestaurantPricingItem[];
}

interface RestaurantPricingRow {
  restaurantMenuItemId: string | null;
  restaurantId: string;
  restaurantName: string;
  price: number;
  priceDifference: number;
  isAvailable: boolean;
  isConfigured: boolean;
  updatedAt?: string;
}

interface ConfiguredRestaurantPricingRow extends Omit<
  RestaurantPricingRow,
  "restaurantMenuItemId"
> {
  restaurantMenuItemId: string;
}

interface EditingRestaurantState {
  restaurant: Restaurant;
  config: ConfiguredRestaurantPricingRow;
}

interface SectionProps {
  title: string;
  description?: string;
  icon: ComponentType<{
    className?: string;
  }>;
  children: ReactNode;
  action?: ReactNode;
}

interface LoadedMenuItemInformation {
  details: MenuItem;
  recipes: RecipeRow[];
  modifierGroups: ModifierGroupRow[];
  pricing: RestaurantPricingRow[];
}

// ============================================================
// RESPONSE HELPERS
// ============================================================

function toRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getResponseArray(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }

  const record = toRecord(response);

  if (!record) {
    return [];
  }

  if (Array.isArray(record.result)) {
    return record.result;
  }

  if (Array.isArray(record.data)) {
    return record.data;
  }

  return [];
}

// ============================================================
// RECIPE NORMALIZATION
// ============================================================

function extractRecipeRows(response: unknown): RecipeRow[] {
  const rows = getResponseArray(response);

  return rows
    .map((item): RecipeRow | null => {
      const row = toRecord(item);

      if (!row) {
        return null;
      }

      const recipeItemId = row.recipeItemId;

      const id = row.id;

      const ingredientId = row.ingredientId;

      const name = row.name;

      const uom = row.uom;

      const isActive = row.isActive;

      const quantityNeeded = row.quantityNeeded;

      if (typeof ingredientId !== "string" || typeof name !== "string") {
        return null;
      }

      let resolvedId = ingredientId;

      if (typeof recipeItemId === "string") {
        resolvedId = recipeItemId;
      } else if (typeof id === "string") {
        resolvedId = id;
      }

      let resolvedQuantity: number | string = 0;

      if (
        typeof quantityNeeded === "number" ||
        typeof quantityNeeded === "string"
      ) {
        resolvedQuantity = quantityNeeded;
      }

      return {
        id: resolvedId,
        ingredientId,
        ingredientName: name,
        uom: typeof uom === "string" ? uom : "",
        isActive: typeof isActive === "boolean" ? isActive : true,
        quantityNeeded: resolvedQuantity,
      };
    })
    .filter((row): row is RecipeRow => row !== null);
}

// ============================================================
// MENU ITEM MODIFIER GROUPS
// ============================================================

function extractItemModifierGroups(response: unknown): ModifierGroupRow[] {
  const rows = getResponseArray(response);

  return rows.flatMap((row) => {
    const assignment = toRecord(row);

    if (!assignment) {
      return [];
    }

    const group = toRecord(assignment.group);

    if (!group) {
      return [];
    }

    if (typeof group.id !== "string" || typeof group.name !== "string") {
      return [];
    }

    const sortOrder = typeof group.sortOrder === "number" ? group.sortOrder : 0;

    const minSelections =
      typeof group.minSelections === "number" ? group.minSelections : 0;

    const maxSelections =
      typeof group.maxSelections === "number" ? group.maxSelections : 1;

    const isActive =
      typeof group.isActive === "boolean" ? group.isActive : true;

    const modifiers: ModifierRow[] = Array.isArray(group.modifiers)
      ? group.modifiers.flatMap((value) => {
          const modifier = toRecord(value);

          if (!modifier) {
            return [];
          }

          if (
            typeof modifier.id !== "string" ||
            typeof modifier.groupId !== "string" ||
            typeof modifier.name !== "string"
          ) {
            return [];
          }

          const extraPrice =
            typeof modifier.extraPrice === "number" ||
            typeof modifier.extraPrice === "string"
              ? modifier.extraPrice
              : 0;

          const modifierSortOrder =
            typeof modifier.sortOrder === "number" ? modifier.sortOrder : 0;

          const modifierIsActive =
            typeof modifier.isActive === "boolean" ? modifier.isActive : true;

          return [
            {
              id: modifier.id,
              groupId: modifier.groupId,
              name: modifier.name,
              extraPrice,
              sortOrder: modifierSortOrder,
              isActive: modifierIsActive,
            },
          ];
        })
      : [];

    return [
      {
        id: group.id,
        name: group.name,
        sortOrder,
        minSelections,
        maxSelections,
        isActive,
        modifiers,
      },
    ];
  });
}

// ============================================================
// LOAD COMPLETE MENU ITEM INFORMATION
// ============================================================

async function fetchMenuItemInformation(
  menuItemId: string,
  restaurants: Restaurant[],
): Promise<LoadedMenuItemInformation> {
  const [menuItemResponse, pricingResponse, recipeResponse, modifierResponse] =
    await Promise.all([
      getMenuItemById(menuItemId),

      getMenuItemRestaurantPricing(menuItemId),

      getMenuItemRecipes(menuItemId),

      getMenuItemModifierGroups(menuItemId),
    ]);

  const loadedItem = menuItemResponse.data;

  // ==========================================================
  // RECIPES
  // ==========================================================

  const recipes = extractRecipeRows(recipeResponse);

  // ==========================================================
  // MODIFIER GROUPS
  // ==========================================================

  const modifierGroups = extractItemModifierGroups(modifierResponse);

  // ==========================================================
  // RESTAURANT PRICING
  // ==========================================================

  const pricingResponseData = pricingResponse.data as
    | RestaurantPricingResponseShape
    | undefined;

  const configuredPricing = pricingResponseData?.restaurants ?? [];

  const pricingMap = new Map<string, RestaurantPricingItem>();

  for (const item of configuredPricing) {
    pricingMap.set(item.restaurantId, item);
  }

  const pricing: RestaurantPricingRow[] = restaurants.map((restaurant) => {
    const configured = pricingMap.get(restaurant.id);

    // ------------------------------------------------------
    // CONFIGURED RESTAURANT
    // ------------------------------------------------------

    if (configured) {
      return {
        restaurantMenuItemId: configured.restaurantMenuItemId ?? null,

        restaurantId: restaurant.id,

        restaurantName: restaurant.name,

        price: Number(configured.price),

        priceDifference: Number(configured.priceDifference ?? 0),

        isAvailable: Boolean(configured.isAvailable),

        isConfigured: true,

        updatedAt: configured.updatedAt,
      };
    }

    // ------------------------------------------------------
    // NOT CONFIGURED
    // ------------------------------------------------------

    return {
      restaurantMenuItemId: null,

      restaurantId: restaurant.id,

      restaurantName: restaurant.name,

      price: Number(loadedItem.basePrice),

      priceDifference: 0,

      isAvailable: loadedItem.isAvailable,

      isConfigured: false,
    };
  });

  return {
    details: loadedItem,
    recipes,
    modifierGroups,
    pricing,
  };
}

// ============================================================
// SECTION
// ============================================================

function Section({
  title,
  description,
  icon: Icon,
  children,
  action,
}: SectionProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70">
      <div className="border-b border-zinc-800 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
              <Icon className="h-4 w-4 text-emerald-400" />
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>

              {description && (
                <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
              )}
            </div>
          </div>

          {action}
        </div>
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
  active,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
}: {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {activeLabel}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-[11px] font-medium text-rose-400">
      <CircleOff className="h-3.5 w-3.5" />
      {inactiveLabel}
    </span>
  );
}

// ============================================================
// INFO ROW
// ============================================================

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-zinc-800/70 py-3 first:pt-0 last:border-b-0 last:pb-0">
      <span className="shrink-0 text-xs text-zinc-500">{label}</span>

      <span
        className={`text-right text-sm font-medium text-zinc-200 ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{
    className?: string;
  }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-10 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
        <Icon className="h-5 w-5 text-zinc-600" />
      </div>

      <p className="text-sm font-medium text-zinc-300">{title}</p>

      <p className="mt-1 max-w-sm text-xs text-zinc-600">{description}</p>
    </div>
  );
}

// ============================================================
// FORMATTERS
// ============================================================

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function MenuItemInformationView({
  menuItem,
  restaurants,
  onBack,
  onRefresh,
}: MenuItemInformationViewProps) {
  const [modifierGroups, setModifierGroups] = useState<ModifierGroupRow[]>([]);

  const [isModifierGroupPopupOpen, setIsModifierGroupPopupOpen] =
    useState(false);

  const [availableModifierGroups, setAvailableModifierGroups] = useState<
    ModifierGroup[]
  >([]);

  const [selectedModifierGroupId, setSelectedModifierGroupId] = useState<
    string | null
  >(null);

  const [modifierGroupSearch, setModifierGroupSearch] = useState("");

  const [isLoadingModifierGroupCatalog, setIsLoadingModifierGroupCatalog] =
    useState(false);

  const [isAssigningModifierGroup, setIsAssigningModifierGroup] =
    useState(false);

  const [removingModifierGroupId, setRemovingModifierGroupId] = useState<
    string | null
  >(null);
  const [details, setDetails] = useState<MenuItem>(menuItem);

  const [recipes, setRecipes] = useState<RecipeRow[]>([]);

  const [pricing, setPricing] = useState<RestaurantPricingRow[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [editingRestaurant, setEditingRestaurant] =
    useState<EditingRestaurantState | null>(null);

  // ==========================================================
  // APPLY LOADED DATA
  // ==========================================================

  const applyLoadedData = (loaded: LoadedMenuItemInformation) => {
    setDetails(loaded.details);

    setRecipes(loaded.recipes);

    setModifierGroups(loaded.modifierGroups);

    setPricing(loaded.pricing);
  };

  // ==========================================================
  // MANUAL LOAD / RETRY
  // ==========================================================

  const loadInformation = async () => {
    try {
      setLoading(true);
      setError(null);

      const loaded = await fetchMenuItemInformation(menuItem.id, restaurants);

      applyLoadedData(loaded);
    } catch (err) {
      console.error("Failed to load menu item information:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load menu item information.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // INITIAL LOAD / ITEM CHANGE
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const loaded = await fetchMenuItemInformation(menuItem.id, restaurants);

        if (cancelled) {
          return;
        }

        applyLoadedData(loaded);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error("Failed to load menu item information:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load menu item information.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [menuItem.id, restaurants]);

  // ==========================================================
  // DERIVED VALUES
  // ==========================================================

  const activeRestaurants = useMemo(
    () => pricing.filter((item) => item.isAvailable).length,
    [pricing],
  );

  const coveredRestaurants = useMemo(
    () => pricing.filter((item) => item.isAvailable).length,
    [pricing],
  );
  const coveragePercentage =
    pricing.length > 0
      ? Math.round((coveredRestaurants / pricing.length) * 100)
      : 0;

  const showingCurrentItem = details.id === menuItem.id;

  const isShowingLoading = loading || !showingCurrentItem;

  // ==========================================================
  // RESTAURANT SAVED
  // ==========================================================

  const handleRestaurantSaved = async () => {
    setEditingRestaurant(null);

    await loadInformation();
    await onRefresh();
  };
  //=========================================================
  // MODIFIER GROUP POPUP
  // ==========================================================
  const openModifierGroupPopup = async () => {
    try {
      setIsLoadingModifierGroupCatalog(true);

      setSelectedModifierGroupId(null);
      setModifierGroupSearch("");

      const groups = await getModifierGroups();

      const assignedIds = new Set(modifierGroups.map((group) => group.id));

      const availableGroups = groups
        .filter((group) => group.isActive)
        .filter((group) => !assignedIds.has(group.id))
        .sort((a, b) => a.sortOrder - b.sortOrder);

      setAvailableModifierGroups(availableGroups);
      setIsModifierGroupPopupOpen(true);
    } catch (error) {
      console.error("Failed to load modifier group catalog:", error);
    } finally {
      setIsLoadingModifierGroupCatalog(false);
    }
  };
  // ==========================================================
  // ASSIGN MODIFIER GROUP
  // ==========================================================

  const handleAssignModifierGroup = async () => {
    if (!selectedModifierGroupId) {
      return;
    }

    try {
      setIsAssigningModifierGroup(true);

      await assignModifierGroupToMenuItem({
        menuItemId: details.id,
        groupId: selectedModifierGroupId,
      });

      const response = await getMenuItemModifierGroups(details.id);

      setModifierGroups(extractItemModifierGroups(response));

      setIsModifierGroupPopupOpen(false);
      setSelectedModifierGroupId(null);
      setModifierGroupSearch("");
    } catch (error) {
      console.error("Failed to assign modifier group:", error);
    } finally {
      setIsAssigningModifierGroup(false);
    }
  };

  // ==========================================================
  // REMOVE MODIFIER GROUP
  // ==========================================================
  const handleRemoveModifierGroup = async (groupId: string) => {
    try {
      setRemovingModifierGroupId(groupId);

      await removeModifierGroupFromMenuItem(details.id, groupId);

      setModifierGroups((current) =>
        current.filter((group) => group.id !== groupId),
      );
    } catch (error) {
      console.error("Failed to remove modifier group:", error);
    } finally {
      setRemovingModifierGroupId(null);
    }
  };

  // ==========================================================
  // LOADING STATE
  // ==========================================================

  if (isShowingLoading) {
    return (
      <div className="space-y-6 p-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Menu Items
        </button>

        <div className="animate-pulse space-y-6">
          <div className="h-28 rounded-2xl border border-zinc-800 bg-zinc-900/60" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-28 rounded-2xl border border-zinc-800 bg-zinc-900/60"
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
            <div className="h-96 rounded-2xl border border-zinc-800 bg-zinc-900/60 xl:col-span-7" />

            <div className="h-96 rounded-2xl border border-zinc-800 bg-zinc-900/60 xl:col-span-5" />
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR STATE
  // ==========================================================

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Menu Items
        </button>

        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8 text-center">
          <XCircle className="mx-auto h-8 w-8 text-rose-400" />

          <h2 className="mt-3 text-sm font-semibold text-zinc-200">
            Failed to load menu item
          </h2>

          <p className="mx-auto mt-1 max-w-md text-xs text-zinc-500">{error}</p>

          <button
            type="button"
            onClick={() => void loadInformation()}
            className="mt-5 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      <div className="animate-fade-in space-y-6 p-6">
        {/* BACK */}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Menu Items"
            className="group inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          </button>

          <span className="text-sm font-medium text-zinc-400">
            Back to Menu Items
          </span>
        </div>

        {/* HEADER */}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70">
          <div className="flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/10 bg-emerald-500/5">
                <Utensils className="h-6 w-6 text-emerald-400" />
              </div>

              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 font-mono text-[10px] font-medium text-zinc-500">
                    {details.sku}
                  </span>

                  <StatusBadge active={details.isAvailable} />

                  <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-500">
                    {details.category?.name ?? "Uncategorized"}
                  </span>
                </div>

                <h1 className="truncate text-2xl font-semibold tracking-tight text-white">
                  {details.name}
                </h1>

                <p className="mt-1 max-w-3xl text-sm text-zinc-500">
                  {details.description || "No description provided."}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                  Last Updated
                </p>

                <p className="mt-1 text-xs font-medium text-zinc-300">
                  {formatDate(details.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* KPI ROW */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* BASE PRICE */}

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Base Price</span>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/10 bg-emerald-500/5">
                <BadgeDollarSign className="h-4 w-4 text-emerald-400" />
              </div>
            </div>

            <p className="mt-4 text-2xl font-semibold text-white">
              {formatCurrency(Number(details.basePrice))}
            </p>

            <p className="mt-1 text-xs text-zinc-600">Central catalog price</p>
          </div>

          {/* RESTAURANT COVERAGE */}

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Restaurant Coverage</span>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-500/10 bg-sky-500/5">
                <Store className="h-4 w-4 text-sky-400" />
              </div>
            </div>

            <p className="mt-4 text-2xl font-semibold text-white">
              {coveredRestaurants}

              <span className="ml-1 text-sm font-normal text-zinc-600">
                / {pricing.length}
              </span>
            </p>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-sky-400 transition-all"
                style={{
                  width: `${coveragePercentage}%`,
                }}
              />
            </div>

            <p className="mt-2 text-xs text-zinc-600">
              {coveragePercentage}% covered
            </p>
          </div>

          {/* RECIPE */}

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Recipe Ingredients</span>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/10 bg-amber-500/5">
                <ChefHat className="h-4 w-4 text-amber-400" />
              </div>
            </div>

            <p className="mt-4 text-2xl font-semibold text-white">
              {recipes.length}
            </p>

            <p className="mt-1 text-xs text-zinc-600">ingredients defined</p>
          </div>

          {/* MODIFIER GROUPS */}

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Modifier Groups</span>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-500/10 bg-violet-500/5">
                <Layers3 className="h-4 w-4 text-violet-400" />
              </div>
            </div>

            <p className="mt-4 text-2xl font-semibold text-white">
              {modifierGroups.length}
            </p>

            <p className="mt-1 text-xs text-zinc-600">groups attached</p>
          </div>
        </div>

        {/* MAIN GRID */}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          {/* LEFT */}

          <div className="space-y-5 xl:col-span-7">
            {/* MASTER INFORMATION */}

            <Section
              title="Master Information"
              description="Central catalog configuration for this menu item."
              icon={ClipboardList}
            >
              <div className="space-y-0">
                <InfoRow label="Menu Item ID" value={details.id} mono />

                <InfoRow label="SKU" value={details.sku} mono />

                <InfoRow
                  label="Category"
                  value={details.category?.name ?? "Uncategorized"}
                />

                <InfoRow
                  label="Base Price"
                  value={formatCurrency(Number(details.basePrice))}
                />

                <InfoRow
                  label="Global Availability"
                  value={<StatusBadge active={details.isAvailable} />}
                />

                <InfoRow
                  label="Created"
                  value={formatDate(details.createdAt)}
                />

                <InfoRow
                  label="Last Updated"
                  value={formatDate(details.updatedAt)}
                />
              </div>

              <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  Description
                </p>

                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {details.description ||
                    "No description has been added for this menu item."}
                </p>
              </div>
            </Section>

            {/* RECIPE */}

            <Section
              title="Recipe"
              description="Ingredients required to prepare this menu item."
              icon={ChefHat}
              action={
                <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-500">
                  {recipes.length} ingredients
                </span>
              }
            >
              {recipes.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="No recipe configured"
                  description="This menu item does not have any recipe ingredients defined yet."
                />
              ) : (
                <div className="overflow-hidden rounded-xl border border-zinc-800">
                  <div className="grid grid-cols-[1fr_120px] border-b border-zinc-800 bg-zinc-900/60 px-4 py-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                      Ingredient
                    </span>

                    <span className="text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                      Quantity
                    </span>
                  </div>

                  <div className="divide-y divide-zinc-800/70">
                    {recipes.map((recipe) => (
                      <div
                        key={recipe.id}
                        className="grid grid-cols-[1fr_120px] items-center px-4 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
                            <Package className="h-3.5 w-3.5 text-zinc-500" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-zinc-300">
                              {recipe.ingredientName}
                            </p>

                            {recipe.ingredientId && (
                              <p className="mt-0.5 font-mono text-[10px] text-zinc-600">
                                {recipe.ingredientId}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-semibold text-zinc-200">
                            {Number(recipe.quantityNeeded)}
                          </p>

                          {recipe.uom && (
                            <p className="text-[10px] uppercase text-zinc-600">
                              {recipe.uom}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          </div>

          {/* RIGHT */}

          <div className="space-y-5 xl:col-span-5">
            {/* RESTAURANT PRICING */}
            <Section
              title="Restaurant Pricing"
              description="Restaurant-level selling price and availability."
              icon={Store}
              action={
                <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-500">
                  {activeRestaurants} active
                </span>
              }
            >
              {pricing.length === 0 ? (
                <EmptyState
                  icon={Store}
                  title="No restaurants found"
                  description="No restaurants are currently available for this organization."
                />
              ) : (
                <div className="space-y-3">
                  {pricing.map((restaurantPricing) => (
                    <div
                      key={restaurantPricing.restaurantId}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium text-zinc-200">
                              {restaurantPricing.restaurantName}
                            </p>

                            {!restaurantPricing.isConfigured && (
                              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-zinc-600">
                                Default
                              </span>
                            )}
                          </div>

                          <p className="mt-1 font-mono text-[10px] text-zinc-600">
                            {restaurantPricing.restaurantId}
                          </p>
                        </div>

                        <StatusBadge
                          active={restaurantPricing.isAvailable}
                          activeLabel="Selling"
                          inactiveLabel="Off"
                        />
                      </div>

                      <div className="mt-4 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                            Selling Price
                          </p>

                          <p className="mt-1 text-lg font-semibold text-white">
                            {formatCurrency(restaurantPricing.price)}
                          </p>

                          <p
                            className={`mt-1 text-[10px] ${
                              restaurantPricing.priceDifference > 0
                                ? "text-amber-400"
                                : restaurantPricing.priceDifference < 0
                                  ? "text-sky-400"
                                  : "text-zinc-600"
                            }`}
                          >
                            {restaurantPricing.priceDifference > 0
                              ? `+${formatCurrency(
                                  restaurantPricing.priceDifference,
                                )} vs base`
                              : restaurantPricing.priceDifference < 0
                                ? `${formatCurrency(
                                    restaurantPricing.priceDifference,
                                  )} vs base`
                                : "Same as base price"}
                          </p>
                        </div>

                        {restaurantPricing.isConfigured &&
                        restaurantPricing.restaurantMenuItemId ? (
                          <button
                            type="button"
                            onClick={() => {
                              const restaurant = restaurants.find(
                                (item) =>
                                  item.id === restaurantPricing.restaurantId,
                              );

                              const restaurantMenuItemId =
                                restaurantPricing.restaurantMenuItemId;

                              if (!restaurant || !restaurantMenuItemId) {
                                console.error(
                                  "Cannot edit restaurant menu item. Configuration is missing.",
                                  {
                                    restaurantId:
                                      restaurantPricing.restaurantId,
                                    restaurantMenuItemId,
                                  },
                                );

                                return;
                              }

                              const configuredPricing: ConfiguredRestaurantPricingRow =
                                {
                                  ...restaurantPricing,
                                  restaurantMenuItemId,
                                };

                              setEditingRestaurant({
                                restaurant,
                                config: configuredPricing,
                              });
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                          </button>
                        ) : (
                          <span className="text-[10px] text-zinc-700">
                            Not configured
                          </span>
                        )}
                      </div>

                      {restaurantPricing.updatedAt && (
                        <p className="mt-3 border-t border-zinc-800 pt-3 text-[10px] text-zinc-600">
                          Updated {formatDate(restaurantPricing.updatedAt)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Section>
            {/* MODIFIER GROUPS */}

            <Section
              title="Modifier Groups"
              description="Modifier groups assigned to this item"
              icon={Layers3}
              action={
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-500">
                    {modifierGroups.length}{" "}
                    {modifierGroups.length === 1 ? "group" : "groups"}
                  </span>

                  <button
                    type="button"
                    onClick={() => void openModifierGroupPopup()}
                    disabled={isLoadingModifierGroupCatalog}
                    className="
          inline-flex
          items-center
          gap-2
          rounded-lg
          border
          border-emerald-500/20
          bg-emerald-500/10
          px-3
          py-2
          text-xs
          font-medium
          text-emerald-300
          transition
          hover:border-emerald-500/30
          hover:bg-emerald-500/15
          disabled:cursor-not-allowed
          disabled:opacity-40
        "
                  >
                    {isLoadingModifierGroupCatalog ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    Add Group
                  </button>
                </div>
              }
            >
              {modifierGroups.length === 0 ? (
                <EmptyState
                  icon={Layers3}
                  title="No modifier groups"
                  description="No modifier groups are attached to this menu item."
                />
              ) : (
                <div className="space-y-4">
                  {modifierGroups.map((group) => (
                    <div
                      key={group.id}
                      className="
            overflow-hidden
            rounded-xl
            border
            border-zinc-800
            bg-zinc-900/30
          "
                    >
                      {/* GROUP HEADER */}
                      <div
                        className="
              flex
              items-center
              justify-between
              gap-4
              border-b
              border-zinc-800
              bg-zinc-900/50
              px-4
              py-4
            "
                      >
                        {/* LEFT */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-sm font-semibold text-zinc-100">
                              {group.name}
                            </h3>

                            <StatusBadge active={group.isActive} />
                          </div>

                          <p className="mt-1 text-[10px] text-zinc-600">
                            {group.modifiers.length}{" "}
                            {group.modifiers.length === 1
                              ? "option"
                              : "options"}
                          </p>
                        </div>

                        {/* RIGHT */}
                        <div className="flex shrink-0 items-center gap-4">
                          <div className="text-right">
                            <p className="text-[9px] uppercase tracking-wider text-zinc-600">
                              Selection
                            </p>

                            <p className="mt-1 text-xs font-semibold text-zinc-300">
                              {group.minSelections}–{group.maxSelections}
                            </p>
                          </div>

                          <button
                            type="button"
                            title="Remove modifier group"
                            aria-label={`Remove ${group.name} from this menu item`}
                            onClick={() =>
                              void handleRemoveModifierGroup(group.id)
                            }
                            disabled={removingModifierGroupId === group.id}
                            className="
    flex
    h-8
    w-8
    shrink-0
    items-center
    justify-center
    rounded-lg
    border
    border-rose-500/15
    bg-rose-500/5
    text-rose-400
    transition-all
    duration-200
    hover:border-rose-500/40
    hover:bg-rose-500/15
    hover:text-rose-300
    hover:shadow-[0_0_16px_rgba(244,63,94,0.18)]
    active:scale-95
    disabled:cursor-not-allowed
    disabled:opacity-40
  "
                          >
                            {removingModifierGroupId === group.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Unlink2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* GROUP DETAILS */}
                      <div className="px-4 py-4">
                        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
                            <p className="text-[9px] uppercase tracking-wider text-zinc-600">
                              Min
                            </p>

                            <p className="mt-1 text-sm font-semibold text-zinc-200">
                              {group.minSelections}
                            </p>
                          </div>

                          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
                            <p className="text-[9px] uppercase tracking-wider text-zinc-600">
                              Max
                            </p>

                            <p className="mt-1 text-sm font-semibold text-zinc-200">
                              {group.maxSelections}
                            </p>
                          </div>

                          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
                            <p className="text-[9px] uppercase tracking-wider text-zinc-600">
                              Options
                            </p>

                            <p className="mt-1 text-sm font-semibold text-zinc-200">
                              {group.modifiers.length}
                            </p>
                          </div>

                          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
                            <p className="text-[9px] uppercase tracking-wider text-zinc-600">
                              Status
                            </p>

                            <p className="mt-1 text-sm font-semibold text-zinc-200">
                              {group.isActive ? "Active" : "Inactive"}
                            </p>
                          </div>
                        </div>

                        {/* MODIFIERS */}
                        {group.modifiers.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-zinc-800 px-4 py-5 text-center">
                            <p className="text-xs text-zinc-600">
                              No modifiers configured in this group.
                            </p>
                          </div>
                        ) : (
                          <div className="overflow-hidden rounded-lg border border-zinc-800">
                            <div className="grid grid-cols-[1fr_110px_90px] border-b border-zinc-800 bg-zinc-900/60 px-4 py-3">
                              <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">
                                Modifier
                              </span>

                              <span className="text-right text-[9px] font-semibold uppercase tracking-wider text-zinc-600">
                                Extra Price
                              </span>

                              <span className="text-right text-[9px] font-semibold uppercase tracking-wider text-zinc-600">
                                Status
                              </span>
                            </div>

                            <div className="divide-y divide-zinc-800/70">
                              {group.modifiers.map((modifier) => (
                                <div
                                  key={modifier.id}
                                  className="grid grid-cols-[1fr_110px_90px] items-center px-4 py-3"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-zinc-300">
                                      {modifier.name}
                                    </p>

                                    <p className="mt-0.5 font-mono text-[9px] text-zinc-600">
                                      {modifier.id}
                                    </p>
                                  </div>

                                  <div className="text-right">
                                    <p className="text-xs font-medium text-zinc-300">
                                      {Number(modifier.extraPrice) > 0
                                        ? `+${formatCurrency(
                                            Number(modifier.extraPrice),
                                          )}`
                                        : "Included"}
                                    </p>
                                  </div>

                                  <div className="text-right">
                                    <p
                                      className={`text-[9px] ${
                                        modifier.isActive
                                          ? "text-emerald-400"
                                          : "text-rose-400"
                                      }`}
                                    >
                                      {modifier.isActive
                                        ? "Active"
                                        : "Inactive"}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        </div>
      </div>

      {/* RESTAURANT EDIT DRAWER */}

      {editingRestaurant && (
        <RestaurantMenuEditDrawer
          menuItem={{
            id: details.id,
            name: details.name,
          }}
          restaurant={editingRestaurant.restaurant}
          config={{
            restaurantMenuItemId: editingRestaurant.config.restaurantMenuItemId,
          }}
          initialPrice={editingRestaurant.config.price}
          initialIsAvailable={editingRestaurant.config.isAvailable}
          onClose={() => setEditingRestaurant(null)}
          onSaved={handleRestaurantSaved}
        />
      )}
      <AddModifierGroupPopup
        isOpen={isModifierGroupPopupOpen}
        groups={availableModifierGroups}
        selectedGroupId={selectedModifierGroupId}
        searchTerm={modifierGroupSearch}
        isSubmitting={isAssigningModifierGroup}
        onSearchChange={setModifierGroupSearch}
        onSelect={setSelectedModifierGroupId}
        onAdd={() => void handleAssignModifierGroup()}
        onClose={() => {
          if (!isAssigningModifierGroup) {
            setIsModifierGroupPopupOpen(false);
            setSelectedModifierGroupId(null);
            setModifierGroupSearch("");
          }
        }}
      />
    </>
  );
}
