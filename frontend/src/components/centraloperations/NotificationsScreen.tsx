"use client";

import { useEffect, useState } from "react";

import {
  Bell,
  CheckCheck,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { getNotifications } from "@/lib/notification-api";
import { useNotifications } from "@/providers/NotificationProvider";

import NotificationCard from "@/elements/notifications/NotificationCard";
import NotificationPagination from "@/elements/notifications/NotificationPagination";

import type {
  NotificationListResponse,
} from "@/utils/types/notification";

type ReadFilter = "all" | "unread" | "read";

export default function NotificationsScreen() {
  const notifications = useNotifications();

  if (!notifications) {
    return (
      <div className="p-6 text-xs text-rose-300">
        NotificationProvider must wrap this layout.
      </div>
    );
  }

  if (!notifications.locationId) {
    return (
      <div className="p-6">
        <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 text-xs text-zinc-500">
          {notifications.scope === "WAREHOUSE"
            ? "Warehouse information is not available yet."
            : "No restaurant is assigned or selected."}
        </div>
      </div>
    );
  }

  return (
    <NotificationWorkspace
      key={`${notifications.scope}:${notifications.locationId}`}
      notifications={notifications}
    />
  );
}

function NotificationWorkspace({
  notifications,
}: {
  notifications: NonNullable<ReturnType<typeof useNotifications>>;
}) {
  const [query, setQuery] = useState<{
    filter: ReadFilter;
    page: number;
    limit: number;
  }>({
    filter: "all",
    page: 1,
    limit: 10,
  });

  const [result, setResult] =
    useState<NotificationListResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const {
    scope,
    locationId,
    locationName,
    revision,
  } = notifications;

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getNotifications(
          scope,
          locationId,
          {
            page: query.page,
            limit: query.limit,
            ...(query.filter !== "all"
              ? { isRead: query.filter === "read" }
              : {}),
          },
          { signal: controller.signal },
        );

        if (controller.signal.aborted) return;

        const lastPage = Math.max(
          1,
          response.pagination.totalPages,
        );

        if (query.page > lastPage) {
          setQuery((current) =>
            current === query
              ? { ...current, page: lastPage }
              : current,
          );
          return;
        }

        setResult(response);
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load notifications.",
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
  }, [scope, locationId, revision, query, retryKey]);

  const filters: {
    value: ReadFilter;
    label: string;
  }[] = [
    { value: "all", label: "All Notifications" },
    { value: "unread", label: "Unread" },
    { value: "read", label: "Read" },
  ];

  return (
    <div className="space-y-6">
      <header className="px-6 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-4 w-1 rounded-full bg-emerald-400" />

            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                {scope === "WAREHOUSE"
                  ? "Warehouse Notifications"
                  : "Restaurant Notifications"}
              </p>

              <p className="mt-0.5 text-[10px] text-zinc-600">
                {locationName} · Activity and operational updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-mono text-[9px] text-zinc-500">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  notifications.connected
                    ? "bg-emerald-400"
                    : "bg-amber-400"
                }`}
              />
              {notifications.connected ? "Connected" : "Offline"}
            </span>

            <button
              type="button"
              disabled={notifications.syncing}
              onClick={() => {
                notifications.refresh();
                setRetryKey((value) => value + 1);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 transition-colors hover:border-emerald-500/30 hover:text-emerald-400 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  notifications.syncing ? "animate-spin" : ""
                }`}
              />
              Sync
            </button>
          </div>
        </div>
      </header>

      <div className="space-y-5 px-6 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
              <Bell className="h-4 w-4 text-emerald-400" />
            </div>

            <div>
              <p className="text-sm font-semibold text-zinc-200">
                {notifications.loading
                  ? "—"
                  : notifications.unreadCount}{" "}
                unread
              </p>

              <p className="mt-1 text-[10px] text-zinc-500">
                {notifications.loading
                  ? "Loading..."
                  : `${notifications.totalCount} total notifications`}
              </p>
            </div>
          </div>

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
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-40"
          >
            {notifications.busyId === "all" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            Mark All Read
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={query.filter === filter.value}
              onClick={() =>
                setQuery((current) => ({
                  ...current,
                  filter: filter.value,
                  page: 1,
                }))
              }
              className={`rounded-xl border px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                query.filter === filter.value
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                  : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {(notifications.actionError || notifications.error) && (
          <p
            role="alert"
            className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300"
          >
            {notifications.actionError || notifications.error}
          </p>
        )}

        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80">
          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center gap-2 text-xs text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
              Loading notifications...
            </div>
          ) : error ? (
            <div role="alert" className="space-y-3 p-10 text-center">
              <p className="text-xs text-rose-300">{error}</p>

              <button
                type="button"
                onClick={() => setRetryKey((value) => value + 1)}
                className="text-xs text-emerald-300"
              >
                Retry
              </button>
            </div>
          ) : !result?.data.length ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 p-8">
              <Bell className="h-7 w-7 text-zinc-700" />
              <p className="text-xs text-zinc-500">
                No notifications found.
              </p>
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {result.data.map((item) => (
                <NotificationCard
                  key={item.id}
                  notification={item}
                  busy={notifications.busyId === item.id}
                  disabled={
                    notifications.busyId !== null ||
                    notifications.syncing
                  }
                  onMarkRead={notifications.markRead}
                />
              ))}
            </div>
          )}

          {!loading && !error && result && (
            <NotificationPagination
              page={result.pagination.page}
              limit={result.pagination.limit}
              total={result.pagination.total}
              onPageChange={(page) =>
                setQuery((current) => ({ ...current, page }))
              }
              onLimitChange={(limit) =>
                setQuery((current) => ({
                  ...current,
                  limit,
                  page: 1,
                }))
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}