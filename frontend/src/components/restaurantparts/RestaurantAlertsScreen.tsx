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
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
] as const;

const field = "min-h-9 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 text-xs text-zinc-100 scheme-dark focus-visible:outline-2 focus-visible:outline-emerald-300";

export default function RestaurantAlertsScreen() {
  const inbox = useNotifications();
  const hydrated = useOrganizationStore((state) => state.isHydrated);
  const organizationError = useOrganizationStore((state) => state.error);
  if (!inbox?.locationId || inbox.scope !== "RESTAURANT") {
    return (
      <p role="status" className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
        {!hydrated ? "Loading restaurant…" : organizationError || "No restaurant is assigned to this account."}
      </p>
    );
  }

  return <AlertsInbox key={inbox.locationId} inbox={inbox} />;
}

function AlertsInbox({ inbox }: { inbox: NonNullable<ReturnType<typeof useNotifications>> }) {
  const [query, setQuery] = useState<AlertsQuery>({ filter: "all", priority: "", search: "", page: 1, limit: 10 });
  const [searchText, setSearchText] = useState("");
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{ key: string; list?: NotificationListResponse; error?: string }>();
  const { locationId, locationName, revision } = inbox;
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

    getNotifications("RESTAURANT", locationId, params, { signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;
        const lastPage = Math.max(1, response.pagination.totalPages);
        if (query.page > lastPage) {
          setQuery((current) => current === query ? { ...current, page: lastPage } : current);
          return;
        }
        setResult({ key: requestKey, list: response });
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setResult({ key: requestKey, error: cause instanceof Error ? cause.message : "Unable to load alerts." });
        }
      });

    return () => controller.abort();
  }, [locationId, revision, query, requestKey]);

  function refresh() {
    inbox.refresh();
    setRetry((value) => value + 1);
  }

  return (
    <div className="@container space-y-4">
      <header className="overflow-hidden rounded-2xl border border-zinc-700/75 bg-zinc-950 shadow-lg shadow-black/20">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-400/20 bg-linear-to-r from-teal-800 to-slate-800 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-300 text-emerald-950">
              <Bell size={19} aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold tracking-tight text-white">Restaurant Alerts</h1>
              <p className="mt-0.5 break-words text-xs text-teal-100">{locationName}</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Refresh alerts"
            title="Refresh alerts"
            onClick={refresh}
            disabled={inbox.syncing}
            className="grid size-9 place-items-center rounded-lg border border-white/20 bg-white/5 text-white enabled:hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-50"
          >
            <RefreshCw size={15} className={inbox.syncing ? "motion-safe:animate-spin" : ""} aria-hidden />
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#18191d] px-4 py-2.5">
          <p className="flex items-center gap-2 text-xs text-zinc-400 tabular-nums">
            <span className="font-semibold text-emerald-200">{inbox.loading || inbox.error ? "—" : inbox.unreadCount} unread</span>
            <span aria-hidden>·</span>
            {inbox.loading || inbox.error ? "—" : inbox.totalCount} total
          </p>
          <button
            type="button"
            disabled={inbox.loading || inbox.syncing || !!inbox.error || inbox.unreadCount === 0 || inbox.busyId !== null}
            onClick={() => void inbox.markAllRead().catch(() => {})}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 text-xs font-semibold text-emerald-200 enabled:hover:bg-emerald-400/20 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-50"
          >
            {inbox.busyId === "all" ? <Loader2 size={15} className="motion-safe:animate-spin" aria-hidden /> : <CheckCheck size={15} aria-hidden />}
            Mark all as read
          </button>
        </div>
      </header>

      {(inbox.actionError || (inbox.error && !error)) && (
        <p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-2.5 text-sm text-rose-200">
          {inbox.actionError || inbox.error}
        </p>
      )}

      <section aria-label="Restaurant alert inbox" className="overflow-hidden rounded-2xl border border-zinc-700/75 bg-zinc-950">
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 bg-zinc-900/70 px-4 py-3">
          <div role="group" aria-label="Read status" className="flex gap-1">
            {filters.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={query.filter === value}
                onClick={() => setQuery((current) => current.filter === value ? current : { ...current, filter: value, page: 1 })}
                className={`min-h-9 rounded-lg border px-3 text-xs font-medium focus-visible:outline-2 focus-visible:outline-emerald-300 ${query.filter === value ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-100" : "border-transparent text-zinc-300 hover:bg-white/8"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <select
            aria-label="Alert priority"
            value={query.priority}
            onChange={(event) => setQuery((current) => ({ ...current, priority: event.target.value as AlertsQuery["priority"], page: 1 }))}
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
            className="flex w-full gap-2 @2xl:ml-auto @2xl:w-auto"
            onSubmit={(event) => {
              event.preventDefault();
              const search = searchText.trim();
              setQuery((current) => current.search === search ? current : { ...current, search, page: 1 });
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
                if (!value) setQuery((current) => current.search ? { ...current, search: "", page: 1 } : current);
              }}
              className={`${field} w-full min-w-0 @2xl:w-44`}
            />
            <button type="submit" aria-label="Search alerts" title="Search alerts" className={`${field} grid shrink-0 place-items-center hover:bg-zinc-800`}>
              <Search size={15} aria-hidden />
            </button>
          </form>
        </div>

        {loading ? (
          <p role="status" className="flex items-center gap-2 px-4 py-8 text-sm text-zinc-300">
            <Loader2 size={16} className="motion-safe:animate-spin text-emerald-300" aria-hidden /> Loading alerts…
          </p>
        ) : error ? (
          <div role="alert" className="flex flex-wrap items-center gap-3 p-4 text-sm text-rose-200">
            {error}
            <button type="button" onClick={refresh} className="rounded-lg px-2 py-1 text-emerald-200 hover:bg-emerald-400/10">Retry</button>
          </div>
        ) : list?.data.length ? (
          <>
            <div className="space-y-2 p-3 sm:p-4">
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
            <NotificationPagination
              page={list.pagination.page}
              limit={list.pagination.limit}
              total={list.pagination.total}
              onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
              onLimitChange={(limit) => setQuery((current) => ({ ...current, limit, page: 1 }))}
            />
          </>
        ) : (
          <p className="flex items-center gap-2 px-4 py-8 text-sm text-zinc-300">
            <Bell size={16} className="text-zinc-500" aria-hidden />
            {query.search || query.filter !== "all" || query.priority ? "No alerts match these filters." : "No restaurant alerts yet."}
          </p>
        )}
      </section>
    </div>
  );
}
