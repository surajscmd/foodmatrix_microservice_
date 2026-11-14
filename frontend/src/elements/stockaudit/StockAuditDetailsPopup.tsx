"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ClipboardList, Copy, X } from "lucide-react";

import type { StockMovementView } from "@/utils/types/inventory";

import {
  AuditMovementBadge,
  AuditQuantity,
} from "./StockAuditTable";

interface Props {
  movement: StockMovementView;
  locationName: string;
  onClose: () => void;
}

function CopyField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  useEffect(() => {
    if (!copied) return;

    const timeout = window.setTimeout(() => setCopied(false), 1500);

    return () => window.clearTimeout(timeout);
  }, [copied]);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
      <p className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">
        {label}
      </p>

      <div className="mt-2 flex items-start justify-between gap-3">
        <p className="break-all font-mono text-[10px] leading-relaxed text-zinc-300">
          {value || "—"}
        </p>

        {value && (
          <button
            type="button"
            aria-label={`Copy ${label}`}
            onClick={() => {
              setCopyError("");

              void navigator.clipboard
                .writeText(value)
                .then(() => setCopied(true))
                .catch(() => setCopyError("Select and copy the value manually."));
            }}
            className="shrink-0 rounded-lg p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-emerald-300"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      {copyError && (
        <p role="status" className="mt-2 text-[10px] text-amber-300">
          {copyError}
        </p>
      )}
    </div>
  );
}

export default function StockAuditDetailsPopup({
  movement,
  locationName,
  onClose,
}: Props) {
  const titleId = useId();
  const popupRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

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
        closeRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const popup = popupRef.current;
      if (!popup) return;

      const elements = Array.from(
        popup.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], [tabindex="0"]',
        ),
      ).filter(
        (element) =>
          element.tabIndex >= 0 &&
          element.getClientRects().length > 0,
      );

      const first = elements[0];
      const last = elements[elements.length - 1];
      const active = document.activeElement;

      if (!first || !last) {
        event.preventDefault();
        popup.focus();
        return;
      }

      if (!popup.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (
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

      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-zinc-950/75 p-3 backdrop-blur-md sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={popupRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#0c0c0e] text-zinc-300 shadow-2xl outline-none"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
              <ClipboardList className="h-4 w-4 text-emerald-400" />
            </div>

            <div>
              <h2 id={titleId} className="text-sm font-semibold text-zinc-100">
                Audit Record
              </h2>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-500">
                Inventory Movement Details
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close audit details"
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 space-y-4 overflow-y-auto p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div>
              <p className="text-sm font-semibold text-zinc-200">
                {movement.ingredient?.name ?? "Stock item"}
              </p>
              <p className="mt-1 text-[10px] text-zinc-500">
                {locationName} · {movement.locationType}
              </p>
            </div>

            <div className="space-y-2 text-right">
              <AuditMovementBadge type={movement.movementType} />
              <p>
                <AuditQuantity
                  value={movement.quantityChange}
                  unit={movement.ingredient?.uom}
                />
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <p className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">
              Recorded On
            </p>

            <p className="mt-2 text-xs text-zinc-300">
              {new Date(movement.createdAt).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                timeZoneName: "short",
              })}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CopyField label="Movement ID" value={movement.id} />
            <CopyField label="Ingredient ID" value={movement.ingredientId} />
            <CopyField label="Location ID" value={movement.locationId} />
            <CopyField label="Reference ID" value={movement.referenceId} />
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <p className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">
              Reason
            </p>

            <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-zinc-300">
              {movement.reason?.trim() || "No reason recorded."}
            </p>
          </div>

          <p className="text-[10px] leading-relaxed text-zinc-600">
            This is a read-only audit entry. Stock corrections create
            additional movement records.
          </p>
        </div>

        <div className="flex shrink-0 justify-end border-t border-zinc-800 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-2 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}