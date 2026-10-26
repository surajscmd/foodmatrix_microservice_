"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { ClipboardList, Database, Loader2, X } from "lucide-react";

import type {
  CreateMenuItemPayload,
  MenuCategory,
  MenuItem,
} from "@/lib/catalog-api";

interface AddMenuItemDrawerProps {
  isOpen: boolean;
  categories: MenuCategory[];
  menuItem?: MenuItem | null;
  onClose: () => void;
  onSubmit: (data: CreateMenuItemPayload) => Promise<void>;
}

// Detect browser mounting without a state update inside useEffect.
const subscribeToNothing = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function AddMenuItemDrawer({
  isOpen,
  categories,
  menuItem = null,
  onClose,
  onSubmit,
}: AddMenuItemDrawerProps) {
  const [name, setName] = useState(menuItem?.name ?? "");
  const [sku, setSku] = useState(menuItem?.sku ?? "");
  const [categoryId, setCategoryId] = useState(menuItem?.categoryId ?? "");
  const [description, setDescription] = useState(menuItem?.description ?? "");

  const [basePrice, setBasePrice] = useState(
    menuItem ? String(menuItem.basePrice) : "",
  );

  const [isAvailable, setIsAvailable] = useState(
    menuItem?.isAvailable ?? true,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isMounted = useSyncExternalStore(
    subscribeToNothing,
    getClientSnapshot,
    getServerSnapshot,
  );

  const isEditMode = Boolean(menuItem);
  const effectiveCategoryId = categoryId || categories[0]?.id || "";

  // ==========================================================
  // RESET FORM
  // ==========================================================

  const resetForm = () => {
    setName(menuItem?.name ?? "");
    setSku(menuItem?.sku ?? "");
    setCategoryId(menuItem?.categoryId ?? "");
    setDescription(menuItem?.description ?? "");
    setBasePrice(menuItem ? String(menuItem.basePrice) : "");
    setIsAvailable(menuItem?.isAvailable ?? true);
    setFormError(null);
  };

  // ==========================================================
  // CLOSE DRAWER
  // ==========================================================

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    resetForm();
    onClose();
  };

  // ==========================================================
  // SUBMIT FORM
  // ==========================================================

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedSku = sku.trim();
    const trimmedDescription = description.trim();
    const parsedPrice = Number(basePrice);

    if (!trimmedName) {
      setFormError("Menu item name is required.");
      return;
    }

    if (!trimmedSku) {
      setFormError("SKU is required.");
      return;
    }

    if (!effectiveCategoryId) {
      setFormError("Please select a menu category.");
      return;
    }

    if (
      basePrice.trim() === "" ||
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 0
    ) {
      setFormError("Please enter a valid base price.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      await onSubmit({
        name: trimmedName,
        sku: trimmedSku,
        categoryId: effectiveCategoryId,
        description: trimmedDescription || undefined,
        basePrice: parsedPrice,
        isAvailable,
      });

      resetForm();
      onClose();
    } catch (error) {
      console.error("Menu item submission failed:", error);

      setFormError(
        error instanceof Error
          ? error.message
          : isEditMode
            ? "Unable to update menu item."
            : "Unable to create menu item.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !isMounted) {
    return null;
  }

  // ==========================================================
  // DRAWER PORTAL
  // ==========================================================

  return createPortal(
    <div className="fixed inset-0 z-[10000] isolate flex justify-end bg-zinc-950/65 backdrop-blur-md">
      {/* FULL-SCREEN OVERLAY */}

      <button
        type="button"
        aria-label="Close menu item drawer"
        onClick={handleClose}
        disabled={isSubmitting}
        className="absolute inset-0 z-0 h-full w-full cursor-default disabled:cursor-not-allowed"
      />

      {/* DRAWER */}

      <div className="animate-slide-in-right relative z-10 flex h-dvh max-h-dvh w-full max-w-md flex-col overflow-y-auto border-l border-zinc-800 bg-[#0c0c0e] p-6 shadow-2xl">
        {/* HEADER */}

        <div className="mb-6 flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-emerald-400" />

            <div>
              <h3 className="text-sm font-bold text-white">
                {isEditMode ? "Edit Menu Item" : "Deploy Menu Item"}
              </h3>

              <p className="font-mono text-[10px] text-zinc-400">
                {isEditMode
                  ? "MASTER CATALOG UPDATE"
                  : "MENU CATALOG REGISTRATION"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close drawer"
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ERROR */}

        {formError && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-rose-500/10 bg-rose-500/5 p-3 text-xs text-rose-300"
          >
            {formError}
          </div>
        )}

        {/* FORM */}

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
          {/* MENU ITEM NAME */}

          <div className="space-y-1.5">
            <label
              htmlFor="input-menu-item-name"
              className="font-mono text-[11px] uppercase tracking-wider text-zinc-400"
            >
              Menu Item Name
            </label>

            <input
              id="input-menu-item-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Chicken Biryani"
              required
              disabled={isSubmitting}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white outline-none transition placeholder:text-zinc-700 focus:border-emerald-500/50 disabled:opacity-50"
            />
          </div>

          {/* SKU */}

          <div className="space-y-1.5">
            <label
              htmlFor="input-menu-item-sku"
              className="font-mono text-[11px] uppercase tracking-wider text-zinc-400"
            >
              SKU
            </label>

            <input
              id="input-menu-item-sku"
              type="text"
              value={sku}
              onChange={(event) => setSku(event.target.value)}
              placeholder="e.g. BIRYANI-001"
              required
              disabled={isSubmitting}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white outline-none transition placeholder:text-zinc-700 focus:border-emerald-500/50 disabled:opacity-50"
            />
          </div>

          {/* CATEGORY */}

          <div className="space-y-1.5">
            <label
              htmlFor="input-menu-item-category"
              className="font-mono text-[11px] uppercase tracking-wider text-zinc-400"
            >
              Menu Category
            </label>

            <select
              id="input-menu-item-category"
              value={effectiveCategoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              required
              disabled={categories.length === 0 || isSubmitting}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white outline-none transition focus:border-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">
                {categories.length === 0
                  ? "No categories available"
                  : "Select category"}
              </option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* BASE PRICE */}

          <div className="space-y-1.5">
            <label
              htmlFor="input-menu-item-price"
              className="font-mono text-[11px] uppercase tracking-wider text-zinc-400"
            >
              Base Price (INR)
            </label>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                ₹
              </span>

              <input
                id="input-menu-item-price"
                type="number"
                value={basePrice}
                onChange={(event) => setBasePrice(event.target.value)}
                placeholder="249.00"
                min="0"
                step="0.01"
                required
                disabled={isSubmitting}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2 pl-7 pr-3 text-xs text-white outline-none transition placeholder:text-zinc-700 focus:border-emerald-500/50 disabled:opacity-50"
              />
            </div>
          </div>

          {/* DESCRIPTION */}

          <div className="space-y-1.5">
            <label
              htmlFor="input-menu-item-description"
              className="font-mono text-[11px] uppercase tracking-wider text-zinc-400"
            >
              Description
            </label>

            <textarea
              id="input-menu-item-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the menu item..."
              rows={3}
              disabled={isSubmitting}
              className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white outline-none transition placeholder:text-zinc-700 focus:border-emerald-500/50 disabled:opacity-50"
            />
          </div>

          {/* MASTER AVAILABILITY */}

          <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div>
              <p className="text-xs font-semibold text-white">Master Active</p>

              <p className="mt-1 text-[10px] text-zinc-500">
                Global catalog availability
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isAvailable}
              aria-label="Master catalog availability"
              disabled={isSubmitting}
              onClick={() => setIsAvailable((current) => !current)}
              className={`relative h-6 w-11 rounded-full transition disabled:opacity-50 ${
                isAvailable ? "bg-emerald-500" : "bg-zinc-700"
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                  isAvailable ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* CATALOG INFORMATION */}

          <div className="mt-2 space-y-2 rounded-xl border border-zinc-800/80 bg-zinc-950 p-4 text-[11px] text-zinc-400">
            <div className="flex justify-between font-mono text-[9px] uppercase text-zinc-500">
              <span>{isEditMode ? "CATALOG UPDATE" : "REGISTRATION"}</span>

              <span>CATALOG SERVICE</span>
            </div>

            <div className="flex items-center gap-2 font-semibold text-white">
              <Database className="h-3.5 w-3.5 shrink-0 text-emerald-400" />

              <span>
                {isEditMode
                  ? "Updates the master menu item."
                  : "Registers a new master menu item."}
              </span>
            </div>

            <p className="leading-relaxed text-zinc-500">
              Menu item identity, category, base price, and availability are
              managed in the Operations master catalog. Restaurant-specific
              pricing and availability are configured separately.
            </p>
          </div>

          {/* FOOTER ACTIONS */}

          <div className="mt-auto flex gap-3 border-t border-zinc-800 pt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || categories.length === 0}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2 text-xs font-semibold text-zinc-950 shadow-lg transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {isEditMode ? "Saving..." : "Creating..."}
                </>
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Launch Item"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}