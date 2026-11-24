import { useState } from "react";
import { Check, ChevronRight, Clock3, CookingPot, Flag } from "lucide-react";
import {
  needsUnavailableReview,
  type Order,
  type OrderItem,
} from "@/lib/order-api";

const types = {
  DINE_IN: "Dine-in",
  TAKEAWAY: "Takeaway",
  DELIVERY: "Delivery",
};
const itemLabels = {
  PENDING: "Queued",
  PREPARING: "Cooking",
  READY: "Ready",
  CANCELLED: "Cancelled",
};
const itemColors = {
  PENDING: "text-zinc-300",
  PREPARING: "text-amber-200",
  READY: "text-emerald-200",
  CANCELLED: "text-zinc-400",
};
const itemAction =
  "inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/70 px-2.5 text-[11px] font-semibold text-zinc-200 transition-colors enabled:hover:border-emerald-400/60 enabled:hover:bg-emerald-400/10 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-50";

interface Props {
  order: Order;
  tone: { border: string; header: string; accent: string };
  now: number;
  busy: boolean;
  disabled: boolean;
  onStart: (order: Order) => void;
  onItem: (order: Order, item: OrderItem) => void;
  onReady: (order: Order) => void;
  onReport: (order: Order, item: OrderItem, reason: string) => Promise<boolean>;
}

