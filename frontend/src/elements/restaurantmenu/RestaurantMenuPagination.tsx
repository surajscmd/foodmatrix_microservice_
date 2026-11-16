import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Pagination } from "@/lib/catalog-api";

const control =
  "inline-flex min-h-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-950/60 px-2.5 text-xs text-zinc-200 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-35";

export default function RestaurantMenuPagination({
  pagination,
  visibleRows,
  disabled,
  onPage,
  onLimit,
}: {
  pagination: Pagination;
  visibleRows: number;
  disabled: boolean;
  onPage: (page: number) => void;
  onLimit: (limit: number) => void;
}) {
  const { page, totalPages, limit, total } = pagination;
  const offset = (page - 1) * limit;

  return (
    <nav aria-label="Menu pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-950/40 px-4 py-3">
      <p aria-live="polite" className="text-xs text-zinc-400 tabular-nums">
        <span className="font-medium text-zinc-100">{offset + 1}–{offset + visibleRows}</span> of {total} items
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <select
          aria-label="Items per page"
          value={limit}
          disabled={disabled}
          onChange={(event) => onLimit(Number(event.target.value))}
          className={control}
        >
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
        <button
          type="button"
          aria-label="Previous page"
          disabled={disabled || page <= 1}
          onClick={() => onPage(page - 1)}
          className={control + " enabled:hover:bg-zinc-800"}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <span className="px-1 text-xs whitespace-nowrap text-zinc-400 tabular-nums">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          aria-label="Next page"
          disabled={disabled || page >= totalPages}
          onClick={() => onPage(page + 1)}
          className={control + " enabled:hover:bg-zinc-800"}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
