"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, CookingPot, Inbox, RefreshCw } from "lucide-react";
import { orderApi, type Order, type OrderItem } from "@/lib/order-api";
import { useOrganizationStore } from "@/store/organization-store";
import KitchenTicket from "./KitchenTicket";

const lanes = [
  {
    status: "CONFIRMED",
    title: "New tickets",
    icon: Inbox,
    tone: "border-sky-300/25 bg-sky-300/15 text-sky-100",
    panel: "border-sky-400/20 border-t-sky-400/70 bg-zinc-950/50",
    header: "from-sky-500/20 to-sky-500/5",
    ticket: "border-sky-400/30",
    ticketHeader: "border-sky-400/20 from-sky-500/15 to-sky-500/5",
    accent: "text-sky-200",
    empty: "No new tickets.",
  },
  {
    status: "PREPARING",
    title: "Cooking",
    icon: CookingPot,
    tone: "border-amber-300/25 bg-amber-300/15 text-amber-100",
    panel: "border-amber-400/20 border-t-amber-400/70 bg-zinc-950/50",
    header: "from-amber-500/20 to-amber-500/5",
    ticket: "border-amber-400/30",
    ticketHeader: "border-amber-400/20 from-amber-500/15 to-amber-500/5",
    accent: "text-amber-200",
    empty: "No tickets cooking.",
  },
  {
    status: "READY",
    title: "Ready for pickup",
    icon: Check,
    tone: "border-emerald-300/25 bg-emerald-300/15 text-emerald-100",
    panel: "border-emerald-400/20 border-t-emerald-400/70 bg-zinc-950/50",
    header: "from-emerald-500/20 to-emerald-500/5",
    ticket: "border-emerald-400/30",
    ticketHeader: "border-emerald-400/20 from-emerald-500/15 to-emerald-500/5",
    accent: "text-emerald-200",
    empty: "No tickets ready for pickup.",
  },
] as const;

const refreshInterval = 15_000;

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function readBoard(signal: AbortSignal) {
  const result = new Map<string, Order>();
  for (let page = 1; !signal.aborted; page += 1) {
    // The register's open list includes READY tickets until the cashier closes them.
    const { data, pagination } = await orderApi.getRegisterOrders(
      "open",
      page,
      signal,
    );
    for (const order of data) {
      if (lanes.some(({ status }) => order.status === status))
        result.set(order.id, order);
    }
    if (page >= pagination.totalPages) break;
  }
  return [...result.values()];
}

export default function KitchenBoard() {
  const user = useOrganizationStore((state) => state.currentUser?.systemUser);
  const restaurant = useOrganizationStore((state) => state.selectedRestaurant);
  const hydrated = useOrganizationStore((state) => state.isHydrated);
  const error = useOrganizationStore((state) => state.error);

  if (!hydrated) return <p role="status">Loading your restaurant…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (
    !user?.isActive ||
    (user.role !== "RESTAURANT_ADMIN" && user.role !== "STAFF") ||
    !restaurant ||
    restaurant.id !== user.managedRestaurantId
  ) {
    return (
      <p role="alert">Sign in with an account assigned to a restaurant.</p>
    );
  }

  return <Board key={`${user.id}:${restaurant.id}`} />;
}

