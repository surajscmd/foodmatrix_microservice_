"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { createPortal } from "react-dom";

import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  Plus,
  Search,
  Wheat,
  X,
} from "lucide-react";

import type { Ingredient } from "@/lib/catalog-api";

// ======================================================
// SHARED STYLES
// ======================================================

export const inventoryInputClass =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white outline-none transition placeholder:text-zinc-700 focus:border-emerald-500/50 disabled:opacity-50";

export const inventoryLabelClass =
  "font-mono text-[11px] uppercase tracking-wider text-zinc-400";

export const inventoryButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-[11px] text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40";

export const inventoryPrimaryClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50";

// ======================================================
// HELPERS
// ======================================================

export function formatStockQuantity(value: string | number): string {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed.toLocaleString(undefined, {
        maximumFractionDigits: 4,
      })
    : "—";
}

export function inventoryError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unable to complete inventory request.";
}

export function validStockQuantity(value: string, positive: boolean): boolean {
  const parsed = Number(value);

  return (
    /^[+-]?\d+(\.\d{1,4})?$/.test(value.trim()) &&
    Number.isFinite(parsed) &&
    parsed !== 0 &&
    (!positive || parsed > 0) &&
    Math.abs(parsed) <= 99999999.9999
  );
}

// ======================================================
// DRAWER SHELL
// ======================================================

interface InventoryDrawerShellProps {
  title: string;
  subtitle: string;
  saving: boolean;
  error: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

export function InventoryDrawerShell({
  title,
  subtitle,
  saving,
  error,
  onClose,
  children,
  wide = false,
}: InventoryDrawerShellProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const savingRef = useRef(saving);

  useEffect(() => {
    closeRef.current = onClose;
    savingRef.current = saving;
  }, [onClose, saving]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const getFocusable = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
        ) ?? [],
      );

    getFocusable()[0]?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape" && !savingRef.current) {
        closeRef.current();
      }

      if (event.key !== "Tab") return;

      const elements = getFocusable();
      const first = elements[0];
      const last = elements[elements.length - 1];

      if (!first || !last) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }

      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === panelRef.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;

      document.removeEventListener("keydown", handleKeyDown);

      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
      }
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] isolate flex justify-end bg-zinc-950/65 backdrop-blur-md">
      <button
        type="button"
        aria-label="Close stock drawer"
        disabled={saving}
        onClick={onClose}
        className="absolute inset-0 z-0 h-full w-full cursor-default disabled:cursor-not-allowed"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inventory-drawer-title"
        tabIndex={-1}
        className={`animate-slide-in-right relative z-10 flex h-dvh max-h-dvh w-full ${
          wide ? "max-w-xl" : "max-w-md"
        } flex-col overflow-y-auto border-l border-zinc-800 bg-[#0c0c0e] p-6 text-zinc-300 shadow-2xl outline-none`}
      >
        <div className="mb-6 flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-400" />

            <div>
              <h3
                id="inventory-drawer-title"
                className="text-sm font-bold text-white"
              >
                {title}
              </h3>

              <p className="font-mono text-[10px] text-zinc-400">{subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close drawer"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-900 hover:text-white disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-rose-500/10 bg-rose-500/5 p-3 text-xs text-rose-300"
          >
            {error}
          </div>
        )}

        {children}
      </div>
    </div>,
    document.body,
  );
}

// ======================================================
// RECIPE-STYLE INGREDIENT SEARCH
// ======================================================

