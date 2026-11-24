"use client";

import { useMemo, useState } from "react";
import { Eye, Loader2, RefreshCw, Truck } from "lucide-react";

import { InventoryPagination } from "@/elements/rawmaterial/InventoryShared";

import type {
  OperationsStockTransfer,
  TransferStatus,
} from "@/utils/types/inventory";

const statusLabels: Record<TransferStatus, string> = {
  REQUESTED: "Requested",
  APPROVED: "Approved",
  PICKING: "Picking",
  READY_TO_SHIP: "Ready to Ship",
  SHIPPED: "Shipped",
  IN_TRANSIT: "In Transit",
  RECEIVED: "Received",
  DISPUTED: "Disputed",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export function TransferStatusBadge({ status }: { status: TransferStatus }) {
  const color =
    status === "COMPLETED"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
      : ["DISPUTED", "REJECTED"].includes(status)
        ? "border-rose-500/20 bg-rose-500/10 text-rose-300"
        : ["SHIPPED", "IN_TRANSIT"].includes(status)
          ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
          : status === "CANCELLED"
            ? "border-zinc-700 bg-zinc-800/50 text-zinc-400"
            : "border-sky-500/20 bg-sky-500/10 text-sky-300";

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider ${color}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabels[status]}
    </span>
  );
}

interface Props {
  transfers: OperationsStockTransfer[];
  searchTerm: string;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onView: (id: string) => void;
}

export default function FulfillmentTable(props: Props) {
  const [status, setStatus] = useState<TransferStatus | "ALL">("ALL");
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

function TableContent({
  transfers,
  searchTerm,
  loading,
  error,
  onRetry,
  onView,
  status,
  limit,
  onStatusChange,
  onLimitChange,
}: Props & {
  status: TransferStatus | "ALL";
  limit: number;
  onStatusChange: (value: TransferStatus | "ALL") => void;
  onLimitChange: (value: number) => void;
}) {
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return transfers.filter((transfer) => {
      if (status !== "ALL" && transfer.status !== status) return false;

      return [
        transfer.id,
        `TRF-${transfer.id.slice(0, 8)}`,
        transfer.stockRequestId ?? "",
        transfer.toRestaurantId,
        transfer.restaurant?.name ?? "",
        transfer.shipment?.trackingNumber ?? "",
        transfer.shipment?.carrierName ?? "",
        transfer.shipment?.vehicleNumber ?? "",
        ...transfer.items.flatMap((item) => [
          item.ingredientId,
          item.ingredient?.name ?? "",
        ]),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [transfers, searchTerm, status]);

  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(filtered.length / limit)),
  );

  const visible = filtered.slice(
    (currentPage - 1) * limit,
    currentPage * limit,
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-400/15 bg-linear-to-r from-emerald-500/15 via-emerald-500/5 to-zinc-950 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-400">
            <Truck size={17} aria-hidden />
          </span>
          <div>
            <h2 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
              Outgoing Transfers
            </h2>
            <p className="mt-1 text-[10px] text-zinc-500">
              {loading
                ? "Loading transfers…"
                : `${filtered.length} matching transfers`}
            </p>
          </div>
        </div>

        <select
          value={status}
          disabled={loading}
          onChange={(event) =>
            onStatusChange(event.target.value as TransferStatus | "ALL")
          }
          aria-label="Filter transfer status"
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-[11px] text-zinc-400 outline-none focus:border-emerald-500/50"
        >
          <option value="ALL">All Statuses</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center gap-2 text-xs text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
          Loading transfers...
        </div>
      ) : error ? (
        <div role="alert" className="space-y-3 p-12 text-center">
          <p className="text-xs text-rose-300">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-emerald-300"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="p-12 text-center text-xs text-zinc-500">
          No transfers found. Approved stock requests create transfers.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-950/80 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                {[
                  "Transfer",
                  "Restaurant",
                  "Stock Items",
                  "Shipment",
                  "Status",
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
              {visible.map((transfer) => (
                <tr
                  key={transfer.id}
                  className="transition-colors hover:bg-zinc-900/50"
                >
                  <td className="px-5 py-4">
                    <p
                      title={transfer.id}
                      className="whitespace-nowrap font-mono text-[11px] text-zinc-300"
                    >
                      TRF-{transfer.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="mt-1 text-[10px] text-zinc-600">
                      {new Date(transfer.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-semibold text-zinc-200">
                      {transfer.restaurant?.name ??
                        "Restaurant name unavailable"}
                    </p>
                    <p className="mt-1 whitespace-nowrap font-mono text-[9px] text-zinc-600">
                      {transfer.toRestaurantId}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p>{transfer.items.length} stock items</p>
                    <p className="mt-1 max-w-[180px] truncate text-[10px] text-zinc-600">
                      {transfer.items
                        .map(
                          (item) => item.ingredient?.name ?? item.ingredientId,
                        )
                        .join(", ")}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-zinc-400">
                      {transfer.shipment?.carrierName ?? "Not assigned"}
                    </p>
                    <p className="mt-1 font-mono text-[9px] text-zinc-600">
                      {transfer.shipment?.trackingNumber ??
                        "No tracking number"}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <TransferStatusBadge status={transfer.status} />
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onView(transfer.id)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-cyan-300 transition-colors hover:bg-cyan-500/20"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && (
        <InventoryPagination
          page={currentPage}
          limit={limit}
          total={filtered.length}
          itemLabel="transfers"
          onPageChange={setPage}
          onLimitChange={onLimitChange}
        />
      )}
    </div>
  );
}
