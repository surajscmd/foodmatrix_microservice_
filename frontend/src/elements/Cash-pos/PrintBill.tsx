"use client";

import { Printer } from "lucide-react";
import { useRef, useState } from "react";
import type { Order } from "@/lib/order-api";
import type { Restaurant } from "@/utils/types/organization";

interface Props {
  order: Order;
  restaurant: Restaurant;
  formatMoney: (amount: number) => string;
  disabled: boolean;
}

const orderTypes = {
  DINE_IN: "Dine-in",
  TAKEAWAY: "Takeaway",
  DELIVERY: "Delivery",
};
const paymentMethods = {
  CASH: "Cash",
  CARD: "Card",
  UPI: "UPI",
  ONLINE: "Online",
};

const receiptStyles = `
  @page { margin: 3mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #000; background: #fff; font: 10pt/1.4 Arial, sans-serif; }
  article { max-width: 72mm; margin: 0 auto; overflow-wrap: anywhere; }
  header { text-align: center; border-bottom: 1px dashed #444; padding-bottom: 3mm; }
  h1 { margin: 0; font-size: 15pt; }
  h2 { margin: 0 0 2mm; font-size: 11pt; }
  p { margin: 1mm 0 0; }
  section { border-bottom: 1px dashed #444; padding: 2.5mm 0; }
  table { border-collapse: collapse; width: 100%; font-size: inherit; }
  th, td { padding: 1mm 0; text-align: left; vertical-align: top; }
  th:last-child, td:last-child { padding-left: 2mm; text-align: right; white-space: nowrap; }
  thead { border-bottom: 1px solid #777; }
  tr { break-inside: avoid; }
  small { display: block; font-size: 9pt; }
  dl { margin: 0; }
  dl div { display: flex; justify-content: space-between; gap: 2mm; margin: 0.5mm 0; break-inside: avoid; }
  dd { margin: 0; white-space: nowrap; }
  .total { font-size: 12pt; font-weight: bold; padding-top: 1mm; }
`;

