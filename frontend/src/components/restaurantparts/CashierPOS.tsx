"use client";

import { useEffect, useRef, useState } from "react";

import CartPanel, { type CartLine } from "@/elements/Cash-pos/CartPanel";
import PrintBill from "@/elements/Cash-pos/PrintBill";
import MenuCatalog, {
  type RegisterMenuItem,
} from "@/elements/Cash-pos/MenuCatalog";
import SettleDesk, {
  canEditOrder,
  OpenOrders,
} from "@/elements/Cash-pos/SettleDesk";
import { getRestaurantMenuItems } from "@/lib/catalog-api";
import {
  OrderApiError,
  needsUnavailableReview,
  orderApi,
  type CreateOrderInput,
  type CreatePaymentInput,
  type Order,
  type PaymentMethod,
  type RegisterOrderView,
} from "@/lib/order-api";
import { useOrganizationStore } from "@/store/organization-store";
import type { Restaurant } from "@/utils/types/organization";

interface MenuPage {
  data: RegisterMenuItem[];
  pagination: { totalPages: number };
}

interface ListResult {
  key: string;
  query: string;
  orders: Order[];
  totalPages: number;
  error: string;
}

interface TicketResult {
  id: string;
  key: string;
  order: Order | null;
  error: string;
}

function messageFrom(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function loadMenu(restaurantId: string, signal: AbortSignal) {
  const items = new Map<string, RegisterMenuItem>();

  for (let page = 1; !signal.aborted; page++) {
    const result: MenuPage = await getRestaurantMenuItems(
      restaurantId,
      page,
      50,
    );

    for (const item of result.data) {
      if (item.isAvailable) items.set(item.id, item);
    }

    if (page >= result.pagination.totalPages) break;
  }

  return [...items.values()];
}

export default function CashierPOS() {
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

  return (
    <Register key={`${user.id}:${restaurant.id}`} restaurant={restaurant} />
  );
}

function Register({ restaurant }: { restaurant: Restaurant }) {
  const [menu, setMenu] = useState<RegisterMenuItem[] | null>(null);
  const [menuError, setMenuError] = useState("");
  const [menuRevision, setMenuRevision] = useState(0);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartVersion, setCartVersion] = useState(0);

  const [view, setView] = useState<RegisterOrderView>("open");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [list, setList] = useState<ListResult | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [ticket, setTicket] = useState<TicketResult | null>(null);
  const [pendingPayments, setPendingPayments] = useState<
    Record<string, CreatePaymentInput>
  >({});

  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [notice, setNotice] = useState<{
    kind: "status" | "alert";
    text: string;
  }>();
  const lock = useRef(false);
  const details = useRef<HTMLElement>(null);

  const listQuery = `${view}:${page}`;
  const listKey = `${listQuery}:${revision}`;
  const ticketKey = `${selectedId}:${revision}`;
  const currentList = list?.query === listQuery ? list : null;
  const currentTicket = ticket?.id === selectedId ? ticket : null;
  const ticketLoading = currentTicket?.key !== ticketKey;
  const order = currentTicket?.order ?? null;
  const pendingPayment = pendingPayments[selectedId];
  const editable =
    !ticketLoading && !pendingPayment && order !== null && canEditOrder(order);

  const currency = restaurant.defaultCurrency?.trim().toUpperCase();
  const money = new Intl.NumberFormat(
    "en-IN",
    currency && /^[A-Z]{3}$/.test(currency)
      ? { style: "currency", currency }
      : { maximumFractionDigits: 2 },
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadMenu(restaurant.id, controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setMenu(items);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setMenuError(messageFrom(error, "Unable to load the menu."));
        }
      });

    return () => controller.abort();
  }, [restaurant.id, menuRevision]);

  useEffect(() => {
    const controller = new AbortController();

    void orderApi
      .getRegisterOrders(view, page, controller.signal)
      .then(({ data, pagination }) => {
        if (controller.signal.aborted) return;

        const totalPages = Math.max(1, pagination.totalPages);
        if (page > totalPages) {
          setPage(totalPages);
          return;
        }

        setList({
          key: listKey,
          query: listQuery,
          orders: data,
          totalPages,
          error: "",
        });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setList({
            key: listKey,
            query: listQuery,
            orders: [],
            totalPages: 1,
            error: messageFrom(error, "Unable to load orders."),
          });
        }
      });

    return () => controller.abort();
  }, [view, page, listKey, listQuery]);

  useEffect(() => {
    if (!selectedId) return;

    const controller = new AbortController();

    void orderApi
      .getOrder(selectedId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setTicket({ id: selectedId, key: ticketKey, order: data, error: "" });
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setTicket({
            id: selectedId,
            key: ticketKey,
            order: null,
            error: messageFrom(error, "Unable to load this order."),
          });
        }
      });

    return () => controller.abort();
  }, [selectedId, ticketKey]);

  useEffect(() => {
    if (selectedId) {
      details.current?.focus({ preventScroll: true });
      details.current?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedId]);

  function refresh() {
    setRevision((value) => value + 1);
  }

  useEffect(() => {
    const refreshRequests = () => {
      if (
        !document.hidden &&
        !lock.current &&
        currentList?.key === listKey &&
        (!selectedId || !ticketLoading)
      )
        setRevision((value) => value + 1);
    };
    const timer = window.setInterval(refreshRequests, 15_000);
    document.addEventListener("visibilitychange", refreshRequests);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshRequests);
    };
  }, [currentList?.key, listKey, selectedId, ticketLoading]);

  function clearCart() {
    setCart([]);
    setCartVersion((value) => value + 1);
  }

  function changeQuantity(item: RegisterMenuItem, delta: number) {
    if (lock.current || uncertain) return;

    setCart((current) => {
      if (!current.some((line) => line.item.id === item.id)) {
        return delta > 0 ? [...current, { item, quantity: 1 }] : current;
      }

      return current
        .map((line) =>
          line.item.id === item.id
            ? { ...line, quantity: Math.min(99, line.quantity + delta) }
            : line,
        )
        .filter((line) => line.quantity > 0);
    });
  }

  async function runAction(action: () => Promise<string>) {
    if (lock.current) return;

    lock.current = true;
    setBusy(true);
    setNotice(undefined);

    try {
      setNotice({ kind: "status", text: await action() });
    } catch (error) {
      setNotice({
        kind: "alert",
        text: messageFrom(error, "Unable to complete the action."),
      });
    } finally {
      refresh();
      lock.current = false;
      setBusy(false);
    }
  }

  function selectOrder(id: string) {
    if (lock.current) return;

    setSelectedId(id);
    setNotice(undefined);
    if (id === selectedId) {
      refresh();
      details.current?.focus({ preventScroll: true });
      details.current?.scrollIntoView({ block: "nearest" });
    }
  }

  async function confirmOrder(saved: Order) {
    if (saved.status !== "PENDING") {
      return `Order #${saved.orderNumber} saved.`;
    }

    try {
      await orderApi.confirmOrder(saved.id);
    } catch {
      const latest = await orderApi.getOrder(saved.id).catch(() => null);

      if (
        !latest ||
        !["CONFIRMED", "PREPARING", "READY", "COMPLETED"].includes(
          latest.status,
        )
      ) {
        throw new Error(
          `Order #${saved.orderNumber} was saved. Check its status and confirm it if it is still pending.`,
        );
      }
    }

    return `Order #${saved.orderNumber} confirmed.`;
  }

  function placeOrder(input: CreateOrderInput) {
    if (uncertain) return;

    void runAction(async () => {
      let saved: Order;

      try {
        saved = await orderApi.createOrder(input, crypto.randomUUID());
      } catch (error) {
        if (error instanceof OrderApiError && error.status < 500) throw error;

        setUncertain(true);
        setView("open");
        setPage(1);
        throw new Error(
          "Order placement could not be confirmed. Check the open orders below.",
        );
      }

      clearCart();
      setSelectedId(saved.id);
      setView("open");
      setPage(1);
      return confirmOrder(saved);
    });
  }

  function addMenuItem(item: RegisterMenuItem) {
    if (lock.current || uncertain) return;

    if (!selectedId) {
      changeQuantity(item, 1);
      return;
    }

    if (!order || !editable) return;

    void runAction(async () => {
      await orderApi.addItems(order.id, [{ menuItemId: item.id, quantity: 1 }]);
      return `${item.name} added to order #${order.orderNumber}.`;
    });
  }

  function recordPayment(
    selected: Order,
    amount: number,
    method: PaymentMethod,
  ) {
    void runAction(async () => {
      const pending = pendingPayments[selected.id];
      const input = pending ?? {
        orderId: selected.id,
        amount,
        method,
        transactionId: crypto.randomUUID(),
      };
      const ledger = await orderApi.getOrderPayments(selected.id);
      const hasPayment = (payments: typeof ledger.payments) =>
        payments.some(
          (payment) => payment.transactionId === input.transactionId,
        );

      let remaining = Number(ledger.remainingAmount);
      if (!hasPayment(ledger.payments)) {
        if (
          !Number.isFinite(remaining) ||
          input.amount < 0.01 ||
          input.amount > remaining
        ) {
          throw new Error(
            "The balance changed. Review the order before recording payment.",
          );
        }

        try {
          const result = await orderApi.createPayment(input);
          remaining = Number(result.remainingAmount);
        } catch (error) {
          const latest = await orderApi
            .getOrderPayments(selected.id)
            .catch(() => null);
          if (!latest || !hasPayment(latest.payments)) {
            if (
              pending ||
              !(error instanceof OrderApiError) ||
              error.status >= 500 ||
              error.status === 408
            ) {
              setPendingPayments((current) => ({
                ...current,
                [selected.id]: input,
              }));
              throw new Error(
                "Payment could not be confirmed. Use Check or retry payment on this order.",
              );
            }
            throw error;
          }
          remaining = Number(latest.remainingAmount);
        }
      }

      if (pending) {
        setPendingPayments((current) => {
          const next = { ...current };
          delete next[selected.id];
          return next;
        });
      }

      const message = `${money.format(input.amount)} payment recorded for order #${selected.orderNumber}.`;
      if (remaining > 0)
        return `${message} ${money.format(remaining)} still due.`;
      if (remaining !== 0) return message;

      const latest = await orderApi.getOrder(selected.id).catch(() => null);
      if (latest?.status === "COMPLETED") return `${message} Order closed.`;
      if (latest?.status !== "READY") return message;

      try {
        await orderApi.completeOrder(selected.id);
        return `${message} Order closed.`;
      } catch {
        return `${message} Check the refreshed ticket for its closing status.`;
      }
    });
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 text-zinc-100">
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <MenuCatalog
          restaurantName={restaurant.name}
          items={menu}
          error={menuError}
          disabled={busy || uncertain || (Boolean(selectedId) && !editable)}
          formatMoney={money.format}
          onAdd={addMenuItem}
          onRetry={() => {
            setMenuError("");
            setMenuRevision((value) => value + 1);
          }}
        />

        <aside
          aria-labelledby="pos-current-title"
          className="min-w-0 rounded-2xl border border-violet-400/40 bg-slate-900 shadow-lg shadow-black/20"
        >
          <div className="flex min-h-12 items-center justify-between gap-2 rounded-t-2xl border-b border-violet-400/30 bg-linear-to-r from-violet-900 to-slate-800 px-4 py-2">
            <h2 id="pos-current-title" className="text-sm font-semibold">
              Current order
            </h2>
            {selectedId && (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setSelectedId("");
                  setNotice(undefined);
                }}
                className="min-h-9 rounded-lg border border-zinc-700 px-3 text-xs font-semibold text-emerald-300 hover:border-emerald-400/50 disabled:opacity-50"
              >
                {cart.length ? "Resume draft" : "New order"}
              </button>
            )}
          </div>

          {!selectedId && notice && (
            <p
              role={notice.kind}
              className={`mx-4 mt-3 rounded-lg p-3 text-sm ${
                notice.kind === "alert"
                  ? "bg-rose-400/10 text-rose-200"
                  : "bg-emerald-400/10 text-emerald-200"
              }`}
            >
              {notice.text}
            </p>
          )}

          <div hidden={Boolean(selectedId)}>
            <CartPanel
              key={cartVersion}
              lines={cart}
              busy={busy}
              uncertain={uncertain}
              formatMoney={money.format}
              onQuantityChange={changeQuantity}
              onSubmit={placeOrder}
              onDiscard={() => {
                clearCart();
                setUncertain(false);
                setNotice(undefined);
              }}
            />
          </div>
          {selectedId && (
            <div className="space-y-2 p-4">
              <p className="text-sm text-slate-200">
                {order
                  ? `Order #${order.orderNumber} is selected.`
                  : "An order is selected."}
              </p>
              <a
                href="#pos-order-details"
                className="inline-flex min-h-9 items-center rounded-lg bg-sky-300 px-3 text-sm font-semibold text-sky-950 hover:bg-sky-200"
              >
                Go to order details
              </a>
            </div>
          )}
        </aside>
      </div>

      <OpenOrders
        view={view}
        orders={currentList?.orders ?? []}
        selectedId={selectedId}
        page={page}
        totalPages={currentList?.totalPages ?? 1}
        loading={currentList?.key !== listKey}
        busy={busy}
        error={currentList?.key === listKey ? currentList.error : ""}
        formatMoney={money.format}
        onSelect={selectOrder}
        onView={(next) => {
          setView(next);
          setPage(1);
        }}
        onPage={setPage}
        onRefresh={refresh}
      >
        {selectedId && (
          <aside
            id="pos-order-details"
            ref={details}
            tabIndex={-1}
            aria-labelledby="pos-order-details-title"
            className="min-w-0 scroll-mt-4 rounded-xl border border-sky-400/40 bg-slate-950"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-xl border-b border-sky-400/30 bg-sky-950 px-4 py-2">
              <h3
                id="pos-order-details-title"
                className="text-sm font-semibold text-sky-100"
              >
                Order details
              </h3>
              {order && (
                <PrintBill
                  key={order.id}
                  order={order}
                  restaurant={restaurant}
                  formatMoney={money.format}
                  disabled={
                    busy ||
                    ticketLoading ||
                    Boolean(pendingPayment) ||
                    order.items.some(needsUnavailableReview)
                  }
                />
              )}
            </div>
            {notice && (
              <p
                role={notice.kind}
                className={`mx-4 mt-3 rounded-lg p-3 text-sm ${notice.kind === "alert" ? "bg-rose-400/10 text-rose-200" : "bg-emerald-400/10 text-emerald-200"}`}
              >
                {notice.text}
              </p>
            )}

            {ticketLoading && (
              <p role="status" className="p-4 text-sm text-zinc-400">
                Loading order…
              </p>
            )}

            {!ticketLoading && currentTicket?.error && (
              <div className="space-y-2 p-4 text-sm">
                <p role="alert" className="text-rose-300">
                  {currentTicket.error}
                </p>
                <button
                  type="button"
                  onClick={refresh}
                  className="text-emerald-300 underline"
                >
                  Retry order
                </button>
              </div>
            )}

            {order && (
              <SettleDesk
                key={order.id}
                order={order}
                busy={busy || ticketLoading}
                pendingPayment={pendingPayment}
                onReviewUnavailable={(itemId, decision) =>
                  void runAction(async () => {
                    const updated = await orderApi.reviewUnavailable(
                      order.id,
                      itemId,
                      decision,
                    );
                    if (updated.status === "CANCELLED") {
                      setView("history");
                      setPage(1);
                      return `Order #${updated.orderNumber} cancelled.`;
                    }
                    return decision === "approve"
                      ? "Dish cancelled and bill updated."
                      : "Request dismissed.";
                  })
                }
                formatMoney={money.format}
                onRemove={(itemId) =>
                  void runAction(async () => {
                    await orderApi.removeItem(order.id, itemId);
                    return `Item removed from order #${order.orderNumber}.`;
                  })
                }
                onConfirm={(selected) =>
                  void runAction(() => confirmOrder(selected))
                }
                onPayment={recordPayment}
                onClose={(selected) =>
                  void runAction(async () => {
                    await orderApi.completeOrder(selected.id);
                    return `Order #${selected.orderNumber} closed.`;
                  })
                }
              />
            )}
          </aside>
        )}
      </OpenOrders>
    </div>
  );
}
