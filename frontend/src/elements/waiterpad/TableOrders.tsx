"use client";

import { ArrowRight, Plus, X } from "lucide-react";
import { useRef } from "react";
import type { Order } from "@/lib/order-api";
import NewTableForm, { type TableGuest } from "./NewTableForm";
import WaiterMark from "./WaiterMark";
import RefreshButton from "./RefreshButton";

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
      className="@container overflow-hidden rounded-2xl border border-zinc-700/80 bg-[#18191d] shadow-lg shadow-black/20"
    >
      <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-linear-to-r from-[#1d3b31] via-[#222e29] to-[#232429] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <WaiterMark />
          <div className="min-w-0">
            <h1
              id="waiter-floor"
              className="text-sm font-semibold tracking-tight text-white"
            >
              Table service
            </h1>
            <p className="mt-0.5 text-xs text-zinc-200">
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
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <h2 className="text-sm font-semibold text-zinc-100">Open tables</h2>
          <button
            ref={newButton}
            type="button"
            disabled={busy || newLocked}
            aria-expanded={settingUp}
            aria-controls={settingUp ? "waiter-new-table" : undefined}
            onClick={settingUp ? cancelNew : onNew}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:opacity-50 ${settingUp ? "bg-white/8 text-white hover:bg-white/12" : "bg-emerald-300 text-emerald-950 hover:bg-emerald-200"}`}
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
          <p className="rounded-xl border border-dashed border-zinc-600 bg-zinc-800/45 px-4 py-7 text-center text-sm text-zinc-200">
            No open table orders.
          </p>
        )}
        {!!orders?.length && (
          <ul className="grid gap-3 @min-[27rem]:grid-cols-2 @min-[45rem]:grid-cols-3 @min-[66rem]:grid-cols-4">
            {orders.map((order) => {
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
                    className="group grid h-full w-full content-start gap-2 rounded-xl border border-zinc-700 bg-[#232429] p-4 text-left shadow-sm shadow-black/20 transition enabled:hover:border-emerald-300/65 enabled:hover:bg-[#25322e] focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-60"
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="min-w-0 break-words text-sm font-semibold tracking-tight text-white">
                        Table {order.tableId}
                      </span>
                      <ArrowRight
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0 text-emerald-200 group-hover:text-white"
                      />
                    </span>
                    <OrderStatus status={order.status} />
                    <span className="flex flex-wrap justify-between gap-2 text-xs text-zinc-300">
                      <span className="font-mono">
                        Order #{order.orderNumber}
                      </span>
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