export default function PrintBill({
  order,
  restaurant,
  formatMoney,
  disabled,
}: Props) {
  const receipt = useRef<HTMLElement>(null);
  const printFrame = useRef<HTMLIFrameElement | null>(null);
  const [error, setError] = useState("");
  const [printing, setPrinting] = useState(false);

  const payments = order.payments.filter(
    ({ status }) => status === "COMPLETED",
  );
  const refunds = order.payments.filter(({ status }) => status === "REFUNDED");
  const received = order.payments.filter(
    ({ status }) => status === "COMPLETED" || status === "REFUNDED",
  );
  const paidCents = payments.reduce(
    (sum, payment) => sum + Math.round(Number(payment.amount) * 100),
    0,
  );
  const refundedCents = refunds.reduce(
    (sum, payment) => sum + Math.round(Number(payment.amount) * 100),
    0,
  );
  const totalCents = Math.round(Number(order.total) * 100);
  const balance = Math.max(0, totalCents - paidCents) / 100;
  const cancelled = order.status === "CANCELLED";
  const fullyRefunded =
    refundedCents > 0 && paidCents === 0 && refundedCents >= totalCents;
  const customerName = order.customer?.name?.trim();
  const address = [
    restaurant.address,
    restaurant.city,
    restaurant.state,
    restaurant.country,
  ]
    .filter(Boolean)
    .join(", ");
  const money = (amount: string) => formatMoney(Number(amount));

  function print() {
    if (!receipt.current || printFrame.current || disabled) return;
    setError("");

    const frame = document.createElement("iframe");
    frame.title = "Printable bill";
    frame.tabIndex = -1;
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText =
      "position:fixed;width:1px;height:1px;bottom:0;right:0;border:0;opacity:0;pointer-events:none";
    document.body.appendChild(frame);
    printFrame.current = frame;
    setPrinting(true);

    function cleanUp() {
      frame.remove();
      printFrame.current = null;
      setPrinting(false);
    }

    const printWindow = frame.contentWindow;
    const printDocument = frame.contentDocument;
    if (!printWindow || !printDocument) {
      cleanUp();
      setError("Could not open the printable bill. Try again.");
      return;
    }

    printDocument.title = `Bill #${order.orderNumber} · ${restaurant.name}`;
    printDocument.documentElement.lang = "en";
    const style = printDocument.createElement("style");
    style.textContent = receiptStyles;
    printDocument.head.appendChild(style);
    printDocument.body.appendChild(
      printDocument.importNode(receipt.current, true),
    );
    printWindow.addEventListener("afterprint", cleanUp, { once: true });

    try {
      printWindow.print();
    } catch {
      cleanUp();
      setError("Could not open the print dialog. Try again.");
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled || printing}
        onClick={print}
        className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg border border-sky-300/30 px-3 text-xs font-semibold text-sky-100 enabled:hover:bg-sky-300/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 disabled:opacity-50"
      >
        <Printer aria-hidden="true" className="size-4" /> Print bill
      </button>
      {error && (
        <p role="alert" className="w-full text-xs text-rose-200">
          {error}
        </p>
      )}

      <div hidden>
        <article ref={receipt}>
          <header>
            <h1>{restaurant.name}</h1>
            {address && <p>{address}</p>}
            <p>
              <strong>
                {cancelled
                  ? "Cancelled bill"
                  : fullyRefunded
                    ? "Refunded bill"
                    : "Restaurant bill"}{" "}
                #{order.orderNumber}
              </strong>
            </p>
            <p>{formatOrderDate(order.createdAt, restaurant.timezone)}</p>
            <p>
              {orderTypes[order.type]}
              {order.tableId ? ` · Table ${order.tableId}` : ""}
            </p>
            {customerName && <p>Guest · {customerName}</p>}
          </header>

          <section>
            <table>
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.name}
                      {item.status === "CANCELLED" ? " (cancelled)" : ""}
                      <small>
                        {item.quantity} × {money(item.price)}
                      </small>
                      {item.modifiers.map((modifier) => (
                        <small key={modifier.id}>
                          {modifier.quantity} × {modifier.name}
                        </small>
                      ))}
                    </td>
                    <td>{money(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section aria-label="Bill totals">
            <dl>
              <div>
                <dt>Subtotal</dt>
                <dd>{money(order.subtotal)}</dd>
              </div>
              {Number(order.discount) !== 0 && (
                <div>
                  <dt>Discount</dt>
                  <dd>{formatMoney(-Number(order.discount))}</dd>
                </div>
              )}
              {Number(order.tax) !== 0 && (
                <div>
                  <dt>Tax</dt>
                  <dd>{money(order.tax)}</dd>
                </div>
              )}
              <div className="total">
                <dt>Total</dt>
                <dd>{money(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h2>Payments</h2>
            <dl>
              {received.map((payment) => (
                <div key={payment.id}>
                  <dt>{paymentMethods[payment.method]}</dt>
                  <dd>{money(payment.amount)}</dd>
                </div>
              ))}
              {refunds.map((payment) => (
                <div key={`refund-${payment.id}`}>
                  <dt>{paymentMethods[payment.method]} refund</dt>
                  <dd>{formatMoney(-Number(payment.amount))}</dd>
                </div>
              ))}
              {received.length === 0 && (
                <div>
                  <dt>Paid</dt>
                  <dd>{formatMoney(0)}</dd>
                </div>
              )}
              {!cancelled &&
                !fullyRefunded &&
                (order.status !== "COMPLETED" || refundedCents === 0) && (
                  <div className="total">
                    <dt>Balance due</dt>
                    <dd>{formatMoney(balance)}</dd>
                  </div>
                )}
            </dl>
          </section>
        </article>
      </div>
    </>
  );
}

function formatOrderDate(value: string, timeZone: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  };
  try {
    return new Intl.DateTimeFormat("en-IN", { ...options, timeZone }).format(
      date,
    );
  } catch {
    return new Intl.DateTimeFormat("en-IN", options).format(date);
  }
}
