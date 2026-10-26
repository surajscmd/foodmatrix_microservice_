"use client";

import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  Loader2,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Tags,
  X,
} from "lucide-react";

import {
  createMenuCategory,
  deactivateMenuCategory,
  getMenuCategories,
  getMenuCategoryById,
  updateMenuCategory,
} from "@/lib/catalog-api";

import type {
  CreateMenuCategoryPayload,
  MenuCategory,
} from "@/lib/catalog-api";

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChanged?: () => void;
}

interface CategoryForm {
  name: string;
  sortOrder: string;
  isActive: boolean;
}

const EMPTY_FORM: CategoryForm = {
  name: "",
  sortOrder: "0",
  isActive: true,
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export default function CategoryManagerModal({
  isOpen,
  onClose,
  onCategoriesChanged,
}: CategoryManagerModalProps) {
  // ============================================================
  // STATE
  // ============================================================

  const [categories, setCategories] = useState<MenuCategory[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const [loadingCategoryId, setLoadingCategoryId] = useState<string | null>(
    null,
  );

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);

  const [error, setError] = useState<string | null>(null);

  const isEditing = editingCategoryId !== null;

  // ============================================================
  // LOAD CATEGORIES
  // ============================================================

  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await getMenuCategories();

      setCategories(response.data ?? []);
    } catch (err) {
      console.error("Failed to load categories:", err);

      setError(getErrorMessage(err, "Failed to load menu categories."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================================
  // LOAD WHEN MODAL OPENS
  //
  // Deferred intentionally so React does not treat the state
  // updates as synchronous updates directly inside the effect.
  // ============================================================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadCategories();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isOpen, loadCategories]);

  // ============================================================
  // BODY SCROLL LOCK
  // ============================================================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // ============================================================
  // ESC KEY
  // ============================================================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (isSaving || loadingCategoryId !== null) {
        return;
      }

      setEditingCategoryId(null);
      setIsFormOpen(false);
      setForm(EMPTY_FORM);
      setError(null);

      onClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isSaving, loadingCategoryId, onClose]);

  // ============================================================
  // CLOSE
  // ============================================================

  const handleClose = () => {
    if (isSaving || loadingCategoryId !== null) {
      return;
    }

    setEditingCategoryId(null);
    setIsFormOpen(false);
    setForm(EMPTY_FORM);
    setError(null);

    onClose();
  };

  // ============================================================
  // RESET FORM
  // ============================================================

  const resetForm = () => {
    setEditingCategoryId(null);
    setIsFormOpen(false);
    setForm(EMPTY_FORM);
    setError(null);
  };

  // ============================================================
  // OPEN CREATE
  // ============================================================

  const handleOpenCreate = () => {
    if (isSaving || loadingCategoryId !== null) {
      return;
    }

    setError(null);
    setEditingCategoryId(null);

    setForm({
      name: "",
      sortOrder: "0",
      isActive: true,
    });

    setIsFormOpen(true);
  };

  // ============================================================
  // EDIT CATEGORY
  // ============================================================

  const handleEdit = async (categoryId: string) => {
    if (isSaving || loadingCategoryId !== null) {
      return;
    }

    try {
      setLoadingCategoryId(categoryId);
      setError(null);

      const response = await getMenuCategoryById(categoryId);

      const category = response.data;

      setEditingCategoryId(category.id);

      setForm({
        name: category.name,
        sortOrder: String(category.sortOrder ?? 0),
        isActive: category.isActive,
      });

      setIsFormOpen(true);
    } catch (err) {
      console.error("Failed to load category:", err);

      setError(getErrorMessage(err, "Failed to load category details."));
    } finally {
      setLoadingCategoryId(null);
    }
  };

  // ============================================================
  // FORM CHANGE
  // ============================================================

  const updateForm = (field: keyof CategoryForm, value: string | boolean) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) {
      setError(null);
    }
  };

  // ============================================================
  // CREATE / UPDATE
  // ============================================================

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name.trim();

    if (!name) {
      setError("Category name is required.");
      return;
    }

    const sortOrder = Number(form.sortOrder);

    if (!Number.isFinite(sortOrder) || sortOrder < 0) {
      setError("Sort order must be a valid non-negative number.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      if (editingCategoryId) {
        await updateMenuCategory(editingCategoryId, {
          name,
          sortOrder,
          isActive: form.isActive,
        });
      } else {
        const payload: CreateMenuCategoryPayload = {
          name,
          sortOrder,
          isActive: form.isActive,
        };

        await createMenuCategory(payload);
      }

      resetForm();

      await loadCategories();

      onCategoriesChanged?.();
    } catch (err) {
      console.error("Failed to save category:", err);

      setError(getErrorMessage(err, "Failed to save category."));
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================
  // ACTIVATE / DEACTIVATE
  // ============================================================

  const handleToggleStatus = async (category: MenuCategory) => {
    if (isSaving || loadingCategoryId !== null) {
      return;
    }

    try {
      setLoadingCategoryId(category.id);
      setError(null);

      if (category.isActive) {
        await deactivateMenuCategory(category.id);
      } else {
        await updateMenuCategory(category.id, {
          isActive: true,
        });
      }

      if (editingCategoryId === category.id) {
        setForm((current) => ({
          ...current,
          isActive: !category.isActive,
        }));
      }

      await loadCategories();

      onCategoriesChanged?.();
    } catch (err) {
      console.error("Failed to update category status:", err);

      setError(getErrorMessage(err, "Failed to update category status."));
    } finally {
      setLoadingCategoryId(null);
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
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-manager-title"
    >
      {/* ======================================================
          BACKDROP
      ====================================================== */}

      <button
        type="button"
        aria-label="Close category manager"
        onClick={handleClose}
        disabled={isSaving || loadingCategoryId !== null}
        className="absolute inset-0 cursor-default bg-black/65 backdrop-blur-md disabled:cursor-default"
      />

      {/* ======================================================
          MODAL
      ====================================================== */}

      <div className="relative flex h-[min(820px,calc(100vh-2rem))] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-zinc-800/90 bg-gradient-to-br from-[#0d1117] via-[#090b0f] to-[#07090c] shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
        {/* ====================================================
            AMBIENT BACKGROUND
        ==================================================== */}
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

              <Tags className="relative h-5 w-5 text-emerald-300" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                  Catalog
                </span>

                <span className="text-zinc-800">/</span>

                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-cyan-400/80">
                  Categories
                </span>
              </div>

              <div className="mt-1 flex items-center gap-2">
                <h2
                  id="category-manager-title"
                  className="text-sm font-bold text-white"
                >
                  Category Manager
                </h2>

                <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 font-mono text-[9px] font-bold text-cyan-400">
                  {categories.length}
                </span>
              </div>

              <p className="mt-1 text-[10px] text-zinc-600">
                Manage master menu categories across the catalog.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving || loadingCategoryId !== null}
            className="group flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-500 transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
          </button>
        </div>

        {/* ====================================================
            CONTENT
        ==================================================== */}

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_360px]">
          {/* ==================================================
              LEFT — CATEGORY LIST
          ================================================== */}

          <section className="min-h-0 overflow-y-auto border-b border-zinc-800 lg:border-b-0 lg:border-r">
            {/* LIST HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800/80 bg-[#090b0f]/95 px-5 py-3 backdrop-blur">
              <div>
                <p className="text-xs font-bold text-zinc-200">Categories</p>

                <p className="mt-0.5 text-[10px] text-zinc-600">
                  {categories.length} configured
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadCategories()}
                disabled={isLoading || isSaving || loadingCategoryId !== null}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-[10px] font-bold text-zinc-400 transition hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>

            {/* ERROR */}

            {error && (
              <div className="mx-5 mt-4 rounded-xl border border-red-500/15 bg-red-500/5 px-3 py-2.5">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* LOADING */}

            {isLoading ? (
              <div className="flex min-h-[350px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                  </div>

                  <p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
                    Loading categories...
                  </p>
                </div>
              </div>
            ) : categories.length === 0 ? (
              /* EMPTY */
              <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-violet-500/5 to-emerald-500/10 shadow-[0_0_30px_rgba(34,211,238,0.05)]">
                  <Tags className="h-5 w-5 text-cyan-300" />
                </div>

                <p className="mt-5 text-sm font-semibold text-zinc-300">
                  No categories
                </p>

                <p className="mt-2 max-w-xs text-xs leading-5 text-zinc-600">
                  Create your first master menu category using the panel on the
                  right.
                </p>

                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 px-4 py-2.5 text-xs font-bold text-emerald-300 transition hover:border-emerald-400/35 hover:from-emerald-500/15 hover:to-cyan-500/15"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Category
                </button>
              </div>
            ) : (
              /* CATEGORY ROWS */
              <div className="divide-y divide-zinc-900/80">
                {categories
                  .slice()
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((category) => {
                    const isSelected = editingCategoryId === category.id;

                    return (
                      <div
                        key={category.id}
                        className={`group flex items-center gap-3 px-5 py-4 transition-all duration-200 ${
                          isSelected
                            ? "bg-gradient-to-r from-emerald-500/[0.08] via-cyan-500/[0.035] to-transparent"
                            : "hover:bg-gradient-to-r hover:from-cyan-500/[0.025] hover:via-emerald-500/[0.02] hover:to-transparent"
                        }`}
                      >
                        {/* SORT ORDER */}

                        <div className="w-9 shrink-0 text-center">
                          <span
                            className={`font-mono text-[10px] font-bold ${
                              isSelected ? "text-emerald-400" : "text-zinc-600"
                            }`}
                          >
                            #{category.sortOrder}
                          </span>
                        </div>

                        {/* DETAILS */}

                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-2">
                            <p className="truncate text-xs font-bold text-zinc-200 transition group-hover:text-white">
                              {category.name}
                            </p>

                            {/* STATUS */}

                            <span
                              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                                category.isActive
                                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                  : "border-red-500/20 bg-red-500/10 text-red-400"
                              }`}
                            >
                              <span
                                className={`relative h-1.5 w-1.5 rounded-full ${
                                  category.isActive
                                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
                                    : "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.7)]"
                                }`}
                              >
                                <span
                                  className={`absolute inset-0 animate-ping rounded-full opacity-75 ${
                                    category.isActive
                                      ? "bg-emerald-400"
                                      : "bg-red-400"
                                  }`}
                                />
                              </span>

                              {category.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>

                          <p className="mt-1 truncate font-mono text-[9px] text-zinc-700">
                            {category.id}
                          </p>
                        </div>

                        {/* ACTIONS */}

                        <div className="flex shrink-0 items-center gap-3">
                          <button
                            type="button"
                            onClick={() => void handleEdit(category.id)}
                            disabled={isSaving || loadingCategoryId !== null}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 shadow-sm transition hover:border-cyan-400/40 hover:bg-cyan-500/20 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                            title="Edit category"
                          >
                            {loadingCategoryId === category.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Pencil className="h-3.5 w-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleToggleStatus(category)}
                            disabled={isSaving || loadingCategoryId !== null}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                              category.isActive
                                ? "border-rose-500/20 bg-rose-500/10 text-rose-400 hover:border-rose-400/40 hover:bg-rose-500/20 hover:text-rose-300"
                                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:border-emerald-400/40 hover:bg-emerald-500/20 hover:text-emerald-300"
                            }`}
                            title={
                              category.isActive
                                ? "Deactivate category"
                                : "Activate category"
                            }
                          >
                            {loadingCategoryId === category.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Power className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </section>

          {/* ==================================================
              RIGHT — FORM / EMPTY STATE
          ================================================== */}

          <section className="relative min-h-0 overflow-y-auto border-l border-zinc-800/60 bg-gradient-to-b from-violet-950/[0.08] via-zinc-950/20 to-cyan-950/[0.05]">
            {/* Ambient glow */}

            <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-violet-500/[0.05] blur-3xl" />

            <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 rounded-full bg-cyan-500/[0.04] blur-3xl" />

            {isFormOpen ? (
              /* ==================================================
                 FORM
              ================================================== */
              <div className="relative p-5">
                {/* FORM HEADER */}

                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isEditing
                            ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.65)]"
                            : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.65)]"
                        }`}
                      />

                      <p className="text-xs font-bold text-zinc-200">
                        {isEditing ? "Edit Category" : "Add Category"}
                      </p>
                    </div>

                    <p className="mt-1 pl-3.5 text-[10px] leading-relaxed text-zinc-500">
                      {isEditing
                        ? "Update the selected category configuration."
                        : "Create a new category for the master menu catalog."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={isSaving}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-600 transition hover:bg-zinc-800 hover:text-white disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* FORM */}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* CATEGORY NAME */}

                  <div>
                    <label
                      htmlFor="category-name"
                      className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-500"
                    >
                      Category Name
                    </label>

                    <input
                      id="category-name"
                      type="text"
                      value={form.name}
                      onChange={(event) =>
                        updateForm("name", event.target.value)
                      }
                      placeholder="e.g. Breakfast"
                      disabled={isSaving}
                      autoFocus
                      className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 text-xs text-zinc-200 outline-none transition placeholder:text-zinc-700 focus:border-cyan-500/40 focus:bg-cyan-500/[0.02] focus:shadow-[0_0_22px_rgba(34,211,238,0.05)] disabled:opacity-60"
                    />
                  </div>

                  {/* SORT ORDER */}

                  <div>
                    <label
                      htmlFor="category-sort-order"
                      className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-500"
                    >
                      Sort Order
                    </label>

                    <input
                      id="category-sort-order"
                      type="number"
                      min="0"
                      value={form.sortOrder}
                      onChange={(event) =>
                        updateForm("sortOrder", event.target.value)
                      }
                      disabled={isSaving}
                      className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 font-mono text-xs text-zinc-200 outline-none transition focus:border-violet-500/40 focus:bg-violet-500/[0.02] focus:shadow-[0_0_22px_rgba(139,92,246,0.05)] disabled:opacity-60"
                    />

                    <p className="mt-2 text-[10px] text-zinc-700">
                      Lower numbers appear first.
                    </p>
                  </div>

                  {/* STATUS */}

                  <div className="rounded-2xl border border-cyan-500/10 bg-gradient-to-br from-cyan-500/[0.04] via-zinc-950/40 to-emerald-500/[0.03] p-4 shadow-[0_10px_35px_rgba(0,0,0,0.18)]">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              form.isActive
                                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                                : "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.65)]"
                            }`}
                          />

                          <p className="text-xs font-semibold text-zinc-300">
                            Active
                          </p>
                        </div>

                        <p className="mt-1 pl-3.5 text-[10px] leading-5 text-zinc-600">
                          Category is available in the master catalog.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => updateForm("isActive", !form.isActive)}
                        disabled={isSaving}
                        aria-label="Toggle category active status"
                        className={`relative h-6 w-11 rounded-full border transition-all duration-200 ${
                          form.isActive
                            ? "border-emerald-400/40 bg-gradient-to-r from-emerald-500/25 to-cyan-500/20 shadow-[0_0_16px_rgba(52,211,153,0.08)]"
                            : "border-red-500/20 bg-red-500/10"
                        }`}
                      >
                        <span
                          className={`absolute top-1 h-4 w-4 rounded-full shadow-sm transition-all duration-200 ${
                            form.isActive
                              ? "left-6 bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.7)]"
                              : "left-1 bg-red-300 shadow-[0_0_8px_rgba(248,113,113,0.5)]"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* ERROR */}

                  {error && (
                    <div className="rounded-xl border border-red-500/15 bg-red-500/5 px-3 py-2.5">
                      <p className="text-xs text-red-400">{error}</p>
                    </div>
                  )}

                  {/* ACTIONS */}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={isSaving}
                      className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs font-bold text-zinc-400 transition hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSaving || loadingCategoryId !== null}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-gradient-to-r from-emerald-500/90 to-cyan-500/80 px-4 py-2.5 text-xs font-bold text-zinc-950 shadow-[0_8px_24px_rgba(52,211,153,0.12)] transition hover:from-emerald-400 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : isEditing ? (
                        <>
                          <Check className="h-4 w-4" />
                          Save Changes
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Create Category
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* ==================================================
                 EMPTY FORM STATE
              ================================================== */
              <div className="flex h-full items-center justify-center p-8">
                <div className="max-w-[250px] text-center">
                  <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-cyan-500/5 to-emerald-500/10 shadow-[0_0_30px_rgba(139,92,246,0.06)]">
                    <Tags className="h-5 w-5 text-violet-300" />
                  </div>

                  <p className="mt-5 text-sm font-semibold text-zinc-300">
                    Category controls
                  </p>

                  <p className="mt-2 text-xs leading-5 text-zinc-600">
                    Select a category to edit it, or create a new category from
                    the registry.
                  </p>

                  <button
                    type="button"
                    onClick={handleOpenCreate}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 px-4 py-2.5 text-xs font-bold text-emerald-300 transition hover:border-emerald-400/35 hover:from-emerald-500/15 hover:to-cyan-500/15 hover:text-emerald-200"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Category
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <div className="relative shrink-0 border-t border-zinc-800/80 bg-gradient-to-r from-zinc-950 via-zinc-950 to-cyan-950/[0.08] px-5 py-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[9px] leading-relaxed text-zinc-600">
              Deactivation is non-destructive. Inactive categories remain
              available for reactivation.
            </p>

            <div className="hidden items-center gap-3 sm:flex">
              <span className="flex items-center gap-1.5 text-[9px] text-zinc-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_7px_rgba(52,211,153,0.7)]" />
                Active
              </span>

              <span className="flex items-center gap-1.5 text-[9px] text-zinc-600">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 shadow-[0_0_7px_rgba(248,113,113,0.6)]" />
                Inactive
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
