import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Pagination } from "@/lib/catalog-api";

const control =
  "flex h-8 items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-[11px] text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:cursor-not-allowed disabled:opacity-30";

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
  const startItem = total === 0 ? 0 : offset + 1;
  const endItem = Math.min(offset + visibleRows, total);
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let current = 1; current <= totalPages; current++) pages.push(current);
  } else {
    pages.push(1);
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    if (start > 2) pages.push("...");
    for (let current = start; current <= end; current++) pages.push(current);
    if (end < totalPages - 1) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <nav
      aria-label="Menu pages"
      className="flex flex-col gap-4 border-t border-zinc-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p aria-live="polite" className="text-[11px] text-zinc-500">
        Showing{" "}
        <span className="font-semibold text-zinc-300">
          {startItem}-{endItem}
        </span>{" "}
        of <span className="font-semibold text-zinc-300">{total}</span> menu
        items
      </p>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <select
          aria-label="Items per page"
          value={limit}
          disabled={disabled}
          onChange={(event) => onLimit(Number(event.target.value))}
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-[11px] text-zinc-400 outline-none transition focus:border-emerald-500/50 disabled:opacity-50"
        >
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
        </select>
        <button
          type="button"
          aria-label="Previous page"
          disabled={disabled || page <= 1}
          onClick={() => onPage(page - 1)}
          className={control}
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">Previous</span>
        </button>
        <div className="flex items-center gap-1">
          {pages.map((value, index) =>
            value === "..." ? (
              <span
                key={`ellipsis-${index}`}
                className="px-1.5 text-xs text-zinc-700"
              >
                ...
              </span>
            ) : (
              <button
                key={value}
                type="button"
                disabled={disabled}
                aria-label={`Go to page ${value}`}
                aria-current={value === page ? "page" : undefined}
                onClick={() => onPage(value)}
                className={`h-8 min-w-8 rounded-lg px-2 text-[11px] font-semibold transition focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:cursor-wait ${value === page ? "bg-emerald-500 text-zinc-950" : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"}`}
              >
                {value}
              </button>
            ),
          )}
        </div>
        <button
          type="button"
          aria-label="Next page"
          disabled={disabled || page >= totalPages}
          onClick={() => onPage(page + 1)}
          className={control}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </nav>
  );
}
