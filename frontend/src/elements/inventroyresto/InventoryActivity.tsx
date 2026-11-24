import {
  Boxes,
  ClipboardList,
  History,
  PackageCheck,
  Truck,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import type {
  StockMovementView,
  StockRequest,
  StockTransfer,
  Pagination,
} from "@/lib/inventory-api";
import { InventoryPagination } from "@/elements/rawmaterial/InventoryShared";
import { RequestStatusBadge } from "@/elements/stockrequest/StockRequestTable";
import {
  AuditMovementBadge,
  AuditQuantity,
} from "@/elements/stockaudit/StockAuditTable";
import { formatDate, panel, quantity, statusLabel } from "./inventory-view";

const cell = "px-4 py-3.5";
const tableStyle = "w-full text-left text-xs";
const head =
  "border-b border-zinc-800 bg-zinc-950/50 font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-500";
const rowStyle = "transition-colors even:bg-zinc-900/20 hover:bg-zinc-900/50";
const action =
  "inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-3 text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50";
type IngredientLabel = (id: string) => string;

function ActivityPanel({
  title,
  description,
  icon: Icon,
  count,
  empty,
  children,
  footer,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  count: number;
  empty: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section aria-label={title} className={panel}>
      <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-4 sm:px-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-emerald-500/10 bg-emerald-500/10 text-emerald-400">
          <Icon size={16} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xs font-semibold text-zinc-200">{title}</h2>
          <p className="mt-1 text-[10px] text-zinc-500">{description}</p>
        </div>
        <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 font-mono text-[10px] tabular-nums text-zinc-400">
          {count}
        </span>
      </div>
      {count ? (
        <div className="overflow-x-auto">{children}</div>
      ) : (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 px-4 py-8 text-center">
          <Icon size={24} className="text-zinc-700" aria-hidden />
          <p className="text-xs text-zinc-500">{empty}</p>
        </div>
      )}
      {footer ?? (
        <p className="border-t border-zinc-800 px-4 py-3 text-[11px] tabular-nums text-zinc-500">
          {count} {count === 1 ? "record" : "records"}
        </p>
      )}
    </section>
  );
}

function Reference({
  id,
  prefix,
  date,
  timezone,
}: {
  id: string;
  prefix: string;
  date: string;
  timezone: string;
}) {
  return (
    <div className="min-w-36">
      <span
        title={id}
        className="font-mono text-[11px] font-semibold text-zinc-200"
      >
        {prefix}-{id.slice(0, 8)}
      </span>
      <p className="mt-1.5 whitespace-nowrap text-[10px] font-normal text-zinc-500">
        {formatDate(date, timezone)}
      </p>
    </div>
  );
}

function TransferStatus({ status }: { status: StockTransfer["status"] }) {
  const tone = ["COMPLETED", "APPROVED"].includes(status)
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
    : ["DISPUTED", "REJECTED"].includes(status)
      ? "border-rose-500/20 bg-rose-500/10 text-rose-300"
      : ["SHIPPED", "IN_TRANSIT"].includes(status)
        ? "border-sky-500/20 bg-sky-500/10 text-sky-300"
        : status === "CANCELLED"
          ? "border-zinc-700 bg-zinc-800/50 text-zinc-400"
          : "border-amber-500/20 bg-amber-500/10 text-amber-300";
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider ${tone}`}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
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
    <ActivityPanel
      title="Stock requests"
      description="Requested ingredients, warehouse decisions and approved quantities"
      icon={ClipboardList}
      count={rows.length}
      empty="No stock requests yet."
    >
      <table className={tableStyle}>
        <caption className="sr-only">Restaurant stock requests</caption>
        <thead className={head}>
          <tr>
            <th scope="col" className={cell}>
              Request / Date
            </th>
            <th scope="col" className={cell}>
              Ingredients / Quantities
            </th>
            <th scope="col" className={cell}>
              Status
            </th>
            <th scope="col" className={cell}>
              Notes
            </th>
            {canManage && (
              <th scope="col" className={`${cell} text-right`}>
                Action
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {rows.map((row) => (
            <tr key={row.id} className={rowStyle}>
              <th scope="row" className={`${cell} align-top`}>
                <Reference
                  id={row.id}
                  prefix="REQ"
                  date={row.requestedAt}
                  timezone={timezone}
                />
              </th>
              <td className={`${cell} min-w-64 align-top`}>
                <ul className="divide-y divide-zinc-800/70">
                  {(row.items ?? []).map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 first:pt-0 last:pb-0"
                    >
                      <span className="min-w-0 break-words font-medium text-zinc-200">
                        {item.ingredient?.name ??
                          ingredientLabel(item.ingredientId)}
                      </span>
                      <span className="flex flex-wrap gap-2 text-[10px] tabular-nums">
                        <span className="rounded-md border border-zinc-800 bg-zinc-900/70 px-2 py-1 text-zinc-300">
                          {quantity(item.requestedQty)} {item.ingredient?.uom}{" "}
                          <span className="text-zinc-500">requested</span>
                        </span>
                        {item.approvedQty !== null && (
                          <span className="rounded-md border border-emerald-500/15 bg-emerald-500/5 px-2 py-1 text-emerald-300">
                            {quantity(item.approvedQty)} {item.ingredient?.uom}{" "}
                            approved
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                {!row.items?.length && (
                  <span className="text-[11px] text-zinc-500">
                    No ingredient details
                  </span>
                )}
              </td>
              <td className={`${cell} align-top`}>
                <RequestStatusBadge status={row.status} />
              </td>
              <td
                className={`${cell} min-w-40 max-w-72 align-top text-[11px] leading-5 text-zinc-400`}
              >
                {row.reason && <p className="break-words">{row.reason}</p>}
                {row.rejectionReason && (
                  <p className="mt-1 break-words text-rose-300">
                    {row.rejectionReason}
                  </p>
                )}
                {!row.reason && !row.rejectionReason && (
                  <span className="text-zinc-600">—</span>
                )}
              </td>
              {canManage && (
                <td className={`${cell} text-right align-top`}>
                  {row.status === "REQUESTED" ? (
                    <button
                      type="button"
                      disabled={busy}
                      aria-label={`Cancel request ${row.id.slice(0, 8)}`}
                      className={`${action} border-rose-500/20 bg-rose-500/10 text-rose-300 enabled:hover:border-rose-400/40 enabled:hover:bg-rose-500/20 focus-visible:outline-rose-300`}
                      onClick={() => onCancel(row)}
                    >
                      <X size={13} aria-hidden /> Cancel
                    </button>
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </ActivityPanel>
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
    <ActivityPanel
      title="Warehouse deliveries"
      description="Shipment progress, tracking and received ingredient quantities"
      icon={Truck}
      count={rows.length}
      empty="No warehouse deliveries yet."
    >
      <table className={tableStyle}>
        <caption className="sr-only">Restaurant warehouse deliveries</caption>
        <thead className={head}>
          <tr>
            <th scope="col" className={cell}>
              Delivery / Date
            </th>
            <th scope="col" className={cell}>
              Ingredients / Quantities
            </th>
            <th scope="col" className={cell}>
              Status
            </th>
            <th scope="col" className={cell}>
              Tracking
            </th>
            {canManage && (
              <th scope="col" className={`${cell} text-right`}>
                Action
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {rows.map((row) => (
            <tr key={row.id} className={rowStyle}>
              <th scope="row" className={`${cell} align-top`}>
                <Reference
                  id={row.id}
                  prefix="TRF"
                  date={row.shippedAt ?? row.createdAt}
                  timezone={timezone}
                />
              </th>
              <td className={`${cell} min-w-64 align-top`}>
                <ul className="divide-y divide-zinc-800/70">
                  {(row.items ?? []).map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 first:pt-0 last:pb-0"
                    >
                      <span className="min-w-0 break-words font-medium text-zinc-200">
                        {item.ingredient?.name ??
                          ingredientLabel(item.ingredientId)}
                      </span>
                      <span className="flex flex-wrap gap-2 text-[10px] tabular-nums">
                        <span className="rounded-md border border-sky-500/15 bg-sky-500/5 px-2 py-1 text-sky-300">
                          {quantity(
                            item.shippedQty ??
                              item.approvedQty ??
                              item.requestedQty,
                          )}{" "}
                          {item.ingredient?.uom}{" "}
                          {item.shippedQty !== null
                            ? "shipped"
                            : item.approvedQty !== null
                              ? "approved"
                              : "requested"}
                        </span>
                        {item.receivedQty !== null && (
                          <span className="rounded-md border border-emerald-500/15 bg-emerald-500/5 px-2 py-1 text-emerald-300">
                            {quantity(item.receivedQty)} {item.ingredient?.uom}{" "}
                            received
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                {!row.items?.length && (
                  <span className="text-[11px] text-zinc-500">
                    No ingredient details
                  </span>
                )}
              </td>
              <td className={`${cell} align-top`}>
                <TransferStatus status={row.status} />
              </td>
              <td
                className={`${cell} max-w-52 align-top text-[11px] text-zinc-400`}
              >
                {row.shipment?.trackingNumber ? (
                  <span className="break-words font-mono text-zinc-300">
                    {row.shipment.trackingNumber}
                  </span>
                ) : (
                  <span className="text-zinc-600">—</span>
                )}
              </td>
              {canManage && (
                <td className={`${cell} text-right align-top`}>
                  {row.status === "SHIPPED" || row.status === "IN_TRANSIT" ? (
                    <button
                      type="button"
                      disabled={busy}
                      aria-label={`Receive delivery ${row.id.slice(0, 8)}`}
                      className={`${action} border-emerald-500/20 bg-emerald-500/10 text-emerald-300 enabled:hover:border-emerald-400 enabled:hover:bg-emerald-400 enabled:hover:text-zinc-950 focus-visible:outline-emerald-300`}
                      onClick={() => onReceive(row)}
                    >
                      <PackageCheck size={14} aria-hidden /> Receive delivery
                    </button>
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </ActivityPanel>
  );
}

export function MovementTable({
  rows,
  timezone,
  pagination,
  disabled,
  onPage,
  onLimit,
}: {
  rows: StockMovementView[];
  timezone: string;
  pagination: Pagination;
  disabled: boolean;
  onPage: (page: number) => void;
  onLimit: (limit: number) => void;
}) {
  return (
    <ActivityPanel
      title="Stock movements"
      description="Ingredient changes and references for the current page"
      icon={History}
      count={rows.length}
      empty="No stock movements recorded."
      footer={
        <InventoryPagination
          page={pagination.page}
          limit={pagination.limit}
          total={pagination.total}
          itemLabel="stock movements"
          loading={disabled}
          onPageChange={onPage}
          onLimitChange={onLimit}
        />
      }
    >
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
              Reference / Notes
            </th>
            <th scope="col" className={cell}>
              Recorded
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {rows.map((row) => (
            <tr key={row.id} className={rowStyle}>
              <th scope="row" className={`${cell} font-semibold text-zinc-200`}>
                <span className="flex min-w-36 items-center gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-zinc-800 bg-zinc-900/70 text-emerald-400">
                    <Boxes size={14} aria-hidden />
                  </span>
                  <span className="break-words">
                    {row.ingredient?.name ?? row.ingredientId}
                  </span>
                </span>
              </th>
              <td className={cell}>
                <AuditMovementBadge type={row.movementType} />
              </td>
              <td className={`${cell} whitespace-nowrap text-right`}>
                <AuditQuantity
                  value={row.quantityChange}
                  unit={row.ingredient?.uom}
                />
              </td>
              <td
                className={`${cell} min-w-40 max-w-72 text-[11px] leading-5 text-zinc-400`}
              >
                {row.referenceId && (
                  <p className="break-all font-mono text-[10px] text-zinc-500">
                    {row.referenceId}
                  </p>
                )}
                {row.reason && <p className="break-words">{row.reason}</p>}
                {!row.referenceId && !row.reason && (
                  <span className="text-zinc-600">—</span>
                )}
              </td>
              <td
                className={`${cell} whitespace-nowrap text-[11px] text-zinc-400`}
              >
                {formatDate(row.createdAt, timezone)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ActivityPanel>
  );
}
