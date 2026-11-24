"use client";

import { useEffect, useRef, useState } from "react";

import CartPanel, { type CartLine } from "@/elements/Cash-pos/CartPanel";
import PrintBill from "@/elements/Cash-pos/PrintBill";
import MenuCatalog, {
  type RegisterMenuItem,
} from "@/elements/Cash-pos/MenuCatalog";
import ModifierPicker from "@/elements/Cash-pos/ModifierPicker";
import {
  cashierOrderItem,
  type CashierModifierGroup,
  type CartModifier,
} from "@/elements/Cash-pos/cashier-modifiers";
import useCashierModifierGroups from "@/elements/Cash-pos/useCashierModifierGroups";
import SettleDesk, {
  canEditOrder,
  OpenOrders,
} from "@/elements/Cash-pos/SettleDesk";
import useRestaurantMenu from "@/hooks/useRestaurantMenu";
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

interface ModifierSelection {
  item: RegisterMenuItem;
  groups: CashierModifierGroup[];
  line?: CartLine;
}

function messageFrom(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
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
  const {
    items: menu,
    error: menuError,
    refresh: refreshMenu,
  } = useRestaurantMenu(restaurant.id);
  const modifierCatalog = useCashierModifierGroups();
  const customizableItems = new Set(
    modifierCatalog.error ? undefined : modifierCatalog.groups?.keys(),
  );
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartVersion, setCartVersion] = useState(0);
  const [selection, setSelection] = useState<ModifierSelection | null>(null);

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

  function changeQuantity(lineId: string, delta: number) {
    if (lock.current || uncertain) return;

    setCart((current) =>
      current
        .map((line) =>
          line.id === lineId
            ? { ...line, quantity: Math.min(99, line.quantity + delta) }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
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

  function addMenuItem(item: RegisterMenuItem, modifiers: CartModifier[]) {
    if (lock.current || uncertain) return;

    if (!selectedId) {
      const newLine = { id: crypto.randomUUID(), item, quantity: 1, modifiers };
      setCart((current) => {
        const matching = current.find(
          (line) =>
            line.item.id === item.id &&
            line.modifiers.length === modifiers.length &&
            line.modifiers.every(({ id }) =>
              modifiers.some((option) => option.id === id),
            ),
        );
        if (!matching) return [...current, newLine];
        return current.map((line) =>
          line.id === matching.id
            ? { ...line, quantity: Math.min(99, line.quantity + 1) }
            : line,
        );
      });
      return;
    }

    if (!order || !editable) return;

    void runAction(async () => {
      await orderApi.addItems(order.id, [
        cashierOrderItem(item.id, 1, modifiers),
      ]);
      return `${item.name} added to order #${order.orderNumber}.`;
    });
  }

  function openItemOptions(item: RegisterMenuItem) {
    if (lock.current || uncertain || !modifierCatalog.groups) return;
    if (selectedId && !editable) return;
    const groups = modifierCatalog.groups.get(item.id);
    if (groups) setSelection({ item, groups });
  }

  function editOptions(line: CartLine) {
    if (lock.current || uncertain) return;
    const groups = modifierCatalog.groups?.get(line.item.id);
    if (groups) setSelection({ item: line.item, groups, line });
  }

  function saveOptions(modifiers: CartModifier[]) {
    if (!selection || lock.current || uncertain || (selectedId && !editable))
      return;
    const { item, line } = selection;
    setSelection(null);

    if (line) {
      setCart((current) =>
        current.map((entry) =>
          entry.id === line.id ? { ...entry, modifiers } : entry,
        ),
      );
    } else {
      addMenuItem(item, modifiers);
    }
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
    <div className="mx-auto max-w-[1600px] space-y-5 text-zinc-100 motion-safe:animate-fade-in">
      <header className="flex flex-wrap items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-3">
          <span aria-hidden className="h-4 w-1 rounded-full bg-emerald-400" />
          <div>
            <h1 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
              Cashier POS
            </h1>
            <p className="mt-0.5 text-[10px] text-zinc-500">
              Menu ordering, open tickets and payment settlement
            </p>
          </div>
        </div>
      </header>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <MenuCatalog
          items={menu}
          error={menuError}
          optionsError={modifierCatalog.error}
          disabled={busy || uncertain || (Boolean(selectedId) && !editable)}
          customizableItems={customizableItems}
          formatMoney={money.format}
          onAdd={(item) => addMenuItem(item, [])}
          onOptions={openItemOptions}
          onRetry={refreshMenu}
          onRetryOptions={modifierCatalog.refresh}
        />

        <aside
          aria-labelledby="pos-current-title"
          className="min-w-0 rounded-2xl border border-violet-400/20 bg-zinc-950/80 shadow-lg shadow-black/20"
        >
          <div className="flex min-h-12 items-center justify-between gap-2 rounded-t-2xl border-b border-violet-400/20 bg-gradient-to-r from-violet-500/25 via-violet-500/10 to-zinc-950 px-4 py-2">
            <h2
              id="pos-current-title"
              className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-violet-200"
            >
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
              customizableItems={customizableItems}
              onEditOptions={editOptions}
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
            className="min-w-0 scroll-mt-4 rounded-xl border border-sky-400/20 bg-zinc-950"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-xl border-b border-sky-400/20 bg-gradient-to-r from-sky-500/20 via-sky-500/5 to-zinc-950 px-4 py-2">
              <h3
                id="pos-order-details-title"
                className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-sky-200"
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
      {selection && (
        <ModifierPicker
          item={selection.item}
          groups={selection.groups}
          initialModifiers={selection.line?.modifiers ?? []}
          quantity={selection.line?.quantity ?? 1}
          editing={Boolean(selection.line)}
          blocked={busy || uncertain || (Boolean(selectedId) && !editable)}
          formatMoney={money.format}
          onClose={() => setSelection(null)}
          onSave={saveOptions}
        />
      )}
    </div>
  );
}
