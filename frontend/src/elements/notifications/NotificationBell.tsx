"use client";

import Link from "next/link";

import {
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import {
  Bell,
  CheckCheck,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";

import { useNotifications } from "@/providers/NotificationProvider";
import NotificationCard from "./NotificationCard";

interface Props {
  fallbackCount?: number;
  onOpenFallback?: () => void;
}

export default function NotificationBell({
  fallbackCount = 0,
  onOpenFallback,
}: Props) {
  const notifications = useNotifications();

  const [open, setOpen] = useState(false);
  const panelId = useId();

  const containerRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const locationId = notifications?.locationId ?? "";
  useEffect(() => {
    if (!open) return;

    closeRef.current?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        bellRef.current?.focus();
      }
    };

    const handleFocus = (event: FocusEvent) => {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocus);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocus);
    };
  }, [open]);

  const count = notifications
    ? notifications.unreadCount
    : fallbackCount;

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={bellRef}
        type="button"
        disabled={Boolean(notifications && !locationId)}
        aria-label={`Notifications, ${count} unread`}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => {
          if (!notifications) {
            onOpenFallback?.();
            return;
          }

          const next = !open;
          setOpen(next);

          if (next) notifications.refresh();
        }}
        className="relative rounded-xl border border-transparent p-2 text-zinc-400 transition-all hover:border-zinc-800 hover:bg-zinc-900 hover:text-white disabled:opacity-40"
      >
        <Bell className="h-4 w-4" />

        {count > 0 && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        )}
      </button>

      {open && notifications && (
        <section
          id={panelId}
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-3 w-[min(380px,calc(100vw-3rem))] overflow-hidden rounded-2xl border border-zinc-800 bg-[#0c0c0e] shadow-2xl"
        >
          <div className="flex items-start justify-between gap-3 border-b border-zinc-800 p-4">
            <div>
              <p className="text-xs font-semibold text-zinc-200">
                {notifications.scope === "WAREHOUSE"
                  ? "Warehouse Notifications"
                  : "Restaurant Notifications"}
              </p>

              <p className="mt-1 text-[10px] text-zinc-500">
                {notifications.locationName}
              </p>

              <p className="mt-1 font-mono text-[9px] text-emerald-400">
                {notifications.unreadCount} unread
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={notifications.syncing}
                onClick={notifications.refresh}
                aria-label="Refresh notifications"
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-900 hover:text-emerald-300 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    notifications.syncing ? "animate-spin" : ""
                  }`}
                />
              </button>

              <button
                ref={closeRef}
                type="button"
                onClick={() => {
                  setOpen(false);
                  bellRef.current?.focus();
                }}
                aria-label="Close notifications"
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-900 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-[55dvh] space-y-3 overflow-y-auto p-3">
            {(notifications.error || notifications.actionError) && (
              <p
                role="alert"
                className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-[11px] text-rose-300"
              >
                {notifications.actionError || notifications.error}
              </p>
            )}

            {notifications.loading ? (
              <div className="flex items-center justify-center gap-2 p-8 text-xs text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                Loading...
              </div>
            ) : notifications.preview.length === 0 ? (
              <p className="p-8 text-center text-xs text-zinc-500">
                No notifications to display.
              </p>
            ) : (
              notifications.preview.map((item) => (
                <NotificationCard
                  key={item.id}
                  notification={item}
                  compact
                  busy={notifications.busyId === item.id}
                  disabled={
                    notifications.busyId !== null ||
                    notifications.syncing
                  }
                  onMarkRead={notifications.markRead}
                />
              ))
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-zinc-800 px-4 py-3">
            <button
              type="button"
              disabled={
                notifications.unreadCount === 0 ||
                notifications.busyId !== null ||
                notifications.syncing ||
                notifications.loading
              }
              onClick={() => {
                void notifications.markAllRead().catch(() => {});
              }}
              className="inline-flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-emerald-300 disabled:opacity-40"
            >
              {notifications.busyId === "all" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCheck className="h-3 w-3" />
              )}
              Mark All Read
            </button>

            <Link
              href={notifications.notificationsHref}
              onClick={() => setOpen(false)}
              className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300"
            >
              View All
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}