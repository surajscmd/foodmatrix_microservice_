"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Eye, Loader2, RefreshCw } from "lucide-react";

import { InventoryPagination } from "@/elements/rawmaterial/InventoryShared";

import type {
  OperationsStockRequest,
  StockRequestStatus,
} from "@/utils/types/inventory";

interface StockRequestTableProps {
  requests: OperationsStockRequest[];
  searchTerm: string;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onView: (requestId: string) => void;
}

const statusClasses: Record<StockRequestStatus, string> = {
  REQUESTED: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  APPROVED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  REJECTED: "border-rose-500/20 bg-rose-500/10 text-rose-300",
  FULFILLED: "border-sky-500/20 bg-sky-500/10 text-sky-300",
  CANCELLED: "border-zinc-700 bg-zinc-800/50 text-zinc-400",
};

export function RequestStatusBadge({ status }: { status: StockRequestStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider ${statusClasses[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status === "REQUESTED" ? "Pending" : status}
    </span>
  );
}

export default function StockRequestTable(props: StockRequestTableProps) {
  const [status, setStatus] = useState<StockRequestStatus | "ALL">("ALL");

  const [limit, setLimit] = useState(10);

  return (
    <TableContent
      key={`${props.searchTerm}:${status}:${limit}`}
      {...props}
      status={status}
      limit={limit}
      onStatusChange={setStatus}
      onLimitChange={setLimit}
    />
  );
}

interface TableContentProps extends StockRequestTableProps {
  status: StockRequestStatus | "ALL";
  limit: number;
  onStatusChange: (status: StockRequestStatus | "ALL") => void;
  onLimitChange: (limit: number) => void;
}

function TableContent({
  requests,
  searchTerm,
  loading,
  error,
  onRetry,
  onView,
  status,
  limit,
  onStatusChange,
  onLimitChange,
}: TableContentProps) {
  const [page, setPage] = useState(1);

  const filteredRequests = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return requests.filter((request) => {
      if (status !== "ALL" && request.status !== status) {
        return false;
      }

      const searchText = [
        request.id,
        `REQ-${request.id.slice(0, 8)}`,
        request.restaurantId,
        request.restaurant?.name ?? "",
        request.reason ?? "",
        ...request.items.flatMap((item) => [
          item.ingredientId,
          item.ingredient?.name ?? "",
        ]),
      ]
        .join(" ")
        .toLowerCase();

      return searchText.includes(query);
    });
  }, [requests, searchTerm, status]);

  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(filteredRequests.length / limit)),
  );

  const visibleRequests = filteredRequests.slice(
    (currentPage - 1) * limit,
    currentPage * limit,
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-400/15 bg-linear-to-r from-emerald-500/15 via-emerald-500/5 to-zinc-950 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-400">
            <ClipboardList size={17} aria-hidden />
          </span>
          <div>
            <h2 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
              Restaurant Requests
            </h2>
            <p className="mt-1 text-[10px] text-zinc-500">
              {loading
                ? "Loading requests…"
                : `${filteredRequests.length} matching requests`}
            </p>
          </div>
        </div>

        <select
          value={status}
          disabled={loading}
          onChange={(event) =>
            onStatusChange(event.target.value as StockRequestStatus | "ALL")
          }
          aria-label="Filter stock request status"
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-[11px] text-zinc-400 outline-none transition focus:border-emerald-500/50 disabled:opacity-50"
        >
          <option value="ALL">All Statuses</option>
          <option value="REQUESTED">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="FULFILLED">Fulfilled</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div
          role="status"
          className="flex min-h-[240px] items-center justify-center gap-2 text-xs text-zinc-500"
        >
          <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
          Loading stock requests...
        </div>
      ) : error ? (
        <div role="alert" className="space-y-3 p-12 text-center">
          <p className="text-xs text-rose-300">{error}</p>

          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400 transition hover:text-emerald-300"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      ) : visibleRequests.length === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 p-8">
          <ClipboardList className="h-7 w-7 text-zinc-700" />

          <p className="text-xs text-zinc-500">No stock requests found.</p>

          <p className="text-[10px] text-zinc-600">
            {searchTerm.trim() || status !== "ALL"
              ? "Try another search or status filter."
              : "Restaurant replenishment requests will appear here."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-950/80 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                {[
                  "Request",
                  "Restaurant",
                  "Stock Items",
                  "Status",
                  "Requested",
                  "Actions",
                ].map((label) => (
                  <th
                    key={label}
                    scope="col"
                    className={`whitespace-nowrap px-5 py-3.5 font-semibold ${
                      label === "Actions" ? "text-right" : ""
                    }`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800/70">
              {visibleRequests.map((request) => {
                const itemNames = request.items
                  .map((item) => item.ingredient?.name ?? item.ingredientId)
                  .join(", ");

                return (
                  <tr
                    key={request.id}
                    className="transition-colors hover:bg-zinc-900/50"
                  >
                    <td className="px-5 py-4">
                      <p
                        title={request.id}
                        className="whitespace-nowrap font-mono text-[11px] font-medium text-zinc-300"
                      >
                        REQ-{request.id.slice(0, 8).toUpperCase()}
                      </p>

                      <p
                        title={request.reason ?? ""}
                        className="mt-1 max-w-[180px] truncate text-[10px] text-zinc-600"
                      >
                        {request.reason || "Stock replenishment"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-xs font-semibold text-zinc-200">
                        {request.restaurant?.name?.trim() ||
                          "Restaurant name unavailable"}
                      </p>

                      <p className="mt-1 whitespace-nowrap font-mono text-[9px] text-zinc-500">
                        {request.restaurantId}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-zinc-300">
                        {request.items.length} stock{" "}
                        {request.items.length === 1 ? "item" : "items"}
                      </p>

                      <p
                        title={itemNames}
                        className="mt-1 max-w-[200px] truncate text-[10px] text-zinc-600"
                      >
                        {itemNames || "No stock items"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <RequestStatusBadge status={request.status} />
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <p className="text-[11px] text-zinc-400">
                        {new Date(request.requestedAt).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </p>

                      <p className="mt-1 font-mono text-[9px] text-zinc-600">
                        {new Date(request.requestedAt).toLocaleTimeString(
                          "en-IN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onView(request.id)}
                        aria-label={`Review request ${request.id}`}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-cyan-300 transition-colors hover:border-cyan-500/40 hover:bg-cyan-500/20"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Review
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && (
        <InventoryPagination
          page={currentPage}
          limit={limit}
          total={filteredRequests.length}
          onPageChange={setPage}
          onLimitChange={onLimitChange}
        />
      )}
    </div>
  );
}
