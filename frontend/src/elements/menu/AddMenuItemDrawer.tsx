"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { ClipboardList, X } from "lucide-react";

import type { CreateMenuItemPayload, MenuCategory } from "@/lib/catalog-api";

// ============================================================
// PROPS
// ============================================================

interface AddMenuItemDrawerProps {
  isOpen: boolean;

  categories: MenuCategory[];

  onClose: () => void;

  onSubmit: (data: CreateMenuItemPayload) => Promise<void>;
}

// ============================================================
// COMPONENT
// ============================================================

export default function AddMenuItemDrawer({
  isOpen,
  categories,
  onClose,
  onSubmit,
}: AddMenuItemDrawerProps) {
  const [name, setName] = useState("");

  const [sku, setSku] = useState("");

  const [categoryId, setCategoryId] = useState("");

  const [description, setDescription] = useState("");

  const [basePrice, setBasePrice] = useState("");

  const [isAvailable, setIsAvailable] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // ==========================================================
  // EFFECTIVE CATEGORY
  //
  // We do NOT call setCategoryId inside an effect.
  // ==========================================================

  const effectiveCategoryId = categoryId || categories[0]?.id || "";

  // ==========================================================
  // RESET FORM
  // ==========================================================

  const resetForm = () => {
    setName("");
    setSku("");
    setCategoryId("");
    setDescription("");
    setBasePrice("");
    setIsAvailable(true);
    setError(null);
  };

  // ==========================================================
  // CLOSE
  // ==========================================================

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    resetForm();
    onClose();
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Clear previous validation/API error.
    setError(null);

    // --------------------------------------------------------
    // NAME
    // --------------------------------------------------------

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Menu item name is required.");
      return;
    }

    // --------------------------------------------------------
    // SKU
    // --------------------------------------------------------

    const trimmedSku = sku.trim();

    if (!trimmedSku) {
      setError("SKU is required.");
      return;
    }

    // --------------------------------------------------------
    // CATEGORY
    // --------------------------------------------------------

    if (!effectiveCategoryId) {
      setError("Please select a category.");
      return;
    }

    // --------------------------------------------------------
    // PRICE
    // --------------------------------------------------------

    const parsedPrice = Number(basePrice);

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError("Please enter a valid base price.");
      return;
    }

    // --------------------------------------------------------
    // API REQUEST
    // --------------------------------------------------------

    try {
      setIsSubmitting(true);

      await onSubmit({
        name: trimmedName,
        sku: trimmedSku,
        categoryId: effectiveCategoryId,
        description: description.trim() || undefined,
        basePrice: parsedPrice,
        isAvailable,
      });

      // Reset only after successful creation.
      resetForm();

      onClose();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to create menu item.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================
  // CLOSED
  // ==========================================================

  if (!isOpen) {
    return null;
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* ====================================================
          BACKDROP
      ==================================================== */}

      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* ====================================================
          DRAWER
      ==================================================== */}

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-zinc-800 bg-[#09090b] shadow-2xl">
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <ClipboardList className="h-4 w-4 text-emerald-400" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-white">Deploy Menu Item</h2>

              <p className="mt-1 font-mono text-[10px] text-zinc-600">
                MASTER CATALOG
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ==================================================
            FORM
        ================================================== */}

        <form
          onSubmit={handleSubmit}
          className="flex-1 space-y-5 overflow-y-auto p-6"
        >
          {/* =================================================
              NAME
          ================================================= */}

          <Field
            label="MENU ITEM NAME"
            value={name}
            onChange={setName}
            placeholder="Chicken Biryani"
          />

          {/* =================================================
              SKU
          ================================================= */}

          <Field
            label="SKU"
            value={sku}
            onChange={setSku}
            placeholder="BIRYANI-001"
          />

          {/* =================================================
              CATEGORY
          ================================================= */}

          <div>
            <label className="mb-2 block text-[10px] font-mono font-bold text-zinc-500">
              CATEGORY
            </label>

            <select
              value={effectiveCategoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              disabled={categories.length === 0 || isSubmitting}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs text-white outline-none transition focus:border-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50"
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

          {/* =================================================
              BASE PRICE
          ================================================= */}

          <Field
            label="BASE PRICE"
            value={basePrice}
            onChange={setBasePrice}
            placeholder="249.00"
            type="number"
          />

          {/* =================================================
              DESCRIPTION
          ================================================= */}

          <div>
            <label className="mb-2 block text-[10px] font-mono font-bold text-zinc-500">
              DESCRIPTION
            </label>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={isSubmitting}
              rows={4}
              placeholder="Describe the menu item..."
              className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs text-white outline-none transition placeholder:text-zinc-700 focus:border-emerald-500/50 disabled:opacity-50"
            />
          </div>

          {/* =================================================
              MASTER AVAILABILITY
          ================================================= */}

          <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div>
              <p className="text-xs font-semibold text-white">Master Active</p>

              <p className="mt-1 text-[10px] text-zinc-600">
                Global catalog availability
              </p>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsAvailable((current) => !current)}
              className={`relative h-6 w-11 rounded-full transition ${
                isAvailable ? "bg-emerald-500" : "bg-zinc-700"
              } disabled:opacity-50`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                  isAvailable ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
              <p className="text-xs leading-relaxed text-rose-400">{error}</p>
            </div>
          )}

          {/* =================================================
              SUBMIT
          ================================================= */}

          <button
            type="submit"
            disabled={isSubmitting || categories.length === 0}
            className="w-full rounded-xl bg-emerald-500 py-3 text-xs font-bold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "CREATING..." : "CREATE MENU ITEM"}
          </button>
        </form>
      </aside>
    </div>,
    document.body,
  );
}

// ============================================================
// FIELD
// ============================================================

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-mono font-bold text-zinc-500">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.01" : undefined}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs text-white outline-none transition placeholder:text-zinc-700 focus:border-emerald-500/50"
      />
    </div>
  );
}
