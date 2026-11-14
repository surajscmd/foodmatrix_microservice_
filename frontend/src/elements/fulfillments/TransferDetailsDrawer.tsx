"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Package,
  RefreshCw,
  Truck,
  X,
} from "lucide-react";

import {
  createTransferShipment,
  getStockTransfer,
  markTransferInTransit,
  markTransferReadyToShip,
  resolveTransferDiscrepancy,
  shipStockTransfer,
  startTransferPicking,
} from "@/lib/inventory-api";

import {
  inventoryInputClass,
  inventoryLabelClass,
} from "@/elements/rawmaterial/InventoryShared";

import type {
  DecimalValue,
  OperationsStockTransfer,
} from "@/utils/types/inventory";

import { TransferStatusBadge } from "./FulfillmentTable";
import ShipmentForm from "./ShipmentForm";
import DispatchForm from "./DispatchForm";

interface TransferDetailsDrawerProps {
  transferId: string;
  warehouseId: string;
  onClose: () => void;
  onChanged: () => void;
}

function quantity(
  value: DecimalValue | null | undefined,
): string {
  if (value == null) return "—";

  const number = Number(value);

  return Number.isFinite(number)
    ? number.toLocaleString("en-IN", {
        maximumFractionDigits: 4,
      })
    : "—";
}

function date(value: string | null | undefined): string {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DetailField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">
        {label}
      </p>

      <p
        className={`mt-1.5 break-words text-xs text-zinc-300 ${
          mono ? "font-mono text-[10px]" : ""
        }`}
      >
        {value?.trim() || "—"}
      </p>
    </div>
  );
}

