"use client";

import { ArrowRight, Plus, X } from "lucide-react";
import { useRef } from "react";
import type { Order } from "@/lib/order-api";
import NewTableForm, { type TableGuest } from "./NewTableForm";
import WaiterMark from "./WaiterMark";
import RefreshButton from "./RefreshButton";
import TableRepresentation from "./TableRepresentation";

const orderStatus: Record<Order["status"], { label: string; color: string }> = {
  PENDING: {
    label: "Needs confirmation",
    color: "text-amber-200",
  },
  CONFIRMED: { label: "Sent to kitchen", color: "text-sky-200" },
  PREPARING: { label: "Preparing", color: "text-amber-200" },
  READY: { label: "Ready", color: "text-emerald-200" },
  COMPLETED: {
    label: "Completed",
    color: "text-emerald-200",
  },
  CANCELLED: { label: "Cancelled", color: "text-zinc-400" },
};

export function OrderStatus({ status }: { status: Order["status"] }) {
  const { label, color } = orderStatus[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${color}`}
    >
      <span
        aria-hidden="true"
        className="size-1.5 shrink-0 rounded-full bg-current"
      />
      {label}
    </span>
  );
}

interface Props {
  orders: Order[] | null;
  error: string;
  busy: boolean;
  refreshing: boolean;
  newLocked: boolean;
  settingUp: boolean;
  onRefresh: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onCancelNew: () => void;
  onContinue: (guest: TableGuest) => void;
}

export default function TableOrders({
  orders,
  error,
  busy,
  refreshing,
  newLocked,
  settingUp,
  onRefresh,
  onSelect,
  onNew,
  onCancelNew,
  onContinue,
}: Props) {
  const newButton = useRef<HTMLButtonElement>(null);

  function cancelNew() {
    onCancelNew();
    newButton.current?.focus();
  }

  return (
    <section
      aria-labelledby="waiter-floor"
      className="@container overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 shadow-lg shadow-black/20"
    >
      <header className="flex items-center justify-between gap-3 border-b border-zinc-800 bg-gradient-to-r from-emerald-500/15 via-zinc-950/80 to-zinc-950 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <WaiterMark />
          <div className="min-w-0">
            <h1
              id="waiter-floor"
              className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-300"
            >
              Table service
            </h1>
            <p className="mt-1 text-[10px] text-zinc-500">
              {orders
                ? `${orders.length} open ${orders.length === 1 ? "order" : "orders"}`
                : "Dine-in orders"}
            </p>
          </div>
        </div>
        <RefreshButton
          label="Refresh tables"
          refreshing={refreshing}
          disabled={busy}
          onClick={onRefresh}
        />
      </header>
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <h2 className="flex items-center gap-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            <span aria-hidden className="h-4 w-1 rounded-full bg-emerald-400" />
            Open tables
          </h2>
          <button
            ref={newButton}
            type="button"
            disabled={busy || newLocked}
            aria-expanded={settingUp}
            aria-controls={settingUp ? "waiter-new-table" : undefined}
            onClick={settingUp ? cancelNew : onNew}
            className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:opacity-50 ${settingUp ? "border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800" : "border-emerald-400 bg-gradient-to-r from-emerald-400 to-cyan-400 text-zinc-950 shadow-[0_4px_18px_rgba(52,211,153,0.15)] hover:brightness-110"}`}
          >
            {settingUp ? (
              <X aria-hidden="true" className="size-4" />
            ) : (
              <Plus aria-hidden="true" className="size-4" />
            )}
            {settingUp ? "Close setup" : "New table"}
          </button>
        </div>
        {settingUp && (
          <NewTableForm onContinue={onContinue} onCancel={cancelNew} />
        )}
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-rose-950 p-3 text-sm text-rose-100"
          >
            {error}
          </p>
        )}
        {!orders && !error && (
          <p role="status" className="text-sm text-zinc-300">
            Loading tables…
          </p>
        )}
        {orders?.length === 0 && !error && !settingUp && (
          <p className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-4 py-10 text-center text-xs text-zinc-400">
            No open table orders.
          </p>
        )}
        {!!orders?.length && (
          <ul className="grid gap-3 @min-[27rem]:grid-cols-2 @min-[45rem]:grid-cols-3 @min-[66rem]:grid-cols-4">
            {orders.map((order) => {
              const itemCount = order.items.reduce(
                (count, item) =>
                  count + (item.status === "CANCELLED" ? 0 : item.quantity),
                0,
              );
              const ready = order.items.reduce(
                (count, item) =>
                  count + (item.status === "READY" ? item.quantity : 0),
                0,
              );
              return (
                <li key={order.id} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onSelect(order.id)}
                    disabled={busy}
                    className="group relative grid h-full w-full content-start gap-3 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-left shadow-sm shadow-black/20 transition-all duration-300 enabled:hover:border-emerald-400/40 enabled:hover:shadow-[0_8px_28px_rgba(16,185,129,0.08)] motion-safe:enabled:hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-60"
                  >
                    <span aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent opacity-70 ${order.status === "READY" ? "from-emerald-500/25" : order.status === "PREPARING" ? "from-amber-500/20" : "from-sky-500/20"}`} />
                    <TableRepresentation label={order.tableId} ready={order.status === "READY"} preparing={order.status === "PREPARING"} />
                    <span className="relative flex items-center justify-between gap-3">
                      <OrderStatus status={order.status} />
                      <ArrowRight
                        aria-hidden="true"
                        className="ml-auto size-4 shrink-0 text-zinc-600 transition-all group-hover:translate-x-0.5 group-hover:text-emerald-400"
                      />
                    </span>
                    <span className="relative flex flex-wrap justify-between gap-2 border-t border-zinc-800/80 pt-3 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                      <span className="font-mono">
                        Order #{order.orderNumber}
                      </span>
                      <span>{itemCount} {itemCount === 1 ? "item" : "items"}</span>
                      {ready > 0 && order.status !== "READY" && (
                        <span className="font-medium text-emerald-200">
                          {ready} ready
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
