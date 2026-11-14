"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, RefreshCw, X } from "lucide-react";

import {
  approveStockRequest,
  getStockRequest,
  rejectStockRequest,
} from "@/lib/inventory-api";

import {
  InventoryDrawerShell,
  inventoryInputClass,
  inventoryLabelClass,
} from "@/elements/rawmaterial/InventoryShared";

import { RequestStatusBadge } from "./StockRequestTable";

import type {
  OperationsStockRequest,
} from "@/utils/types/inventory";

interface StockRequestDrawerProps {
  requestId: string;
  warehouseId: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}

export default function StockRequestDrawer({
  requestId,
  warehouseId,
  onClose,
  onSaved,
}: StockRequestDrawerProps) {
  const [request, setRequest] =
    useState<OperationsStockRequest | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const [mode, setMode] =
    useState<"approve" | "reject">("approve");

  const [quantities, setQuantities] =
    useState<Record<string, string>>({});

  const [selectedItems, setSelectedItems] =
    useState<Record<string, boolean>>({});

  const [reason, setReason] = useState("");
  const [needsRefresh, setNeedsRefresh] = useState(false);

  const submitLock = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadRequest = async () => {
      setLoading(true);
      setError("");
      setRequest(null);

      try {
        const data = await getStockRequest(requestId, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (data.warehouseId !== warehouseId) {
          throw new Error(
            "This request belongs to a different warehouse.",
          );
        }

        if (!Array.isArray(data.items)) {
          throw new Error(
            "Stock request response is missing its stock items.",
          );
        }

        setRequest({
          ...data,
          items: data.items,
        });

        setQuantities(
          Object.fromEntries(
            data.items.map((item) => [
              item.ingredientId,
              String(item.requestedQty),
            ]),
          ),
        );

        setSelectedItems(
          Object.fromEntries(
            data.items.map((item) => [
              item.ingredientId,
              true,
            ]),
          ),
        );

        setNeedsRefresh(false);
      } catch (error) {
        if (controller.signal.aborted) return;

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load request details.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadRequest();

    return () => controller.abort();
  }, [requestId, warehouseId, retryKey]);

  const canReview = request?.status === "REQUESTED";

  const handleSubmit = async () => {
    if (
      !request ||
      !canReview ||
      needsRefresh ||
      submitLock.current
    ) {
      return;
    }

    setError("");

    const itemsToApprove = request.items.filter(
      (item) => selectedItems[item.ingredientId],
    );

    if (mode === "approve") {
      if (itemsToApprove.length === 0) {
        setError("Select at least one stock item to approve.");
        return;
      }

      for (const item of itemsToApprove) {
        const raw = quantities[item.ingredientId] ?? "";
        const quantity = Number(raw);

        if (
          !/^\d+(\.\d{1,4})?$/.test(raw) ||
          !Number.isFinite(quantity) ||
          quantity <= 0 ||
          quantity > Number(item.requestedQty) ||
          quantity > 99999999.9999
        ) {
          setError(
            `Enter a positive quantity up to ${item.requestedQty} for ${
              item.ingredient?.name ?? item.ingredientId
            }, with no more than four decimal places.`,
          );
          return;
        }
      }
    } else if (
      reason.trim().length < 3 ||
      reason.trim().length > 500
    ) {
      setError(
        "Enter a rejection reason between 3 and 500 characters.",
      );
      return;
    }

    submitLock.current = true;
    setSaving(true);

    try {
      if (mode === "approve") {
        await approveStockRequest(request.id, {
          items: itemsToApprove.map((item) => ({
            ingredientId: item.ingredientId,
            approvedQty: Number(
              quantities[item.ingredientId],
            ),
          })),
        });

        onSaved(
          "Stock request approved. A transfer has been created.",
        );
      } else {
        await rejectStockRequest(
          request.id,
          reason.trim(),
        );

        onSaved("Stock request rejected successfully.");
      }
    } catch (error) {
      setNeedsRefresh(true);

      setError(
        `${
          error instanceof Error
            ? error.message
            : "Unable to confirm the request outcome."
        } Refresh request details before retrying.`,
      );
    } finally {
      submitLock.current = false;
      setSaving(false);
    }
  };

  return (
    <InventoryDrawerShell
      title="Stock Request"
      subtitle="WAREHOUSE REQUEST REVIEW"
      saving={saving}
      error={error}
      onClose={onClose}
      wide
    >
      {loading ? (
        <div
          role="status"
          className="flex min-h-[240px] items-center justify-center gap-2 text-xs text-zinc-500"
        >
          <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
          Loading request details...
        </div>
      ) : !request ? (
        <button
          type="button"
          onClick={() => setRetryKey((value) => value + 1)}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      ) : (
        <div className="space-y-5">
          {/* REQUEST INFORMATION */}

          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
              <div>
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Stock Request
                </p>

                <h3
                  title={request.id}
                  className="mt-1 font-mono text-sm font-semibold tracking-wide text-zinc-200"
                >
                  REQ-{request.id.slice(0, 8).toUpperCase()}
                </h3>
              </div>

              <RequestStatusBadge status={request.status} />
            </div>

            <div className="space-y-4 p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                    Restaurant
                  </p>

                  <p className="mt-1.5 text-sm font-semibold text-zinc-200">
                    {request.restaurant?.name?.trim() ||
                      "Restaurant name unavailable"}
                  </p>

                  <p className="mt-1 break-all font-mono text-[9px] text-zinc-500">
                    {request.restaurantId}
                  </p>
                </div>

                <div>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                    Requested On
                  </p>

                  <p className="mt-1.5 text-xs text-zinc-300">
                    {new Date(
                      request.requestedAt,
                    ).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>

                  <p className="mt-1 font-mono text-[10px] text-zinc-500">
                    {new Date(
                      request.requestedAt,
                    ).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-3">
                <p className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                  Request Reason
                </p>

                <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-zinc-300">
                  {request.reason?.trim() ||
                    "No reason provided."}
                </p>
              </div>

              {request.rejectionReason && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3">
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-wider text-rose-400">
                    Rejection Reason
                  </p>

                  <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-rose-300">
                    {request.rejectionReason}
                  </p>
                </div>
              )}

              <details className="border-t border-zinc-800 pt-3">
                <summary className="cursor-pointer text-[10px] text-zinc-500 transition-colors hover:text-zinc-300">
                  View full request ID
                </summary>

                <p className="mt-2 break-all rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 font-mono text-[10px] text-zinc-400">
                  {request.id}
                </p>
              </details>
            </div>
          </div>

          {/* REFRESH AFTER AN UNSUCCESSFUL SUBMISSION */}

          {needsRefresh && (
            <button
              type="button"
              onClick={() =>
                setRetryKey((value) => value + 1)
              }
              className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-300 transition-colors hover:bg-cyan-500/20"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh Request Details
            </button>
          )}

          {/* APPROVAL / REJECTION MODE */}

          {canReview && (
            <div className="grid grid-cols-2 gap-2">
              {(["approve", "reject"] as const).map(
                (value) => (
                  <button
                    key={value}
                    type="button"
                    disabled={saving || needsRefresh}
                    onClick={() => {
                      setMode(value);
                      setError("");
                    }}
                    className={`rounded-xl border px-3 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 ${
                      mode === value
                        ? value === "approve"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : "border-rose-500/30 bg-rose-500/10 text-rose-300"
                        : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {value === "approve"
                      ? "Approve Request"
                      : "Reject Request"}
                  </button>
                ),
              )}
            </div>
          )}

          {/* REQUESTED ITEMS */}

          <div className="space-y-3">
            <p className={inventoryLabelClass}>
              Requested Stock Items · {request.items.length}
            </p>

            {request.items.map((item, index) => (
              <div
                key={item.id}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"
              >
                <div className="flex items-start gap-3">
                  {canReview && mode === "approve" ? (
                    <input
                      type="checkbox"
                      checked={
                        selectedItems[item.ingredientId] ??
                        false
                      }
                      disabled={saving || needsRefresh}
                      onChange={(event) =>
                        setSelectedItems((current) => ({
                          ...current,
                          [item.ingredientId]:
                            event.target.checked,
                        }))
                      }
                      aria-label={`Include ${
                        item.ingredient?.name ??
                        item.ingredientId
                      } in approval`}
                      className="mt-1 h-4 w-4 shrink-0 accent-emerald-500"
                    />
                  ) : (
                    <span className="mt-0.5 font-mono text-[10px] text-zinc-600">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-zinc-200">
                      {item.ingredient?.name ?? "Stock item"}
                    </p>

                    <p className="mt-1 break-all font-mono text-[9px] text-zinc-600">
                      {item.ingredientId}
                    </p>

                    <p className="mt-2 text-[11px] text-zinc-400">
                      Requested:{" "}
                      {Number(
                        item.requestedQty,
                      ).toLocaleString("en-IN", {
                        maximumFractionDigits: 4,
                      })}{" "}
                      {item.ingredient?.uom}
                    </p>

                    {!canReview && (
                      <p className="mt-1 text-[11px] text-zinc-400">
                        Approved:{" "}
                        <span className="text-emerald-400">
                          {item.approvedQty == null
                            ? "—"
                            : Number(
                                item.approvedQty,
                              ).toLocaleString("en-IN", {
                                maximumFractionDigits: 4,
                              })}{" "}
                          {item.ingredient?.uom}
                        </span>
                      </p>
                    )}

                    {canReview && mode === "approve" && (
                      <div className="mt-3 max-w-[160px] space-y-1">
                        <label
                          htmlFor={`approved-${item.id}`}
                          className="block font-mono text-[9px] uppercase tracking-wider text-zinc-500"
                        >
                          Approve Quantity
                        </label>

                        <input
                          id={`approved-${item.id}`}
                          type="number"
                          min="0.0001"
                          max={Math.min(
                            Number(item.requestedQty),
                            99999999.9999,
                          )}
                          step="0.0001"
                          value={
                            quantities[item.ingredientId] ??
                            ""
                          }
                          disabled={
                            saving ||
                            needsRefresh ||
                            !selectedItems[item.ingredientId]
                          }
                          onChange={(event) =>
                            setQuantities((current) => ({
                              ...current,
                              [item.ingredientId]:
                                event.target.value,
                            }))
                          }
                          className={inventoryInputClass}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* REJECTION REASON */}

          {canReview && mode === "reject" && (
            <div className="space-y-2">
              <label
                htmlFor="stock-request-rejection"
                className={inventoryLabelClass}
              >
                Rejection Reason
              </label>

              <textarea
                id="stock-request-rejection"
                rows={4}
                maxLength={500}
                value={reason}
                disabled={saving || needsRefresh}
                onChange={(event) =>
                  setReason(event.target.value)
                }
                placeholder="Explain why this request cannot be supplied..."
                className={`${inventoryInputClass} resize-none`}
              />

              <p className="text-right font-mono text-[9px] text-zinc-600">
                {reason.length}/500
              </p>
            </div>
          )}

          {canReview && mode === "approve" && (
            <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3 text-[11px] leading-relaxed text-zinc-400">
              Approve the quantities you can supply. Uncheck
              any items you cannot supply. Approval creates a
              transfer; warehouse stock is deducted when it
              ships.
            </div>
          )}

          {/* FOOTER ACTIONS */}

          <div className="flex gap-3 border-t border-zinc-800 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-50"
            >
              Close
            </button>

            {canReview && (
              <button
                type="button"
                disabled={
                  saving ||
                  needsRefresh ||
                  (mode === "approve" &&
                    request.items.length === 0)
                }
                onClick={() => void handleSubmit()}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  mode === "approve"
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                    : "border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                }`}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === "approve" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}

                {saving
                  ? "Saving..."
                  : mode === "approve"
                    ? "Confirm Approval"
                    : "Confirm Rejection"}
              </button>
            )}
          </div>
        </div>
      )}
    </InventoryDrawerShell>
  );
}