export default function TransferDetailsDrawer({
  transferId,
  warehouseId,
  onClose,
  onChanged,
}: TransferDetailsDrawerProps) {
  const titleId = useId();
  const descriptionId = useId();
  const resolutionId = useId();

  const popupRef = useRef<HTMLDivElement>(null);
  const lock = useRef(false);
  const savingRef = useRef(false);
  const onCloseRef = useRef(onClose);

  const [transfer, setTransfer] =
    useState<OperationsStockTransfer | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [resolution, setResolution] = useState("");

  // ======================================================
  // POPUP KEYBOARD / SCROLL BEHAVIOR
  // ======================================================

  useEffect(() => {
    savingRef.current = saving;
    onCloseRef.current = onClose;
  }, [saving, onClose]);

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    popupRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();

        if (!savingRef.current && !lock.current) {
          onCloseRef.current();
        }

        return;
      }

      if (event.key !== "Tab") return;

      const popup = popupRef.current;

      if (!popup) return;

      const focusable = Array.from(
        popup.querySelectorAll<HTMLElement>(
          [
            "button:not(:disabled)",
            'input:not(:disabled):not([type="hidden"])',
            "select:not(:disabled)",
            "textarea:not(:disabled)",
            "a[href]",
            "summary",
            '[tabindex="0"]',
          ].join(","),
        ),
      ).filter(
        (element) =>
          element.tabIndex >= 0 &&
          element.getClientRects().length > 0,
      );

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (!first || !last) {
        event.preventDefault();
        popup.focus();
        return;
      }

      if (!popup.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }

      if (
        event.shiftKey &&
        (active === first || active === popup)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);

      if (previousFocus?.isConnected) {
        previousFocus.focus();
      }
    };
  }, []);

  // ======================================================
  // FETCH TRANSFER DETAILS
  // ======================================================

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError("");
      setTransfer(null);

      try {
        const data = await getStockTransfer(transferId, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (data.fromWarehouseId !== warehouseId) {
          throw new Error(
            "This transfer belongs to a different warehouse.",
          );
        }

        if (
          !Array.isArray(data.items) ||
          !Array.isArray(data.discrepancies) ||
          data.shipment === undefined
        ) {
          throw new Error(
            "Transfer details are missing required relations.",
          );
        }

        setTransfer({
          ...data,
          items: data.items,
        });

        setNeedsRefresh(false);
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load transfer details.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => controller.abort();
  }, [transferId, warehouseId, reloadKey]);

  // ======================================================
  // ACTIONS
  // ======================================================

  const handleClose = () => {
    if (saving || lock.current) return;
    onClose();
  };

  const refreshDetails = () => {
    if (saving || lock.current) return;

    setMessage("");
    setReloadKey((value) => value + 1);
  };

  const runAction = async (
    action: () => Promise<unknown>,
    successMessage: string,
  ): Promise<void> => {
    if (
      lock.current ||
      saving ||
      loading ||
      needsRefresh ||
      !transfer
    ) {
      return;
    }

    lock.current = true;
    savingRef.current = true;

    setSaving(true);
    setError("");
    setMessage("");

    let completed = false;

    try {
      await action();

      completed = true;

      setMessage(successMessage);
      setTransfer(null);
      setLoading(true);
      setReloadKey((value) => value + 1);
    } catch (error) {
      setNeedsRefresh(true);

      setError(
        `${
          error instanceof Error
            ? error.message
            : "Unable to confirm the action."
        } Refresh details before retrying.`,
      );
    } finally {
      lock.current = false;
      savingRef.current = false;
      setSaving(false);
    }

    if (completed) {
      onChanged();
    }
  };

  const actionClass =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-300 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50";

  const blocked = saving || needsRefresh;
  const shipment = transfer?.shipment;
  const discrepancies = transfer?.discrepancies ?? [];

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-zinc-950/75 p-3 backdrop-blur-md sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        ref={popupRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={loading || saving}
        tabIndex={-1}
        className="flex max-h-[90dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#0c0c0e] text-zinc-300 shadow-2xl outline-none"
      >
        {/* FIXED POPUP HEADER */}

        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-800 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
              <Truck className="h-4 w-4 text-emerald-400" />
            </div>

            <div>
              <h2
                id={titleId}
                className="text-sm font-semibold text-zinc-100"
              >
                Transfer Details
              </h2>

              <p
                id={descriptionId}
                className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-500"
              >
                Warehouse Fulfillment
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            aria-label="Close transfer details"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* SCROLLABLE POPUP CONTENT */}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs leading-relaxed text-rose-300"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {message && (
            <div
              role="status"
              className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs leading-relaxed text-emerald-300"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{message}</p>
            </div>
          )}

          {loading ? (
            <div
              role="status"
              className="flex min-h-[280px] items-center justify-center gap-2 text-xs text-zinc-500"
            >
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
              Loading transfer details...
            </div>
          ) : (
            <div className="space-y-5">
              {(!transfer || needsRefresh) && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={refreshDetails}
                  className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-300 transition-colors hover:bg-cyan-500/20 disabled:opacity-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh Details
                </button>
              )}

              {transfer && (
                <>
                  {/* TRANSFER SUMMARY */}

                  <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
                      <div>
                        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-500">
                          Stock Transfer
                        </p>

                        <h3
                          title={transfer.id}
                          className="mt-1 font-mono text-sm font-semibold tracking-wide text-zinc-200"
                        >
                          TRF-
                          {transfer.id.slice(0, 8).toUpperCase()}
                        </h3>
                      </div>

                      <TransferStatusBadge
                        status={transfer.status}
                      />
                    </div>

                    <div className="space-y-4 p-4">
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                          <p className={inventoryLabelClass}>
                            Destination Restaurant
                          </p>

                          <p className="mt-2 text-sm font-semibold text-zinc-200">
                            {transfer.restaurant?.name?.trim() ||
                              "Restaurant name unavailable"}
                          </p>

                          <p className="mt-1 break-all font-mono text-[9px] text-zinc-500">
                            {transfer.toRestaurantId}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <DetailField
                            label="Created"
                            value={date(transfer.createdAt)}
                          />

                          <DetailField
                            label="Approved"
                            value={date(transfer.approvedAt)}
                          />

                          <DetailField
                            label="Shipped"
                            value={date(transfer.shippedAt)}
                          />

                          <DetailField
                            label="Received"
                            value={date(transfer.receivedAt)}
                          />

                          <DetailField
                            label="Completed"
                            value={date(transfer.completedAt)}
                          />
                        </div>
                      </div>

                      {transfer.rejectionReason && (
                        <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3">
                          <p className="font-mono text-[9px] uppercase tracking-wider text-rose-400">
                            Rejection Reason
                          </p>

                          <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-rose-300">
                            {transfer.rejectionReason}
                          </p>
                        </div>
                      )}

                      <details className="border-t border-zinc-800 pt-3">
                        <summary className="cursor-pointer text-[10px] text-zinc-500 transition-colors hover:text-zinc-300">
                          View references
                        </summary>

                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <DetailField
                            label="Transfer ID"
                            value={transfer.id}
                            mono
                          />

                          <DetailField
                            label="Request ID"
                            value={transfer.stockRequestId}
                            mono
                          />

                          <DetailField
                            label="Warehouse ID"
                            value={transfer.fromWarehouseId}
                            mono
                          />
                        </div>
                      </details>
                    </div>
                  </div>

                  {/* STOCK QUANTITIES */}

                  <div className="overflow-hidden rounded-xl border border-zinc-800">
                    <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-950 px-4 py-3">
                      <Package className="h-3.5 w-3.5 text-emerald-400" />

                      <p className={inventoryLabelClass}>
                        Transfer Stock Items ·{" "}
                        {transfer.items.length}
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-zinc-950 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                            {[
                              "Item",
                              "Requested",
                              "Approved",
                              "Shipped",
                              "Received",
                            ].map((label) => (
                              <th
                                key={label}
                                scope="col"
                                className="whitespace-nowrap px-4 py-3 font-medium"
                              >
                                {label}
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-zinc-800/70">
                          {transfer.items.map((item) => (
                            <tr
                              key={item.id}
                              className="transition-colors hover:bg-zinc-900/30"
                            >
                              <td className="min-w-[220px] px-4 py-3">
                                <p className="text-xs font-semibold text-zinc-200">
                                  {item.ingredient?.name ??
                                    "Stock item"}
                                </p>

                                <p className="mt-1 whitespace-nowrap font-mono text-[8px] text-zinc-600">
                                  {item.ingredientId}
                                </p>

                                <p className="mt-1 text-[9px] text-zinc-500">
                                  Unit:{" "}
                                  {item.ingredient?.uom ?? "—"}
                                </p>
                              </td>

                              <td className="px-4 py-3 font-mono text-zinc-400">
                                {quantity(item.requestedQty)}
                              </td>

                              <td className="px-4 py-3 font-mono text-sky-300">
                                {quantity(item.approvedQty)}
                              </td>

                              <td className="px-4 py-3 font-mono text-amber-300">
                                {quantity(item.shippedQty)}
                              </td>

                              <td className="px-4 py-3 font-mono text-emerald-300">
                                {quantity(item.receivedQty)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {transfer.items.length === 0 && (
                      <p className="p-8 text-center text-xs text-zinc-500">
                        No stock items found.
                      </p>
                    )}
                  </div>

                  {/* SHIPMENT INFORMATION */}

                  {shipment && (
                    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
                        <Truck className="h-3.5 w-3.5 text-emerald-400" />

                        <p className={inventoryLabelClass}>
                          Shipment Information
                        </p>
                      </div>

                      <div className="space-y-4 p-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <DetailField
                            label="Carrier"
                            value={shipment.carrierName}
                          />

                          <DetailField
                            label="Tracking Number"
                            value={shipment.trackingNumber}
                            mono
                          />

                          <DetailField
                            label="Dispatcher"
                            value={shipment.shipperName}
                          />

                          <DetailField
                            label="Dispatcher Phone"
                            value={shipment.shipperPhone}
                          />

                          <DetailField
                            label="Driver"
                            value={shipment.driverName}
                          />

                          <DetailField
                            label="Driver Phone"
                            value={shipment.driverPhone}
                          />

                          <DetailField
                            label="Vehicle Number"
                            value={shipment.vehicleNumber}
                            mono
                          />

                          <DetailField
                            label="Vehicle Type"
                            value={shipment.vehicleType}
                          />

                          <DetailField
                            label="Dispatch Location"
                            value={shipment.dispatchLocation}
                          />

                          <DetailField
                            label="Delivery Location"
                            value={shipment.deliveryLocation}
                          />

                          <DetailField
                            label="Estimated Arrival"
                            value={date(
                              shipment.estimatedArrival,
                            )}
                          />

                          <DetailField
                            label="Dispatched"
                            value={date(shipment.dispatchedAt)}
                          />

                          <DetailField
                            label="Delivered"
                            value={date(shipment.deliveredAt)}
                          />
                        </div>

                        {shipment.notes && (
                          <div className="border-t border-zinc-800 pt-3">
                            <p className={inventoryLabelClass}>
                              Notes
                            </p>

                            <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-zinc-400">
                              {shipment.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* DELIVERY DISCREPANCIES */}

                  {discrepancies.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />

                        <p className={inventoryLabelClass}>
                          Delivery Discrepancies
                        </p>
                      </div>

                      <div className="space-y-3">
                        {discrepancies.map((item) => {
                          const stockItem = transfer.items.find(
                            (line) =>
                              line.id === item.transferItemId,
                          );

                          return (
                            <div
                              key={item.id}
                              className="space-y-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs font-semibold text-zinc-200">
                                    {stockItem?.ingredient?.name ??
                                      stockItem?.ingredientId ??
                                      "Stock item"}
                                  </p>

                                  <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-rose-300">
                                    {item.type.replaceAll(
                                      "_",
                                      " ",
                                    )}
                                  </p>
                                </div>

                                <span
                                  className={`rounded-md border px-2 py-1 font-mono text-[8px] uppercase ${
                                    item.resolvedAt
                                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                      : "border-rose-500/20 bg-rose-500/10 text-rose-300"
                                  }`}
                                >
                                  {item.resolvedAt
                                    ? "Resolved"
                                    : "Open"}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <DetailField
                                  label="Expected"
                                  value={`${quantity(
                                    item.expectedQty,
                                  )} ${
                                    stockItem?.ingredient?.uom ??
                                    ""
                                  }`.trim()}
                                />

                                <DetailField
                                  label="Actual"
                                  value={`${quantity(
                                    item.actualQty,
                                  )} ${
                                    stockItem?.ingredient?.uom ??
                                    ""
                                  }`.trim()}
                                />
                              </div>

                              {item.reason && (
                                <DetailField
                                  label="Reported Reason"
                                  value={item.reason}
                                />
                              )}

                              {item.resolvedAt && (
                                <div className="space-y-3 border-t border-rose-500/10 pt-3">
                                  <DetailField
                                    label="Resolution"
                                    value={item.resolution}
                                  />

                                  <DetailField
                                    label="Resolved On"
                                    value={date(item.resolvedAt)}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* STATUS ACTIONS */}

                  {transfer.status === "APPROVED" && (
                    <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                      <p className={inventoryLabelClass}>
                        Warehouse Preparation
                      </p>

                      <p className="text-[11px] leading-relaxed text-zinc-500">
                        Start picking the approved stock items
                        for this restaurant.
                      </p>

                      <button
                        type="button"
                        disabled={blocked}
                        className={actionClass}
                        onClick={() =>
                          void runAction(
                            () =>
                              startTransferPicking(
                                transfer.id,
                              ),
                            "Picking started successfully.",
                          )
                        }
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Package className="h-4 w-4" />
                        )}

                        Start Picking
                      </button>
                    </div>
                  )}

                  {transfer.status === "PICKING" && (
                    <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                      <p className={inventoryLabelClass}>
                        Picking and Packing
                      </p>

                      <p className="text-[11px] leading-relaxed text-zinc-500">
                        Mark ready after the stock items have
                        been picked and packed.
                      </p>

                      <button
                        type="button"
                        disabled={blocked}
                        className={actionClass}
                        onClick={() =>
                          void runAction(
                            () =>
                              markTransferReadyToShip(
                                transfer.id,
                              ),
                            "Transfer marked ready to ship.",
                          )
                        }
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}

                        Mark Ready to Ship
                      </button>
                    </div>
                  )}

                  {transfer.status === "READY_TO_SHIP" &&
                    !shipment && (
                      <ShipmentForm
                        saving={saving}
                        disabled={needsRefresh}
                        onSubmit={(input) =>
                          runAction(
                            () =>
                              createTransferShipment(
                                transfer.id,
                                input,
                              ),
                            "Shipment registered successfully.",
                          )
                        }
                      />
                    )}

                  {transfer.status === "READY_TO_SHIP" &&
                    shipment && (
                      <DispatchForm
                        key={transfer.updatedAt}
                        transfer={transfer}
                        saving={saving}
                        disabled={needsRefresh}
                        onSubmit={(input) =>
                          runAction(
                            () =>
                              shipStockTransfer(
                                transfer.id,
                                input,
                              ),
                            "Transfer shipped. Warehouse stock has been deducted.",
                          )
                        }
                      />
                    )}

                  {transfer.status === "SHIPPED" && (
                    <button
                      type="button"
                      disabled={blocked}
                      className={actionClass}
                      onClick={() =>
                        void runAction(
                          () =>
                            markTransferInTransit(
                              transfer.id,
                            ),
                          "Transfer marked in transit.",
                        )
                      }
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Truck className="h-4 w-4" />
                      )}

                      Mark In Transit
                    </button>
                  )}

                  {["SHIPPED", "IN_TRANSIT"].includes(
                    transfer.status,
                  ) && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-zinc-400">
                      Awaiting restaurant receipt. The
                      restaurant checks the delivery and
                      confirms the actual quantities received.
                    </div>
                  )}

                  {transfer.status === "DISPUTED" && (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();

                        const text = resolution.trim();

                        if (
                          text.length < 3 ||
                          text.length > 500
                        ) {
                          setError(
                            "Enter a resolution between 3 and 500 characters.",
                          );
                          return;
                        }

                        void runAction(
                          () =>
                            resolveTransferDiscrepancy(
                              transfer.id,
                              text,
                            ),
                          "Discrepancy resolved and transfer completed.",
                        );
                      }}
                      className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                    >
                      <label
                        htmlFor={resolutionId}
                        className={inventoryLabelClass}
                      >
                        Discrepancy Resolution
                      </label>

                      <textarea
                        id={resolutionId}
                        rows={4}
                        maxLength={500}
                        required
                        value={resolution}
                        disabled={blocked}
                        onChange={(event) =>
                          setResolution(event.target.value)
                        }
                        className={`${inventoryInputClass} resize-none`}
                        placeholder="Describe the investigation and agreed resolution..."
                      />

                      <p className="text-right font-mono text-[9px] text-zinc-600">
                        {resolution.length}/500
                      </p>

                      <p className="text-[11px] leading-relaxed text-zinc-500">
                        Resolution completes the transfer and
                        settles remaining transit quantities
                        according to the backend workflow.
                      </p>

                      <button
                        type="submit"
                        disabled={
                          blocked ||
                          !discrepancies.some(
                            (item) => !item.resolvedAt,
                          )
                        }
                        className={actionClass}
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}

                        Resolve and Complete
                      </button>
                    </form>
                  )}

                  {transfer.status === "COMPLETED" && (
                    <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] leading-relaxed text-emerald-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

                      <p>
                        This transfer is complete. Shipment
                        details and stock quantities are
                        available above.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* FIXED POPUP FOOTER */}

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-950/80 px-5 py-3 sm:px-6">
          <span
            role="status"
            className="flex items-center gap-2 text-[10px] text-zinc-600"
          >
            {saving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
                Saving changes...
              </>
            ) : (
              "Warehouse transfer details"
            )}
          </span>

          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-2 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}