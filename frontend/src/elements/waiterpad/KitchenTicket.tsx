import type { Order, OrderItemStatus } from "@/lib/order-api";
import type { ReactNode } from "react";

const itemStatus: Record<
  OrderItemStatus,
  { label: string; tone: string; dot: string }
> = {
  PENDING: {
    label: "Queued",
    tone: "text-sky-200",
    dot: "bg-sky-300",
  },
  PREPARING: {
    label: "Preparing",
    tone: "text-amber-200",
    dot: "bg-amber-300",
  },
  READY: {
    label: "Ready",
    tone: "text-emerald-200",
    dot: "bg-emerald-300",
  },
  CANCELLED: {
    label: "Cancelled",
    tone: "text-zinc-300",
    dot: "bg-slate-400",
  },
};

interface Props {
  order: Order;
  formatMoney: (amount: number) => string;
  actions?: ReactNode;
}

export default function KitchenTicket({ order, formatMoney, actions }: Props) {
  const items = order.items.filter((item) => item.status !== "CANCELLED");
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const ready = items.reduce(
    (sum, item) => sum + (item.status === "READY" ? item.quantity : 0),
    0,
  );
  const money = (value: string) => formatMoney(Number(value));
  const hasAdjustments =
    Number(order.discount) !== 0 || Number(order.tax) !== 0;

  return (
    <section
      aria-labelledby="waiter-ticket-title"
      className="overflow-hidden rounded-2xl border border-zinc-700/80 bg-[#18191d] shadow-lg shadow-black/20"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 bg-[#232a27] px-4 py-3">
        <div className="min-w-0">
          <h2
            id="waiter-ticket-title"
            className="text-sm font-semibold text-white"
          >
            Kitchen ticket
          </h2>
          <p className="mt-0.5 text-xs text-zinc-300">
            {quantity} {quantity === 1 ? "item" : "items"}
            {quantity > 0 && order.status !== "PENDING" && ` · ${ready} ready`}
          </p>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </header>

      {order.items.length ? (
        <div className="max-h-[25rem] overflow-y-auto border-y border-white/10">
          <table
            aria-labelledby="waiter-ticket-title"
            className="w-full text-left text-sm"
          >
            <thead className="sticky top-0 bg-[#25262b] text-xs font-medium text-zinc-200">
              <tr>
                <th scope="col" className="px-4 py-2.5 sm:px-5">
                  Item
                </th>
                <th
                  scope="col"
                  className="hidden px-3 py-2.5 text-right sm:table-cell"
                >
                  Qty
                </th>
                <th
                  scope="col"
                  className="hidden whitespace-nowrap px-3 py-2.5 text-right sm:table-cell"
                >
                  Unit price
                </th>
                <th scope="col" className="hidden px-3 py-2.5 sm:table-cell">
                  Status
                </th>
                <th
                  scope="col"
                  className="whitespace-nowrap px-4 py-2.5 text-right sm:px-5"
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {order.items.map((item) => {
                const status =
                  item.status === "PENDING" && order.status === "PENDING"
                    ? {
                        label: "Unconfirmed",
                        tone: "text-amber-200",
                        dot: "bg-amber-300",
                      }
                    : itemStatus[item.status];
                const badge = (
                  <span
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium ${status.tone}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`size-1.5 rounded-full ${status.dot}`}
                    />
                    {status.label}
                  </span>
                );

                return (
                  <tr key={item.id} className="even:bg-[#202126]">
                    <th
                      scope="row"
                      className="px-4 py-3 align-top font-normal sm:px-5"
                    >
                      <p className="break-words font-medium text-white">
                        {item.name}
                      </p>
                      {item.modifiers.length > 0 && (
                        <p className="mt-1 break-words text-xs text-zinc-300">
                          {item.modifiers
                            .map(({ name, quantity }) =>
                              quantity > 1 ? `${quantity} × ${name}` : name,
                            )
                            .join(", ")}
                        </p>
                      )}
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs tabular-nums text-zinc-300 sm:hidden">
                        <span>
                          {item.quantity} × {money(item.price)}
                        </span>
                        {badge}
                      </div>
                    </th>
                    <td className="hidden px-3 py-3 text-right tabular-nums text-zinc-300 sm:table-cell">
                      {item.quantity}
                    </td>
                    <td className="hidden whitespace-nowrap px-3 py-3 text-right tabular-nums text-zinc-300 sm:table-cell">
                      {money(item.price)}
                    </td>
                    <td className="hidden px-3 py-3 sm:table-cell">{badge}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right align-top font-semibold tabular-nums text-white sm:px-5 sm:align-middle">
                      {money(item.total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="border-y border-white/10 px-4 py-4 text-sm text-zinc-300 sm:px-5">
          No items on this ticket.
        </p>
      )}

      <footer className="bg-[#232429]">
        <dl className="ml-auto grid max-w-sm grid-cols-[1fr_auto] items-center gap-x-5 gap-y-1.5 px-4 py-3 text-sm sm:px-5">
          {hasAdjustments && (
            <>
              <dt className="text-zinc-300">Subtotal</dt>
              <dd className="text-right tabular-nums text-zinc-200">
                {money(order.subtotal)}
              </dd>
            </>
          )}
          {Number(order.discount) !== 0 && (
            <>
              <dt className="text-zinc-300">Discount</dt>
              <dd className="text-right tabular-nums text-zinc-200">
                {formatMoney(-Number(order.discount))}
              </dd>
            </>
          )}
          {Number(order.tax) !== 0 && (
            <>
              <dt className="text-zinc-300">Tax</dt>
              <dd className="text-right tabular-nums text-zinc-200">
                {money(order.tax)}
              </dd>
            </>
          )}
          <div
            className={`col-span-2 flex items-baseline justify-between gap-5 ${hasAdjustments ? "mt-1 border-t border-white/10 pt-2" : ""}`}
          >
            <dt className="font-semibold text-white">Order total</dt>
            <dd className="text-sm font-semibold tabular-nums text-emerald-100">
              {money(order.total)}
            </dd>
          </div>
        </dl>
      </footer>
    </section>
  );
}