function Board() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const request = useRef<AbortController | null>(null);
  const actionInFlight = useRef(false);
  const mounted = useRef(false);

  const refresh = useCallback(async () => {
    if (request.current || actionInFlight.current) return;
    const controller = new AbortController();
    request.current = controller;
    setRefreshing(true);
    try {
      const next = await readBoard(controller.signal);
      if (controller.signal.aborted) return;
      setOrders(next);
      setLastSyncedAt(Date.now());
      setLoadError("");
    } catch (error) {
      if (!controller.signal.aborted)
        setLoadError(errorMessage(error, "Unable to refresh kitchen tickets."));
    } finally {
      if (request.current === controller) {
        request.current = null;
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const initialLoad = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(() => {
      if (!document.hidden) void refresh();
    }, refreshInterval);
    const resume = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener("visibilitychange", resume);

    return () => {
      mounted.current = false;
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", resume);
      request.current?.abort();
      request.current = null;
    };
  }, [refresh]);

  async function update(
    order: Order,
    change: () => Promise<Order>,
    message: string,
  ) {
    if (actionInFlight.current || loadError) return false;
    actionInFlight.current = true;
    request.current?.abort();
    request.current = null;
    setRefreshing(false);
    setActiveId(order.id);
    setNotice("");
    setActionError("");
    try {
      const updated = await change();
      if (!mounted.current) return false;
      setOrders((current) =>
        (current ?? []).flatMap((entry) => {
          if (entry.id !== updated.id) return [entry];
          return lanes.some(({ status }) => updated.status === status)
            ? [updated]
            : [];
        }),
      );
      setNotice(
        updated.status === "READY"
          ? `Order #${updated.orderNumber} is ready for pickup.`
          : message,
      );
      return true;
    } catch (error) {
      if (mounted.current)
        setActionError(
          `Order #${order.orderNumber}. ${errorMessage(error, "Could not update the ticket.")}`,
        );
      return false;
    } finally {
      actionInFlight.current = false;
      if (mounted.current) {
        setActiveId(null);
        await refresh();
      }
    }
  }

  function start(order: Order) {
    void update(
      order,
      () => orderApi.prepareOrder(order.id),
      `Cooking started for order #${order.orderNumber}.`,
    );
  }

  function updateItem(order: Order, item: OrderItem) {
    const status = item.status === "PENDING" ? "PREPARING" : "READY";
    void update(
      order,
      async () =>
        (await orderApi.setItemStatus(order.id, item.id, status)).order,
      `${item.name} marked ${status === "READY" ? "ready" : "cooking"}.`,
    );
  }

  const sorted = [...(orders ?? [])].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );

  return (
    <div className="@container mx-auto max-w-[1600px] space-y-5 text-zinc-100 motion-safe:animate-fade-in">
      <header className="flex flex-wrap items-center justify-between gap-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="h-4 w-1 shrink-0 rounded-full bg-emerald-400"
          />
          <div className="min-w-0">
            <h1 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
              Kitchen display
            </h1>
            <p className="mt-0.5 text-[10px] text-zinc-500">
              Kitchen tickets, preparation and pickup
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider ${loadError ? "text-amber-300" : "text-zinc-500"}`}
          >
            <span
              aria-hidden="true"
              className={`size-1.5 rounded-full ${loadError ? "bg-amber-300" : lastSyncedAt ? "bg-emerald-300" : "bg-zinc-400"}`}
            />
            {loadError
              ? "Refresh failed"
              : refreshing
                ? "Updating"
                : lastSyncedAt
                  ? "Auto-refresh on"
                  : "Connecting"}
          </span>
          <button
            type="button"
            aria-label="Refresh kitchen tickets"
            title="Refresh kitchen tickets"
            onClick={() => void refresh()}
            disabled={refreshing || activeId !== null}
            className="grid size-10 place-items-center rounded-xl border border-zinc-800 bg-zinc-900/70 text-zinc-400 transition-colors enabled:hover:border-emerald-400/30 enabled:hover:text-emerald-400 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-60"
          >
            <RefreshCw
              aria-hidden="true"
              className={`size-4 ${refreshing ? "motion-safe:animate-spin" : ""}`}
            />
          </button>
        </div>
      </header>
      {loadError && (
        <p
          role="alert"
          className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100"
        >
          {loadError} Refresh to try again.
        </p>
      )}
      {actionError && (
        <p
          role="alert"
          className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100"
        >
          {actionError}
        </p>
      )}
      <p role="status" className="sr-only">
        {notice}
      </p>
      {orders === null && !loadError && (
        <p role="status" className="px-1 text-sm text-zinc-300">
          Loading kitchen tickets…
        </p>
      )}
      {orders !== null && (
        <div className="grid items-start gap-5 @min-[57rem]:grid-cols-3">
          {lanes.map(
            ({
              status,
              title,
              icon: Icon,
              tone,
              panel,
              header,
              ticket,
              ticketHeader,
              accent,
              empty,
            }) => {
              const tickets = sorted.filter((order) => order.status === status);
              return (
                <section
                  key={status}
                  aria-labelledby={`kitchen-${status}`}
                  className={`min-w-0 overflow-hidden rounded-2xl border border-t-2 shadow-sm shadow-black/20 ${panel}`}
                >
                  <header
                    className={`flex items-center gap-3 border-b border-zinc-800/70 bg-gradient-to-r px-4 py-4 ${header}`}
                  >
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-lg border ${tone}`}
                    >
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <h2
                      id={`kitchen-${status}`}
                      className="flex-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-200"
                    >
                      {title}
                    </h2>
                    <span
                      className={`grid min-h-7 min-w-7 place-items-center rounded-md border px-1.5 font-mono text-xs ${tone}`}
                      aria-label={`${tickets.length} tickets`}
                    >
                      {tickets.length}
                    </span>
                  </header>
                  <div className="p-3">
                    {tickets.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/30 px-4 py-10 text-center text-xs text-zinc-500">
                        {empty}
                      </p>
                    ) : (
                      <div className="grid gap-3 @min-[36rem]:grid-cols-2 @min-[57rem]:grid-cols-1">
                        {tickets.map((order) => (
                          <KitchenTicket
                            key={order.id}
                            order={order}
                            tone={{
                              border: ticket,
                              header: ticketHeader,
                              accent,
                            }}
                            now={lastSyncedAt}
                            busy={activeId === order.id}
                            disabled={activeId !== null || Boolean(loadError)}
                            onStart={start}
                            onItem={updateItem}
                            onReport={(order, item, reason) =>
                              update(
                                order,
                                () =>
                                  orderApi.reportUnavailable(
                                    order.id,
                                    item.id,
                                    reason,
                                  ),
                                "Request sent to the cashier.",
                              )
                            }
                            onReady={(selected) =>
                              void update(
                                selected,
                                () => orderApi.markOrderReady(selected.id),
                                "",
                              )
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}
