import type {
  StockMovementView,
  StockRequest,
  StockTransfer,
} from "@/lib/inventory-api";
import {
  button,
  formatDate,
  panel,
  quantity,
  statusLabel,
} from "./inventory-view";

const cell = "px-4 py-3";
const tableStyle = "w-full text-left text-sm";
const head = "border-b border-zinc-700 bg-zinc-900 text-xs text-zinc-300";

type IngredientLabel = (id: string) => string;
function Status({ status }: { status: string }) {
  const tone = ["COMPLETED", "FULFILLED", "APPROVED"].includes(status)
    ? "text-emerald-200"
    : ["DISPUTED", "REJECTED"].includes(status)
      ? "text-rose-200"
      : status === "CANCELLED"
        ? "text-zinc-400"
        : "text-amber-200";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${tone}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {statusLabel(status)}
    </span>
  );
}

export function RequestList({
  rows,
  timezone,
  ingredientLabel,
  canManage,
  busy,
  onCancel,
}: {
  rows: StockRequest[];
  timezone: string;
  ingredientLabel: IngredientLabel;
  canManage: boolean;
  busy: boolean;
  onCancel: (row: StockRequest) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {!rows.length && (
        <p className={`${panel} p-4 text-sm text-zinc-300`}>
          No stock requests yet.
        </p>
      )}
      {rows.map((row) => (
        <article
          key={row.id}
          className={`${panel} bg-linear-to-br from-emerald-950/40 via-[#18191d] to-[#18191d] p-4 shadow-md shadow-black/20`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-white">
              Request <span className="font-mono">#{row.id.slice(0, 8)}</span>
            </h3>
            <Status status={row.status} />
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            {formatDate(row.requestedAt, timezone)}
          </p>
          {row.reason && (
            <p className="mt-2 break-words text-sm text-zinc-300">
              {row.reason}
            </p>
          )}
          {row.rejectionReason && (
            <p className="mt-2 break-words text-sm text-rose-200">
              {row.rejectionReason}
            </p>
          )}
          <ul className="mt-3 divide-y divide-zinc-800 border-y border-zinc-800">
            {(row.items ?? []).map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 py-2 text-sm"
              >
                <span className="min-w-0 break-words">
                  {item.ingredient?.name ?? ingredientLabel(item.ingredientId)}
                </span>
                <span className="text-right text-xs tabular-nums text-zinc-300">
                  {quantity(item.requestedQty)} requested
                  {item.approvedQty !== null &&
                    ` · ${quantity(item.approvedQty)} approved`}
                </span>
              </li>
            ))}
          </ul>
          {canManage && row.status === "REQUESTED" && (
            <button
              type="button"
              disabled={busy}
              className={`${button} mt-3 text-rose-200`}
              onClick={() => onCancel(row)}
            >
              Cancel request
            </button>
          )}
        </article>
      ))}
    </div>
  );
}

export function TransferList({
  rows,
  timezone,
  ingredientLabel,
  canManage,
  busy,
  onReceive,
}: {
  rows: StockTransfer[];
  timezone: string;
  ingredientLabel: IngredientLabel;
  canManage: boolean;
  busy: boolean;
  onReceive: (row: StockTransfer) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {!rows.length && (
        <p className={`${panel} p-4 text-sm text-zinc-300`}>
          No warehouse deliveries yet.
        </p>
      )}
      {rows.map((row) => (
        <article
          key={row.id}
          className={`${panel} bg-linear-to-br from-teal-950/40 via-[#18191d] to-[#18191d] p-4 shadow-md shadow-black/20`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-white">
              Transfer <span className="font-mono">#{row.id.slice(0, 8)}</span>
            </h3>
            <Status status={row.status} />
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            {formatDate(row.shippedAt ?? row.createdAt, timezone)}
          </p>
          {row.shipment?.trackingNumber && (
            <p className="mt-2 break-words text-xs text-zinc-300">
              Tracking {row.shipment.trackingNumber}
            </p>
          )}
          <ul className="mt-3 divide-y divide-zinc-800 border-y border-zinc-800">
            {(row.items ?? []).map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 py-2 text-sm"
              >
                <span className="min-w-0 break-words">
                  {item.ingredient?.name ?? ingredientLabel(item.ingredientId)}
                </span>
                <span className="text-right text-xs tabular-nums text-zinc-300">
                  {quantity(
                    item.shippedQty ?? item.approvedQty ?? item.requestedQty,
                  )}{" "}
                  {item.shippedQty !== null
                    ? "shipped"
                    : item.approvedQty !== null
                      ? "approved"
                      : "requested"}
                  {item.receivedQty !== null &&
                    ` · ${quantity(item.receivedQty)} received`}
                </span>
              </li>
            ))}
          </ul>
          {canManage &&
            (row.status === "SHIPPED" || row.status === "IN_TRANSIT") && (
              <button
                type="button"
                disabled={busy}
                className={`${button} mt-3`}
                onClick={() => onReceive(row)}
              >
                Receive delivery
              </button>
            )}
        </article>
      ))}
    </div>
  );
}

export function MovementTable({
  rows,
  timezone,
}: {
  rows: StockMovementView[];
  timezone: string;
}) {
  return (
    <div className={`${panel} overflow-x-auto`}>
      <table className={tableStyle}>
        <caption className="sr-only">Restaurant stock movements</caption>
        <thead className={head}>
          <tr>
            <th scope="col" className={cell}>
              Ingredient
            </th>
            <th scope="col" className={cell}>
              Movement
            </th>
            <th scope="col" className={`${cell} text-right`}>
              Change
            </th>
            <th scope="col" className={cell}>
              Recorded
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {rows.map((row) => (
            <tr key={row.id} className="even:bg-white/3">
              <th scope="row" className={`${cell} font-medium text-white`}>
                {row.ingredient?.name ?? row.ingredientId}
              </th>
              <td className={cell}>
                {statusLabel(row.movementType)}
                {row.reason && (
                  <span className="mt-1 block text-xs text-zinc-400">
                    {row.reason}
                  </span>
                )}
              </td>
              <td
                className={`${cell} whitespace-nowrap text-right font-medium tabular-nums ${Number(row.quantityChange) < 0 ? "text-amber-200" : "text-emerald-200"}`}
              >
                {Number(row.quantityChange) > 0 ? "+" : ""}
                {quantity(row.quantityChange)} {row.ingredient?.uom}
              </td>
              <td className={`${cell} whitespace-nowrap text-xs text-zinc-300`}>
                {formatDate(row.createdAt, timezone)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <p className="px-4 py-6 text-sm text-zinc-300">
          No stock movements recorded.
        </p>
      )}
    </div>
  );
}
