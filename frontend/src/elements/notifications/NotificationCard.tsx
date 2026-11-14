"use client";

import Link from "next/link";
import { useId, useState } from "react";

import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
  Package,
  Users,
} from "lucide-react";

import usePlatformFormatter from "@/hooks/usePlatformFormatter";

import type {
  NotificationItem,
  NotificationPriority,
} from "@/utils/types/notification";

interface Props {
  notification: NotificationItem;
  busy: boolean;
  disabled: boolean;
  compact?: boolean;
  onMarkRead: (id: string) => Promise<void>;
}

const priorityClasses: Record<NotificationPriority, string> = {
  LOW: "border-zinc-700 bg-zinc-800/50 text-zinc-400",
  NORMAL: "border-sky-500/20 bg-sky-500/10 text-sky-300",
  HIGH: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  CRITICAL: "border-rose-500/20 bg-rose-500/10 text-rose-300",
};

export default function NotificationCard({
  notification,
  busy,
  disabled,
  compact = false,
  onMarkRead,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const detailsId = useId();
  const { formatDateTime } = usePlatformFormatter();

  const isStock =
    notification.type.startsWith("STOCK_") ||
    notification.type === "LOW_STOCK";

  const isEmployee =
    notification.type.startsWith("EMPLOYEE_") ||
    notification.type === "LEAVE_APPLIED";

  const Icon =
    notification.priority === "CRITICAL" ||
    notification.type === "ALERT"
      ? AlertTriangle
      : isStock
        ? Package
        : isEmployee
          ? Users
          : Bell;

  const target =
    notification.scope !== "WAREHOUSE"
      ? null
      : notification.referenceType === "StockRequest"
        ? {
            href: "/operations/stockrequests",
            label: "Open Stock Requests",
          }
        : notification.referenceType === "StockTransfer"
          ? {
              href: "/operations/fulfillment",
              label: "Open Fulfillment Ledger",
            }
          : null;

  return (
    <article
      className={`rounded-xl border p-4 transition-colors ${
        notification.isRead
          ? "border-zinc-800 bg-zinc-950/50"
          : "border-emerald-500/15 bg-emerald-500/[0.03]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
            notification.isRead
              ? "border-zinc-800 bg-zinc-900 text-zinc-500"
              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xs font-semibold text-zinc-200">
              {notification.title}
            </h3>

            {!notification.isRead && (
              <span
                title="Unread"
                className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400"
              />
            )}
          </div>

          <p
            className={`mt-1.5 text-[11px] leading-relaxed text-zinc-500 ${
              compact && !expanded ? "line-clamp-2" : ""
            }`}
          >
            {notification.message}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-md border px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-wider ${
                priorityClasses[notification.priority]
              }`}
            >
              {notification.priority}
            </span>

            <time
              dateTime={notification.createdAt}
              className="font-mono text-[9px] text-zinc-600"
            >
              {formatDateTime(notification.createdAt)}
            </time>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-800/70 pt-3">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-200"
        >
          {expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}

          {expanded ? "Hide Details" : "Details"}
        </button>

        {notification.isRead ? (
          <span className="inline-flex items-center gap-1 font-mono text-[9px] text-zinc-600">
            <CheckCheck className="h-3 w-3" />
            Read
          </span>
        ) : (
          <button
            type="button"
            disabled={disabled || busy}
            aria-label={`Mark ${notification.title} as read`}
            onClick={() => {
              void onMarkRead(notification.id).catch(() => {
                // Errors are displayed by NotificationProvider consumers.
              });
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}

            {busy ? "Saving..." : "Mark Read"}
          </button>
        )}
      </div>

      <div id={detailsId} hidden={!expanded}>
        {expanded && (
          <div className="mt-3 space-y-3 border-t border-zinc-800/70 pt-3">
            <div>
              <p className="font-mono text-[8px] uppercase text-zinc-600">
                Notification ID
              </p>

              <p className="mt-1 break-all font-mono text-[9px] text-zinc-400">
                {notification.id}
              </p>
            </div>

            <div>
              <p className="font-mono text-[8px] uppercase text-zinc-600">
                Type
              </p>

              <p className="mt-1 font-mono text-[9px] text-zinc-400">
                {notification.type.replaceAll("_", " ")}
              </p>
            </div>

            {notification.referenceId && (
              <div>
                <p className="font-mono text-[8px] uppercase text-zinc-600">
                  {notification.referenceType ?? "Reference"}
                </p>

                <p className="mt-1 break-all font-mono text-[9px] text-zinc-400">
                  {notification.referenceId}
                </p>
              </div>
            )}

            {notification.readAt && (
              <p className="text-[10px] text-zinc-500">
                Read{" "}
                <time dateTime={notification.readAt}>
                  {formatDateTime(notification.readAt)}
                </time>
              </p>
            )}

            {target && (
              <Link
                href={target.href}
                className="inline-flex rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-[10px] text-cyan-300 hover:bg-cyan-500/20"
              >
                {target.label}
              </Link>
            )}
          </div>
        )}
      </div>
    </article>
  );
}