export default function KitchenTicket({
  order,
  tone,
  now,
  busy,
  disabled,
  onStart,
  onItem,
  onReady,
  onReport,
}: Props) {
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const elapsed = Math.max(
    0,
    Math.floor((now - Date.parse(order.createdAt)) / 60_000),
  );
  const preparing = order.status === "PREPARING";
  const activeItems = order.items.filter((item) => item.status !== "CANCELLED");
  const count = activeItems.reduce((sum, item) => sum + item.quantity, 0);
  const ready = activeItems.reduce(
    (sum, item) => sum + (item.status === "READY" ? item.quantity : 0),
    0,
  );
  const canFinish = preparing && order.items.length > 0 && ready === count;

  return (
    <article
      aria-label={`Order #${order.orderNumber}`}
      aria-busy={busy}
      className={`min-w-0 overflow-hidden rounded-2xl border bg-gradient-to-br from-[#0d1117] via-[#090b0f] to-[#07090c] shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-shadow duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] ${tone.border}`}
    >
      <header
        className={`flex items-start justify-between gap-3 border-b bg-gradient-to-r px-4 py-4 ${tone.header}`}
      >
        <div className="min-w-0">
          <p
            className={`font-mono text-[10px] font-bold uppercase tracking-[0.14em] ${tone.accent}`}
          >
            #{order.orderNumber}
          </p>
          <h3 className="mt-1.5 break-words text-lg font-semibold tracking-tight text-white">
            {order.tableId ? `Table ${order.tableId}` : types[order.type]}
          </h3>
        </div>
        {Number.isFinite(elapsed) && (
          <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-700/70 bg-zinc-950/40 px-2 py-1.5 font-mono text-[10px] tabular-nums text-zinc-400"
            title="Time since order was placed"
          >
            <Clock3 aria-hidden="true" className="size-3.5" />
            {elapsed < 1 ? "<1 min" : `${elapsed} min`}
          </span>
        )}
      </header>

      <ul className="divide-y divide-zinc-800/80 px-4">
        {order.items.map((item) => {
          const awaiting = needsUnavailableReview(item);
          const canReport =
            (order.status === "CONFIRMED" || preparing) &&
            (item.status === "PENDING" || item.status === "PREPARING");
          return (
            <li key={item.id} className="space-y-2 py-3.5">
              <div className="flex items-center gap-2">
                <div className="flex min-w-0 flex-1 items-start gap-2.5">
                  <span
                    className={`grid min-h-6 min-w-6 shrink-0 place-items-center rounded-md border border-zinc-800 bg-zinc-900/70 px-1 font-mono text-[10px] leading-5 ${tone.accent}`}
                  >
                    {item.quantity}×
                  </span>
                  <div className="min-w-0">
                    <p
                      className={`break-words text-xs font-semibold leading-5 ${item.status === "CANCELLED" ? "text-zinc-500 line-through" : "text-zinc-100"}`}
                    >
                      {item.name}
                    </p>
                    {item.modifiers.length > 0 && (
                      <p className="mt-1 break-words border-l border-violet-400/30 pl-2 text-[11px] leading-5 text-violet-300">
                        {item.modifiers
                          .map(({ name, quantity }) =>
                            quantity > 1 ? `${quantity}× ${name}` : name,
                          )
                          .join(", ")}
                      </p>
                    )}
                    {awaiting ? (
                      <p className="mt-0.5 text-xs text-amber-200">
                        Awaiting cashier review
                      </p>
                    ) : (
                      order.status !== "CONFIRMED" && (
                        <p
                          className={`mt-0.5 text-xs ${itemColors[item.status]}`}
                        >
                          {itemLabels[item.status]}
                        </p>
                      )
                    )}
                  </div>
                </div>
                {canReport && !awaiting && (
                  <button
                    type="button"
                    disabled={disabled}
                    aria-expanded={reportingId === item.id}
                    aria-controls={
                      reportingId === item.id
                        ? `unavailable-${item.id}`
                        : undefined
                    }
                    aria-label={`Report ${item.name} unavailable`}
                    title="Report unavailable"
                    onClick={() => {
                      setReason("");
                      setReportingId(reportingId === item.id ? null : item.id);
                    }}
                    className="grid size-9 shrink-0 place-items-center rounded-lg text-zinc-400 enabled:hover:bg-amber-400/10 enabled:hover:text-amber-200 aria-expanded:bg-amber-400/10 aria-expanded:text-amber-200 focus-visible:outline-2 focus-visible:outline-amber-300 disabled:opacity-50"
                  >
                    <Flag aria-hidden="true" className="size-4" />
                  </button>
                )}
                {preparing &&
                  !awaiting &&
                  (item.status === "PENDING" ||
                    item.status === "PREPARING") && (
                    <button
                      type="button"
                      disabled={disabled || reportingId === item.id}
                      onClick={() => onItem(order, item)}
                      className={`${itemAction} min-w-[4.75rem] ${item.status === "PREPARING" ? "border-emerald-400/45 bg-emerald-400/10 text-emerald-100" : ""}`}
                      aria-label={
                        item.status === "PENDING"
                          ? `Start cooking ${item.name}`
                          : `Mark ${item.name} ready`
                      }
                    >
                      {item.status === "PENDING" ? "Start" : "Ready"}
                      {item.status === "PENDING" ? (
                        <ChevronRight aria-hidden="true" className="size-3.5" />
                      ) : (
                        <Check aria-hidden="true" className="size-3.5" />
                      )}
                    </button>
                  )}
              </div>
              {canReport && !awaiting && reportingId === item.id && (
                <form
                  id={`unavailable-${item.id}`}
                  className="space-y-2 rounded-lg border border-amber-400/25 bg-zinc-950/70 p-3"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (!reason.trim() || disabled) return;
                    if (await onReport(order, item, reason.trim()))
                      setReportingId(null);
                  }}
                >
                  <label className="block text-xs font-medium text-amber-100">
                    Reason for reporting {item.name}
                    <textarea
                      required
                      maxLength={500}
                      rows={2}
                      value={reason}
                      disabled={disabled}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="e.g. Sold out"
                      className="mt-1 block w-full rounded-md border border-zinc-600 bg-zinc-900 px-2 py-1.5 text-sm text-white focus-visible:outline-2 focus-visible:outline-amber-300"
                    />
                  </label>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => setReportingId(null)}
                      className={itemAction}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={disabled || !reason.trim()}
                      className="inline-flex min-h-10 items-center rounded-lg bg-amber-200 px-3 text-xs font-semibold text-amber-950 enabled:hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:opacity-50"
                    >
                      Send to cashier
                    </button>
                  </div>
                </form>
              )}
            </li>
          );
        })}
      </ul>

      {order.status === "CONFIRMED" && (
        <footer className="border-t border-zinc-700/70 px-3.5 py-2.5">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onStart(order)}
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-sky-400 px-3 text-xs font-semibold text-zinc-950 shadow-[0_4px_16px_rgba(56,189,248,0.12)] transition-colors enabled:hover:bg-sky-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 disabled:opacity-50"
          >
            <CookingPot aria-hidden="true" className="size-4" /> Start cooking
          </button>
        </footer>
      )}
      {preparing && (
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 bg-zinc-950/60 px-4 py-3">
          <span className="font-mono text-[10px] font-medium tabular-nums text-amber-300">
            {ready} of {count} ready
          </span>
          {canFinish && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onReady(order)}
              className={itemAction}
            >
              Mark ticket ready
            </button>
          )}
        </footer>
      )}
      {order.status === "READY" && (
        <footer className="flex items-center gap-2 border-t border-emerald-400/20 bg-emerald-400/[0.08] px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
          <Check aria-hidden="true" className="size-4" /> Ready for pickup
        </footer>
      )}
    </article>
  );
}
