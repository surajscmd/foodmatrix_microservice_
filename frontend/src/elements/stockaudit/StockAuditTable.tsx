"use client";

import { ClipboardList, Eye, Loader2, RefreshCw } from "lucide-react";

import { InventoryPagination } from "@/elements/rawmaterial/InventoryShared";

import type {
  DecimalValue,
  MovementType,
  Pagination,
  StockMovementView,
} from "@/utils/types/inventory";

const movementLabels: Record<MovementType, string> = {
  POS_SALE: "POS Sale",
  PURCHASE: "Purchase",
  TRANSFER_IN: "Transfer In",
  TRANSFER_OUT: "Transfer Out",
  ADJUSTMENT: "Adjustment",
  WASTE: "Waste",
};

const movementClasses: Record<MovementType, string> = {
  POS_SALE: "border-violet-500/20 bg-violet-500/10 text-violet-300",
  PURCHASE: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  TRANSFER_IN: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  TRANSFER_OUT: "border-sky-500/20 bg-sky-500/10 text-sky-300",
  ADJUSTMENT: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  WASTE: "border-rose-500/20 bg-rose-500/10 text-rose-300",
};

export function AuditMovementBadge({ type }: { type: MovementType }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-lg border px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider ${movementClasses[type]}`}
    >
      {movementLabels[type]}
    </span>
  );
}

export function AuditQuantity({
  value,
  unit,
}: {
  value: DecimalValue;
  unit?: string;
}) {
  const number = Number(value);
  const valid = Number.isFinite(number);

  return (
    <span
      className={`whitespace-nowrap font-mono text-xs font-semibold ${
        valid && number > 0
          ? "text-emerald-300"
          : valid && number < 0
            ? "text-rose-300"
            : "text-zinc-400"
      }`}
    >
      {valid
        ? `${number > 0 ? "+" : ""}${number.toLocaleString("en-IN", {
            maximumFractionDigits: 4,
          })}`
        : "—"}
      {unit ? ` ${unit}` : ""}
    </span>
  );
}

interface Props {
  movements: StockMovementView[];
  pagination: Pagination;
  locationName: string;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onView: (movement: StockMovementView) => void;
}

export default function StockAuditTable({
  movements,
  pagination,
  locationName,
  loading,
  error,
  onRetry,
  onPageChange,
  onLimitChange,
  onView,
}: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-400/15 bg-linear-to-r from-emerald-500/15 via-emerald-500/5 to-zinc-950 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-400">
            <ClipboardList size={17} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
              Movement Ledger
            </h2>
            <p className="mt-1 break-words text-[10px] text-zinc-500">
              {locationName}
            </p>
          </div>
        </div>

        <span className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
          Read Only
        </span>
      </div>

      {loading ? (
        <div
          role="status"
          className="flex min-h-[240px] items-center justify-center gap-2 text-xs text-zinc-500"
        >
          <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
          Loading audit records...
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
      ) : movements.length === 0 ? (
        <div className="space-y-2 p-12 text-center">
          <p className="text-xs text-zinc-400">No audit records found.</p>
          <p className="text-[10px] text-zinc-600">
            Try another location, stock item, movement or date range.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-950/80 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                {[
                  "Date & Time",
                  "Stock Item",
                  "Movement",
                  "Quantity Change",
                  "Reference",
                  "Reason",
                  "Details",
                ].map((label) => (
                  <th
                    key={label}
                    scope="col"
                    className={`whitespace-nowrap px-5 py-3.5 font-semibold ${
                      label === "Details" ? "text-right" : ""
                    }`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800/70">
              {movements.map((movement) => (
                <tr
                  key={movement.id}
                  className="transition-colors hover:bg-zinc-900/50"
                >
                  <td className="whitespace-nowrap px-5 py-4">
                    <p className="text-[11px] text-zinc-300">
                      {new Date(movement.createdAt).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </p>

                    <p className="mt-1 font-mono text-[9px] text-zinc-600">
                      {new Date(movement.createdAt).toLocaleTimeString(
                        "en-IN",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        },
                      )}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-semibold text-zinc-200">
                      {movement.ingredient?.name ?? "Stock item"}
                    </p>
                    <p className="mt-1 whitespace-nowrap font-mono text-[9px] text-zinc-600">
                      {movement.ingredientId}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <AuditMovementBadge type={movement.movementType} />
                  </td>

                  <td className="px-5 py-4">
                    <AuditQuantity
                      value={movement.quantityChange}
                      unit={movement.ingredient?.uom}
                    />
                  </td>

                  <td className="px-5 py-4">
                    <p
                      title={movement.referenceId ?? undefined}
                      className="max-w-[150px] truncate font-mono text-[10px] text-zinc-500"
                    >
                      {movement.referenceId || "—"}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p
                      title={movement.reason ?? undefined}
                      className="max-w-[180px] truncate text-[11px] text-zinc-500"
                    >
                      {movement.reason?.trim() || "—"}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onView(movement)}
                      aria-label={`View audit record ${movement.id}`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-cyan-300 transition-colors hover:bg-cyan-500/20"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
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
          page={pagination.page}
          limit={pagination.limit}
          total={pagination.total}
          itemLabel="audit records"
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      )}
    </div>
  );
}
