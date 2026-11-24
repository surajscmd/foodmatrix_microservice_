"use client";

import { useState, type ReactNode } from "react";
import { ChevronRight, ClipboardList, RefreshCw, Trash2 } from "lucide-react";
import {
  needsUnavailableReview,
  type Order,
  type PaymentMethod,
  type RegisterOrderView,
  type UnavailabilityDecision,
} from "@/lib/order-api";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300";
const button = `inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-xs font-semibold text-zinc-200 transition-colors enabled:hover:border-emerald-400/50 disabled:opacity-50 ${focus}`;
const primary = `min-h-11 w-full rounded-xl bg-emerald-400 px-3 text-xs font-bold text-zinc-950 shadow-[0_6px_20px_rgba(52,211,153,0.15)] transition-colors enabled:hover:bg-emerald-300 disabled:opacity-50 ${focus}`;

const statusStyles: Record<Order["status"], string> = {
  PENDING: "bg-amber-400/15 text-amber-200",
  CONFIRMED: "bg-sky-400/15 text-sky-200",
  PREPARING: "bg-violet-400/15 text-violet-200",
  READY: "bg-emerald-400/15 text-emerald-200",
  COMPLETED: "bg-emerald-400/15 text-emerald-200",
  CANCELLED: "bg-rose-400/15 text-rose-200",
};

const orderTypes: Record<Order["type"], string> = {
  DINE_IN: "Dine-in",
  TAKEAWAY: "Takeaway",
  DELIVERY: "Delivery",
};

const methods: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "UPI", label: "UPI" },
  { value: "ONLINE", label: "Online" },
];

const views: { value: RegisterOrderView; label: string }[] = [
  { value: "open", label: "Open orders" },
  { value: "history", label: "History" },
];

export function canEditOrder(order: Order) {
  return (
    (order.status === "PENDING" ||
      order.status === "CONFIRMED" ||
      order.status === "PREPARING") &&
    !order.payments.some(
      (payment) => payment.status === "COMPLETED" && Number(payment.amount) > 0,
    )
  );
}

function orderContext(order: Order) {
  return order.tableId
    ? `${orderTypes[order.type]} · Table ${order.tableId}`
    : orderTypes[order.type];
}

function StatusBadge({ status }: { status: Order["status"] }) {
  return (
    <span
      className={`rounded-lg px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider ${statusStyles[status]}`}
    >
      {status.toLowerCase()}
    </span>
  );
}

interface OpenOrdersProps {
  view: RegisterOrderView;
  orders: Order[];
  selectedId: string;
  page: number;
  totalPages: number;
  loading: boolean;
  busy: boolean;
  error: string;
  formatMoney: (amount: number) => string;
  onSelect: (id: string) => void;
  onView: (view: RegisterOrderView) => void;
  onPage: (page: number) => void;
  onRefresh: () => void;
  children?: ReactNode;
}