interface InventoryIngredientSearchProps {
  ingredients: Ingredient[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  onChoose: (ingredient: Ingredient) => void;
  excludedIds?: string[];
  disabled?: boolean;
  activeOnly?: boolean;
}

export function InventoryIngredientSearch({
  ingredients,
  loading,
  error,
  onRetry,
  onChoose,
  excludedIds = [],
  disabled = false,
  activeOnly = true,
}: InventoryIngredientSearchProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  const searching =
    search.trim().length >= 2 && (loading || search.trim() !== debouncedSearch);

  const results = ingredients.filter(
    (ingredient) =>
      (!activeOnly || ingredient.isActive) &&
      !excludedIds.includes(ingredient.id) &&
      ingredient.name.toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-400/50" />

        <input
          aria-label="Search ingredient"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search stock items..."
          disabled={disabled}
          className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-10 pr-9 text-xs text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-violet-400/30 disabled:opacity-40"
        />

        {search && (
          <button
            type="button"
            aria-label="Clear ingredient search"
            disabled={disabled}
            onClick={() => {
              setSearch("");
              setDebouncedSearch("");
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-600 hover:text-zinc-300"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {search.trim().length < 2 && (
        <p className="mt-2 text-[10px] text-zinc-600">
          Type at least 2 characters, then click an ingredient.
        </p>
      )}

      {error ? (
        <p role="alert" className="mt-2 text-xs text-rose-300">
          {error}{" "}
          <button
            type="button"
            disabled={disabled}
            onClick={onRetry}
            className="underline"
          >
            Retry
          </button>
        </p>
      ) : searching ? (
        <div
          role="status"
          className="flex items-center gap-2 py-4 text-[10px] text-zinc-500"
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-300" />
          Searching ingredients...
        </div>
      ) : (
        search.trim().length >= 2 &&
        debouncedSearch === search.trim() && (
          <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-zinc-800 bg-[#07090c]">
            {results.length === 0 ? (
              <p className="px-3 py-4 text-xs text-zinc-600">
                No matching ingredients available.
              </p>
            ) : (
              results.map((ingredient) => (
                <button
                  type="button"
                  key={ingredient.id}
                  disabled={disabled}
                  onClick={() => {
                    onChoose(ingredient);
                    setSearch("");
                    setDebouncedSearch("");
                  }}
                  className="group flex w-full items-center justify-between border-b border-zinc-900 px-3 py-2.5 text-left last:border-b-0 hover:bg-violet-400/[0.04] disabled:opacity-40"
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
              ))
            )}
          </div>
        )
      )}
    </div>
  );
}

// ======================================================
// PAGINATION
// ======================================================
interface InventoryPaginationProps {
  page: number;
  limit: number;
  total: number;
  loading?: boolean;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function InventoryPagination({
  page,
  limit,
  total,
  loading = false,
  itemLabel = "stock items",
  onPageChange,
  onLimitChange,
}: InventoryPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const startItem = total === 0 ? 0 : (currentPage - 1) * limit + 1;

  const endItem = Math.min(currentPage * limit, total);

  const goToPage = (nextPage: number) => {
    if (loading) return;

    const target = Math.min(Math.max(1, nextPage), totalPages);

    if (target !== currentPage) {
      onPageChange(target);
    }
  };

  const getPageNumbers = (): Array<number | "..."> => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = new Set<number>([1, totalPages]);

    if (currentPage <= 4) {
      for (let number = 2; number <= 5; number++) {
        pages.add(number);
      }
    } else if (currentPage >= totalPages - 3) {
      for (let number = totalPages - 4; number < totalPages; number++) {
        pages.add(number);
      }
    } else {
      pages.add(currentPage - 1);
      pages.add(currentPage);
      pages.add(currentPage + 1);
    }

    const sortedPages = [...pages].sort((a, b) => a - b);
    const result: Array<number | "..."> = [];

    sortedPages.forEach((number, index) => {
      const previous = sortedPages[index - 1];

      if (previous !== undefined && number - previous > 1) {
        result.push("...");
      }

      result.push(number);
    });

    return result;
  };

  return (
    <div className="flex flex-col gap-4 border-t border-zinc-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-[11px] text-zinc-500">
        Showing{" "}
        <span className="font-semibold text-zinc-300">
          {startItem}-{endItem}
        </span>{" "}
        of <span className="font-semibold text-zinc-300">{total}</span>{" "}
        {itemLabel}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <select
          value={limit}
          onChange={(event) => onLimitChange(Number(event.target.value))}
          disabled={loading}
          aria-label="Stock items per page"
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-[11px] text-zinc-400 outline-none transition focus:border-emerald-500/50 disabled:opacity-50"
        >
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
        </select>

        <button
          type="button"
          disabled={loading || currentPage === 1}
          onClick={() => goToPage(currentPage - 1)}
          aria-label="Previous page"
          className="flex h-8 items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-[11px] text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((pageNumber, index) => {
            if (pageNumber === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-1.5 text-xs text-zinc-700"
                >
                  ...
                </span>
              );
            }

            const isActive = pageNumber === currentPage;

            return (
              <button
                key={pageNumber}
                type="button"
                disabled={loading}
                onClick={() => goToPage(pageNumber)}
                aria-label={`Go to page ${pageNumber}`}
                aria-current={isActive ? "page" : undefined}
                className={`h-8 min-w-8 rounded-lg px-2 text-[11px] font-semibold transition disabled:cursor-wait ${
                  isActive
                    ? "bg-emerald-500 text-zinc-950"
                    : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={loading || currentPage === totalPages}
          onClick={() => goToPage(currentPage + 1)}
          aria-label="Next page"
          className="flex h-8 items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-[11px] text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
