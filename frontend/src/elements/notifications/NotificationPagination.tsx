"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export default function NotificationPagination({
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.max(1, Math.min(page, totalPages));

  const startItem = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, total);

  const pages = new Set<number>([1, totalPages]);

  if (totalPages <= 7) {
    for (let value = 1; value <= totalPages; value++) {
      pages.add(value);
    }
  } else if (currentPage <= 4) {
    for (let value = 2; value <= 5; value++) pages.add(value);
  } else if (currentPage >= totalPages - 3) {
    for (let value = totalPages - 4; value < totalPages; value++) {
      pages.add(value);
    }
  } else {
    pages.add(currentPage - 1);
    pages.add(currentPage);
    pages.add(currentPage + 1);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const numbers: Array<number | "..."> = [];

  sorted.forEach((value, index) => {
    const previous = sorted[index - 1];

    if (previous !== undefined && value - previous > 1) {
      numbers.push("...");
    }

    numbers.push(value);
  });

  const buttonClass =
    "flex h-8 items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 text-[11px] text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div className="flex flex-col gap-4 border-t border-zinc-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[11px] text-zinc-500">
        Showing{" "}
        <span className="font-semibold text-zinc-300">
          {startItem}-{endItem}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-zinc-300">
          {total}
        </span>{" "}
        notifications
      </p>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <select
          value={limit}
          onChange={(event) =>
            onLimitChange(Number(event.target.value))
          }
          aria-label="Notifications per page"
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-[11px] text-zinc-400 outline-none focus:border-emerald-500/50"
        >
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
        </select>

        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
          className={buttonClass}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="flex items-center gap-1">
          {numbers.map((value, index) =>
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
                onClick={() => onPageChange(value)}
                aria-current={value === currentPage ? "page" : undefined}
                aria-label={`Go to page ${value}`}
                className={`h-8 min-w-8 rounded-lg px-2 text-[11px] font-semibold transition-colors ${
                  value === currentPage
                    ? "bg-emerald-500 text-zinc-950"
                    : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                {value}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
          className={buttonClass}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}