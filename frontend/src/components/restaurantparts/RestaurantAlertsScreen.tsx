"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, Loader2, RefreshCw, Search } from "lucide-react";

import NotificationCard from "@/elements/notifications/NotificationCard";
import NotificationPagination from "@/elements/notifications/NotificationPagination";
import { getNotifications } from "@/lib/notification-api";
import { useNotifications } from "@/providers/NotificationProvider";
import { useOrganizationStore } from "@/store/organization-store";
import type {
  NotificationListResponse,
  NotificationPriority,
  NotificationQuery,
} from "@/utils/types/notification";

type ReadFilter = "all" | "unread" | "read";
type AlertsQuery = {
  filter: ReadFilter;
  priority: NotificationPriority | "";
  search: string;
  page: number;
  limit: number;
};

const filters = [
  { value: "all", label: "All Notifications" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
] as const;

const field =
  "min-h-9 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 text-[11px] text-zinc-400 scheme-dark focus-visible:outline-2 focus-visible:outline-emerald-300";

export default function RestaurantAlertsScreen() {
  const inbox = useNotifications();
  const hydrated = useOrganizationStore((state) => state.isHydrated);
  const organizationError = useOrganizationStore((state) => state.error);
  if (!inbox?.locationId || inbox.scope !== "RESTAURANT") {
    return (
      <p
        role="status"
        className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300"
      >
        {!hydrated
          ? "Loading restaurant…"
          : organizationError || "No restaurant is assigned to this account."}
      </p>
    );
  }

  return <AlertsInbox key={inbox.locationId} inbox={inbox} />;
}

function AlertsInbox({
  inbox,
}: {
  inbox: NonNullable<ReturnType<typeof useNotifications>>;
}) {
  const [query, setQuery] = useState<AlertsQuery>({
    filter: "all",
    priority: "",
    search: "",
    page: 1,
    limit: 10,
  });
  const [searchText, setSearchText] = useState("");
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    list?: NotificationListResponse;
    error?: string;
  }>();
  const { locationId, revision } = inbox;
  const requestKey = JSON.stringify([locationId, query, retry]);
  const list = result?.key === requestKey ? result.list : undefined;
  const error = result?.key === requestKey ? result.error : undefined;
  const loading = !list && !error;

  useEffect(() => {
    const controller = new AbortController();
    const params: NotificationQuery = {
      page: query.page,
      limit: query.limit,
      isRead: query.filter === "all" ? undefined : query.filter === "read",
      priority: query.priority || undefined,
      search: query.search,
    };

    getNotifications("RESTAURANT", locationId, params, {
      signal: controller.signal,
    })
      .then((response) => {
        if (controller.signal.aborted) return;
        const lastPage = Math.max(1, response.pagination.totalPages);
        if (query.page > lastPage) {
          setQuery((current) =>
            current === query ? { ...current, page: lastPage } : current,
          );
          return;
        }
        setResult({ key: requestKey, list: response });
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setResult({
            key: requestKey,
            error:
              cause instanceof Error ? cause.message : "Unable to load alerts.",
          });
        }
      });

    return () => controller.abort();
  }, [locationId, revision, query, requestKey]);

  function refresh() {
    inbox.refresh();
    setRetry((value) => value + 1);
  }

  return (
    <div className="@container space-y-6">
      <header className="pt-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden className="h-4 w-1 rounded-full bg-emerald-400" />
            <div className="min-w-0">
              <h1 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                Restaurant alerts
              </h1>
              <p className="mt-0.5 text-[10px] text-zinc-600">
                Activity and operational updates
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              role="status"
              className="inline-flex items-center gap-1.5 font-mono text-[9px] text-zinc-500"
            >
              <span
                aria-hidden
                className={`h-1.5 w-1.5 rounded-full ${inbox.connected ? "bg-emerald-400" : "bg-amber-400"}`}
              />
              {inbox.connected ? "Connected" : "Offline"}
            </span>
            <button
              type="button"
              aria-label="Sync restaurant alerts"
              onClick={refresh}
              disabled={inbox.syncing}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 transition-colors enabled:hover:border-emerald-500/30 enabled:hover:text-emerald-400 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={inbox.syncing ? "motion-safe:animate-spin" : ""}
                aria-hidden
              />
              Sync
            </button>
          </div>
        </div>
      </header>

      <div className="space-y-5 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              <Bell size={16} aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold tabular-nums text-zinc-200">
                {inbox.loading || inbox.error ? "—" : inbox.unreadCount} unread
              </p>
              <p className="mt-1 text-[10px] text-zinc-500">
                {inbox.loading
                  ? "Loading..."
                  : inbox.error
                    ? "Notification count unavailable"
                    : `${inbox.totalCount} total notifications`}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={
              inbox.loading ||
              inbox.syncing ||
              !!inbox.error ||
              inbox.unreadCount === 0 ||
              inbox.busyId !== null
            }
            onClick={() => void inbox.markAllRead().catch(() => {})}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition-colors enabled:hover:bg-emerald-500/20 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-40"
          >
            {inbox.busyId === "all" ? (
              <Loader2
                size={14}
                className="motion-safe:animate-spin"
                aria-hidden
              />
            ) : (
              <CheckCheck size={14} aria-hidden />
            )}
            Mark All Read
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="group"
            aria-label="Read status"
            className="flex flex-wrap gap-2"
          >
            {filters.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={query.filter === value}
                onClick={() =>
                  setQuery((current) =>
                    current.filter === value
                      ? current
                      : { ...current, filter: value, page: 1 },
                  )
                }
                className={`rounded-xl border px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-emerald-300 ${query.filter === value ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 @3xl:w-auto">
            <select
              aria-label="Alert priority"
              value={query.priority}
              onChange={(event) =>
                setQuery((current) => ({
                  ...current,
                  priority: event.target.value as AlertsQuery["priority"],
                  page: 1,
                }))
              }
              className={field}
            >
              <option value="">All priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Low</option>
            </select>
            <form
              role="search"
              className="flex min-w-0 flex-1 gap-2 @3xl:flex-none"
              onSubmit={(event) => {
                event.preventDefault();
                const search = searchText.trim();
                setQuery((current) =>
                  current.search === search
                    ? current
                    : { ...current, search, page: 1 },
                );
              }}
            >
              <input
                type="search"
                aria-label="Search alert title or message"
                placeholder="Search alerts"
                value={searchText}
                maxLength={120}
                onChange={(event) => {
                  const value = event.target.value;
                  setSearchText(value);
                  if (!value)
                    setQuery((current) =>
                      current.search
                        ? { ...current, search: "", page: 1 }
                        : current,
                    );
                }}
                className={`${field} w-full min-w-0 @3xl:w-44`}
              />
              <button
                type="submit"
                aria-label="Search alerts"
                title="Search alerts"
                className={`${field} grid shrink-0 place-items-center transition-colors hover:border-emerald-500/30 hover:text-emerald-400`}
              >
                <Search size={14} aria-hidden />
              </button>
            </form>
          </div>
        </div>

        {(inbox.actionError || (inbox.error && !error)) && (
          <p
            role="alert"
            className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300"
          >
            {inbox.actionError || inbox.error}
          </p>
        )}

        <section
          aria-label="Restaurant alert inbox"
          className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80"
        >
          {loading ? (
            <p
              role="status"
              className="flex min-h-[240px] items-center justify-center gap-2 text-xs text-zinc-500"
            >
              <Loader2
                size={16}
                className="motion-safe:animate-spin text-emerald-400"
                aria-hidden
              />
              Loading alerts...
            </p>
          ) : error ? (
            <div role="alert" className="space-y-3 p-10 text-center">
              <p className="text-xs text-rose-300">{error}</p>
              <button
                type="button"
                onClick={refresh}
                className="rounded-lg px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-400/10 focus-visible:outline-2 focus-visible:outline-emerald-300"
              >
                Retry
              </button>
            </div>
          ) : list?.data.length ? (
            <div className="space-y-3 p-4">
              {list.data.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  busy={inbox.busyId === notification.id}
                  disabled={inbox.busyId !== null || inbox.syncing}
                  onMarkRead={inbox.markRead}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 p-8 text-center">
              <Bell size={28} className="text-zinc-700" aria-hidden />
              <p className="text-xs text-zinc-500">
                {query.search || query.filter !== "all" || query.priority
                  ? "No alerts match these filters."
                  : "No restaurant alerts yet."}
              </p>
            </div>
          )}
          {!loading && !error && list && (
            <NotificationPagination
              page={list.pagination.page}
              limit={list.pagination.limit}
              total={list.pagination.total}
              onPageChange={(page) =>
                setQuery((current) => ({ ...current, page }))
              }
              onLimitChange={(limit) =>
                setQuery((current) => ({ ...current, limit, page: 1 }))
              }
            />
          )}
        </section>
      </div>
    </div>
  );
}