export function OpenOrders({
  view,
  orders,
  selectedId,
  page,
  totalPages,
  loading,
  busy,
  error,
  formatMoney,
  onSelect,
  onView,
  onPage,
  onRefresh,
  children,
}: OpenOrdersProps) {
  const locked = busy || loading;

  return (
    <section
      aria-labelledby="pos-orders-title"
      aria-busy={loading}
      className="space-y-3 rounded-2xl border border-sky-400/20 bg-gradient-to-b from-sky-500/[0.08] via-zinc-950/80 to-zinc-950/80 p-4 shadow-lg shadow-black/20"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="pos-orders-title"
          className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-sky-200"
        >
          <ClipboardList aria-hidden="true" className="size-5 text-sky-300" />
          Orders
        </h2>
        <button
          type="button"
          className={button}
          disabled={locked}
          onClick={onRefresh}
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          Refresh
        </button>
      </div>

      <div
        role="group"
        aria-label="Order list view"
        className="flex flex-wrap gap-2"
      >
        {views.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={view === value}
            disabled={busy}
            onClick={() => {
              if (view !== value) onView(value);
            }}
            className={`min-h-10 rounded-lg border px-3 text-xs font-semibold transition-colors disabled:opacity-50 ${focus} ${
              view === value
                ? "border-sky-400 bg-sky-400 text-zinc-950 shadow-[0_3px_12px_rgba(56,189,248,0.15)]"
                : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-sky-400/50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        className={
          children ? "grid min-w-0 items-start gap-4 lg:grid-cols-2" : "min-w-0"
        }
      >
        <div className="min-w-0 space-y-3">
          {loading && orders.length === 0 ? (
            <p role="status" className="py-3 text-sm text-zinc-400">
              Loading orders…
            </p>
          ) : error ? (
            <p
              role="alert"
              className="rounded-xl bg-rose-400/10 p-3 text-sm text-rose-200"
            >
              {error}
            </p>
          ) : orders.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-700 p-4 text-sm text-zinc-400">
              {view === "open"
                ? "No open orders."
                : "No completed or cancelled orders."}
            </p>
          ) : (
            <ul
              className={`grid max-h-96 gap-2 overflow-y-auto p-1 ${children ? "" : "md:grid-cols-2 2xl:grid-cols-3"}`}
            >
              {orders.map((order) => {
                const selected = selectedId === order.id;

                return (
                  <li key={order.id} className="min-w-0">
                    <button
                      type="button"
                      aria-pressed={selected}
                      aria-controls={
                        selected && children ? "pos-order-details" : undefined
                      }
                      disabled={busy}
                      onClick={() => onSelect(order.id)}
                      className={`flex min-h-16 w-full flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left disabled:opacity-60 ${focus} ${
                        selected
                          ? "border-sky-400/60 bg-sky-400/10 ring-1 ring-inset ring-sky-400/20"
                          : "border-zinc-800 bg-zinc-900/60 transition-colors enabled:hover:border-sky-400/40 enabled:hover:bg-sky-400/5"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold text-white">
                          #{order.orderNumber}
                        </span>
                        <span className="block break-words text-xs text-zinc-400">
                          {orderContext(order)}
                        </span>
                        {order.items.some(needsUnavailableReview) &&
                          order.status !== "CANCELLED" &&
                          order.status !== "COMPLETED" && (
                            <span className="block text-xs font-medium text-amber-200">
                              Kitchen review requested
                            </span>
                          )}
                      </span>
                      <span className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={order.status} />
                        <span className="text-sm tabular-nums text-white">
                          {formatMoney(Number(order.total))}
                        </span>
                        <ChevronRight
                          aria-hidden="true"
                          className="size-4 text-sky-300"
                        />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {!error && (totalPages > 1 || page > 1) && (
            <nav
              aria-label="Order pages"
              className="flex items-center justify-between gap-2"
            >
              <button
                type="button"
                className={button}
                disabled={locked || page <= 1}
                onClick={() => onPage(page - 1)}
              >
                Previous
              </button>
              <span className="text-xs text-zinc-400">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className={button}
                disabled={locked || page >= totalPages}
                onClick={() => onPage(page + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

interface SettleDeskProps {
  order: Order;
  busy: boolean;
  formatMoney: (amount: number) => string;
  onRemove: (itemId: string) => void;
  onConfirm: (order: Order) => void;
  pendingPayment?: { amount: number; method: PaymentMethod };
  onPayment: (order: Order, amount: number, method: PaymentMethod) => void;
  onClose: (order: Order) => void;
  onReviewUnavailable: (
    itemId: string,
    decision: UnavailabilityDecision,
  ) => void;
}

export default function SettleDesk({
  order,
  busy,
  formatMoney,
  onRemove,
  onConfirm,
  pendingPayment,
  onPayment,
  onClose,
  onReviewUnavailable,
}: SettleDeskProps) {
  const total = Number(order.total);
  const payments = order.payments.filter(
    (payment) => payment.status === "COMPLETED",
  );
  const paidCents = payments.reduce(
    (sum, payment) => sum + Math.round(Number(payment.amount) * 100),
    0,
  );
  const balance = Math.max(0, Math.round(total * 100) - paidCents) / 100;
  const editable = !pendingPayment && canEditOrder(order);
  const closed = order.status === "COMPLETED" || order.status === "CANCELLED";
  const requests = closed ? [] : order.items.filter(needsUnavailableReview);
  const activeItemCount = order.items.filter(
    (item) => item.status !== "CANCELLED",
  ).length;
  const [approval, setApproval] = useState<{
    itemId: string;
    cancelOrder: boolean;
  } | null>(null);

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-white">
            Order #{order.orderNumber}
          </h3>
          <p className="mt-1 break-words text-xs text-zinc-400">
            {orderContext(order)}
          </p>
          {order.customer?.name && (
            <p className="mt-1 break-words text-xs text-zinc-400">
              {order.customer.name}
            </p>
          )}
        </div>
        <StatusBadge status={order.status} />
      </div>

      {requests.length > 0 && (
        <section
          aria-label="Kitchen requests"
          className="space-y-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3"
        >
          <h4 className="text-sm font-semibold text-amber-100">
            Kitchen requests
          </h4>
          {paidCents > 0 && (
            <p className="text-xs text-amber-100">
              Payment has already been taken. A manager must review the payment
              before this request can be approved.
            </p>
          )}
          {requests.map((item) => (
            <div
              key={item.id}
              className="space-y-2 border-t border-amber-400/20 pt-2"
            >
              <p className="break-words text-sm font-medium text-white">
                {item.quantity} × {item.name}
              </p>
              <p className="break-words text-xs text-amber-100">
                {item.unavailableReason}
              </p>
              {approval?.itemId === item.id && (
                <p className="text-xs text-amber-100">
                  {approval.cancelOrder
                    ? "This is the last dish. Approving will cancel the order."
                    : "Approving will remove this dish from the bill."}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {approval?.itemId === item.id ? (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      className={button}
                      onClick={() => setApproval(null)}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={
                        busy || paidCents > 0 || Boolean(pendingPayment)
                      }
                      className={button}
                      onClick={() => {
                        setApproval(null);
                        onReviewUnavailable(
                          item.id,
                          approval.cancelOrder ? "cancel-order" : "approve",
                        );
                      }}
                    >
                      {approval.cancelOrder
                        ? "Confirm cancellation"
                        : "Confirm removal"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={
                        busy || paidCents > 0 || Boolean(pendingPayment)
                      }
                      className={button}
                      onClick={() =>
                        setApproval({
                          itemId: item.id,
                          cancelOrder: activeItemCount === 1,
                        })
                      }
                    >
                      {activeItemCount === 1
                        ? "Review order cancellation"
                        : "Review removal"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      className={button}
                      onClick={() => onReviewUnavailable(item.id, "dismiss")}
                    >
                      Dismiss
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {editable && (
        <p className="rounded-lg bg-sky-400/10 px-3 py-2 text-xs text-sky-200">
          <a
            href="#pos-menu"
            className={`rounded font-medium underline ${focus}`}
          >
            Add from the menu
          </a>
        </p>
      )}

      <ul className="max-h-72 divide-y divide-zinc-800 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/50">
        {order.items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-2 p-3"
          >
            <div className="min-w-0">
              <p className="break-words text-sm text-white">
                {item.quantity} × {item.name}
              </p>
              {item.modifiers.length > 0 && (
                <p className="mt-1 break-words text-xs text-zinc-400">
                  {item.modifiers
                    .map(({ name, quantity }) =>
                      quantity > 1 ? `${quantity} × ${name}` : name,
                    )
                    .join(", ")}
                </p>
              )}
              {item.status === "CANCELLED" && (
                <p className="mt-1 text-xs text-rose-300">Cancelled item</p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="text-sm tabular-nums">
                {formatMoney(Number(item.total))}
              </span>
              {editable &&
                item.status !== "CANCELLED" &&
                !needsUnavailableReview(item) &&
                activeItemCount > 1 && (
                  <button
                    type="button"
                    disabled={busy}
                    aria-label={`Remove ${item.name} from order`}
                    onClick={() => onRemove(item.id)}
                    className={`grid size-9 place-items-center rounded-lg text-zinc-400 enabled:hover:bg-rose-400/10 enabled:hover:text-rose-300 disabled:opacity-50 ${focus}`}
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </button>
                )}
            </div>
          </li>
        ))}
      </ul>

      <dl className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-zinc-400">Order total</dt>
          <dd className="font-semibold tabular-nums text-white">
            {formatMoney(total)}
          </dd>
        </div>
        {paidCents > 0 && (
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-400">Payments received</dt>
            <dd className="tabular-nums text-white">
              {formatMoney(paidCents / 100)}
            </dd>
          </div>
        )}
        {!closed && (
          <div className="flex items-baseline justify-between gap-3 border-t border-zinc-800 pt-2">
            <dt className="text-emerald-200">Balance due</dt>
            <dd className="text-lg font-semibold tabular-nums text-emerald-200">
              {formatMoney(balance)}
            </dd>
          </div>
        )}
      </dl>

      {payments.length > 0 && (
        <ul
          aria-label="Payments recorded"
          className="space-y-1 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 text-sm"
        >
          {payments.map((payment) => (
            <li key={payment.id} className="flex justify-between gap-3">
              <span className="text-slate-200">
                {methods.find(({ value }) => value === payment.method)?.label ??
                  payment.method}
              </span>
              <span className="tabular-nums text-emerald-200">
                {formatMoney(Number(payment.amount))}
              </span>
            </li>
          ))}
        </ul>
      )}

      {pendingPayment ? (
        <div className="space-y-2 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3">
          <p className="text-sm text-amber-100">
            Check whether the {formatMoney(pendingPayment.amount)}{" "}
            {
              methods.find(({ value }) => value === pendingPayment.method)
                ?.label
            }{" "}
            payment was recorded.
          </p>
          <button
            type="button"
            disabled={busy}
            className={primary}
            onClick={() =>
              onPayment(order, pendingPayment.amount, pendingPayment.method)
            }
          >
            Check or retry payment
          </button>
        </div>
      ) : closed ? (
        order.status === "CANCELLED" && order.cancelReason ? (
          <p className="break-words text-sm text-rose-200">
            {order.cancelReason}
          </p>
        ) : null
      ) : order.status === "PENDING" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => onConfirm(order)}
          className={primary}
        >
          Confirm order
        </button>
      ) : requests.length > 0 ? (
        <p className="text-sm text-amber-200">
          Review the kitchen requests before taking payment.
        </p>
      ) : balance > 0 ? (
        <PaymentForm
          key={balance}
          balance={balance}
          busy={busy}
          formatMoney={formatMoney}
          onPayment={(amount, method) => onPayment(order, amount, method)}
        />
      ) : order.status === "READY" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => onClose(order)}
          className={primary}
        >
          Close order
        </button>
      ) : (
        <p className="rounded-lg bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
          No balance due. Close this order once the kitchen marks it ready.
        </p>
      )}
    </div>
  );
}

function PaymentForm({
  balance,
  busy,
  formatMoney,
  onPayment,
}: {
  balance: number;
  busy: boolean;
  formatMoney: (amount: number) => string;
  onPayment: (amount: number, method: PaymentMethod) => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [splitAmount, setSplitAmount] = useState<string | null>(null);
  const amount = Number(splitAmount ?? balance);
  const valid =
    Number.isFinite(amount) &&
    amount >= 0.01 &&
    amount <= balance &&
    (splitAmount === null || /^\d*(?:\.\d{1,2})?$/.test(splitAmount));

  return (
    <form
      className="space-y-3 rounded-xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/15 to-zinc-950 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy && valid) onPayment(amount, method);
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-white">Take payment</span>
        <button
          type="button"
          disabled={busy}
          className={button}
          onClick={() => setSplitAmount(splitAmount === null ? "" : null)}
        >
          {splitAmount === null ? "Split payment" : "Use full balance"}
        </button>
      </div>
      {splitAmount !== null && (
        <label className="block space-y-1 text-sm font-medium text-emerald-100">
          Amount received
          <input
            type="text"
            inputMode="decimal"
            value={splitAmount}
            disabled={busy}
            onChange={(event) =>
              setSplitAmount(event.target.value.replace(",", "."))
            }
            aria-invalid={splitAmount !== "" && !valid}
            className={`block h-11 w-full rounded-lg border border-emerald-400/50 bg-slate-950 px-3 text-white ${focus}`}
          />
          {splitAmount !== "" && !valid && (
            <span className="block text-xs text-amber-200">
              Enter an amount from {formatMoney(0.01)} to {formatMoney(balance)}
              , with up to two decimal places.
            </span>
          )}
        </label>
      )}
      <div
        role="group"
        aria-label="Payment method"
        className="grid grid-cols-2 gap-2"
      >
        {methods.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            disabled={busy}
            aria-pressed={method === value}
            onClick={() => setMethod(value)}
            className={`min-h-10 rounded-lg border px-2 text-sm font-medium disabled:opacity-50 ${focus} ${
              method === value
                ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-200"
                : "border-zinc-700 bg-zinc-900 text-zinc-300 enabled:hover:border-emerald-400/40"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <button type="submit" disabled={busy || !valid} className={primary}>
        {valid ? `Record ${formatMoney(amount)} received` : "Record payment"}
      </button>
    </form>
  );
}
