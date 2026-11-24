import {
  Activity,
  BellRing,
  Building2,
  ChefHat,
  RefreshCw,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  DashboardBadge,
  DashboardRows,
} from "@/elements/dashboard/DashboardPanel";
import DetailMetricCard from "@/elements/shared/DetailMetricCard";
import RevenueChart from "@/elements/edgedashboard/RevenueChart";
import { RestaurantDetailPanel as DashboardPanel } from "./RestaurantRecordDetails";
import usePlatformFormatter from "@/hooks/usePlatformFormatter";
import type { Restaurant } from "@/utils/types/organization";
import useRestaurantDetails from "./useRestaurantDetails";

function value<T>(result?: PromiseSettledResult<T>) {
  return result?.status === "fulfilled" ? result.value : undefined;
}

function SourceContent({
  source,
  children,
}: {
  source?: PromiseSettledResult<unknown>;
  children: ReactNode;
}) {
  if (!source)
    return (
      <p role="status" className="py-8 text-center text-xs text-zinc-500">
        Loading restaurant data…
      </p>
    );
  if (source.status === "rejected")
    return (
      <p
        role="alert"
        className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-5 text-amber-300"
      >
        {source.reason instanceof Error
          ? source.reason.message
          : "This data is unavailable. Try refreshing."}
      </p>
    );
  return children;
}

const head =
  "border-b border-zinc-800 font-mono text-[9px] uppercase tracking-wider text-zinc-500";
const cell = "px-2 py-3";

export default function RestaurantOperationalOverview({
  restaurant,
  currency,
  recordDetails,
}: {
  restaurant: Restaurant;
  currency?: string;
  recordDetails: ReactNode;
}) {
  const { data, loading, refresh } = useRestaurantDetails(restaurant.id);
  const { formatDateTime } = usePlatformFormatter();
  const orders = value(data?.orders);
  const staff = value(data?.staff)?.data;
  const attendance = value(data?.attendance)?.data;
  const stock = value(data?.stock);
  const lowStock = value(data?.lowStock);
  const menu = value(data?.menu);
  const working = new Set(
    attendance
      ?.filter((shift) => !shift.clockOutAt)
      .map((shift) => shift.staffId),
  );
  const day = new Date().toISOString().slice(0, 10);
  const today = orders
    ? (orders.revenue.find((entry) => entry.day === day)?.amount ?? 0)
    : undefined;
  const currencyCode = currency?.trim().toUpperCase();
  const money = new Intl.NumberFormat(
    "en-IN",
    currencyCode && /^[A-Z]{3}$/.test(currencyCode)
      ? { style: "currency", currency: currencyCode }
      : { maximumFractionDigits: 2 },
  );
  const sources = [
    { label: "Order reporting", source: data?.orders },
    { label: "Staff directory", source: data?.staff },
    { label: "Attendance", source: data?.attendance },
    { label: "Stock balances", source: data?.stock },
    { label: "Low-stock report", source: data?.lowStock },
    { label: "Restaurant menu", source: data?.menu },
  ];

  const loadedSources = sources.filter(
    ({ source }) => source?.status === "fulfilled",
  ).length;
  const cards = [
    {
      label: "Node Registry",
      value: "Registered",
      description: "Organization Service",
      icon: Building2,
      tone: "emerald" as const,
    },
    {
      label: "Workforce",
      value: staff?.pagination.total ?? "—",
      description: "Active employees · HR Service",
      icon: Users,
      tone: "sky" as const,
    },
    {
      label: "Data Sources",
      value: loading ? "Loading…" : `${loadedSources} / ${sources.length}`,
      description: "Connected reports loaded",
      icon: Activity,
      tone: "violet" as const,
    },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map(({ label, value, description, icon, tone }) => (
          <DetailMetricCard
            key={label}
            title={label}
            value={value}
            description={description}
            icon={icon}
            tone={tone}
          />
        ))}
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="inline-flex min-h-8 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-[11px] text-zinc-400 enabled:hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-50"
        >
          <RefreshCw
            size={14}
            aria-hidden
            className={loading ? "motion-safe:animate-spin" : ""}
          />
          Refresh data
        </button>
      </div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="min-w-0 space-y-6 lg:col-span-7">
          {recordDetails}
          <DashboardPanel
            title="POS revenue · Last 7 UTC days"
            action={
              <span className="text-[10px] text-zinc-500">
                Today (UTC){" "}
                <strong className="ml-1 text-zinc-200">
                  {today === undefined ? "—" : money.format(today)}
                </strong>
              </span>
            }
            icon={Wallet}
            tone="emerald"
          >
            <SourceContent source={data?.orders}>
              {orders && (
                <RevenueChart revenue={orders.revenue} currency={currency} />
              )}
            </SourceContent>
          </DashboardPanel>
          <DashboardPanel
            title="Kitchen queue"
            icon={ChefHat}
            tone="sky"
            action={
              <DashboardBadge
                label={orders ? `${orders.queueTotal} open` : "—"}
                tone="sky"
              />
            }
          >
            <SourceContent source={data?.orders}>
              <DashboardRows
                empty="No orders waiting for the kitchen."
                items={orders?.queue.map((order) => ({
                  id: order.id,
                  title: `Order #${order.orderNumber}`,
                  detail: `Placed ${formatDateTime(order.createdAt)}`,
                  badge: {
                    label: order.status.replaceAll("_", " "),
                    tone:
                      order.status === "READY"
                        ? "emerald"
                        : order.status === "PENDING"
                          ? "amber"
                          : "sky",
                  },
                }))}
              />
              {orders && orders.queue.length < orders.queueTotal && (
                <p className="mt-3 border-t border-zinc-800 pt-3 text-[10px] text-zinc-500">
                  Showing {orders.queue.length} of {orders.queueTotal} open
                  orders
                </p>
              )}
            </SourceContent>
          </DashboardPanel>
          <DashboardPanel
            title="Restaurant menu"
            icon={UtensilsCrossed}
            tone="emerald"
            href="/operations/menu"
            action={
              menu?.availabilityCounts ? (
                <>
                  <DashboardBadge
                    label={`${menu.availabilityCounts.available} available`}
                    tone="emerald"
                  />
                  <DashboardBadge
                    label={`${menu.availabilityCounts.unavailable} unavailable`}
                    tone="neutral"
                  />
                </>
              ) : undefined
            }
          >
            <SourceContent source={data?.menu}>
              {!menu?.data.length ? (
                <p className="py-6 text-center text-xs text-zinc-500">
                  No menu items are assigned to this restaurant.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-xs">
                      <caption className="sr-only">
                        Restaurant selling prices and availability
                      </caption>
                      <thead className={head}>
                        <tr>
                          <th className={cell}>Menu item</th>
                          <th className={cell}>Category</th>
                          <th className={`${cell} text-right`}>
                            Selling price
                          </th>
                          <th className={`${cell} text-right`}>Availability</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/70">
                        {menu.data.map((item) => (
                          <tr key={item.id} className="hover:bg-zinc-900/50">
                            <th scope="row" className={cell}>
                              <p className="font-medium text-zinc-200">
                                {item.name}
                              </p>
                              <p className="mt-1 font-mono text-[9px] font-normal text-zinc-500">
                                {item.sku}
                              </p>
                            </th>
                            <td className={`${cell} text-zinc-400`}>
                              {item.category.name}
                            </td>
                            <td className={`${cell} text-right`}>
                              <p className="font-mono font-semibold text-zinc-200">
                                {money.format(item.price)}
                              </p>
                              <p className="mt-1 text-[9px] text-zinc-500">
                                {item.restaurantConfigured
                                  ? "Restaurant price"
                                  : "Default price"}
                              </p>
                            </td>
                            <td className={`${cell} text-right`}>
                              <DashboardBadge
                                label={
                                  item.isAvailable ? "Available" : "Unavailable"
                                }
                                tone={item.isAvailable ? "emerald" : "rose"}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 border-t border-zinc-800 pt-3 text-[10px] text-zinc-500">
                    Showing {menu.data.length} of {menu.pagination.total} menu
                    items
                  </p>
                </>
              )}
            </SourceContent>
          </DashboardPanel>
        </div>
        <div className="min-w-0 space-y-6 lg:col-span-5">
          <DashboardPanel
            title="Node Active Alarm Triggers"
            icon={BellRing}
            tone="amber"
            action={
              <DashboardBadge
                label={
                  stock
                    ? `${stock.pagination.total} stock records`
                    : "Stock count unavailable"
                }
                tone="neutral"
              />
            }
          >
            <SourceContent source={data?.lowStock}>
              <DashboardRows
                empty="No ingredients are at or below their reorder level."
                items={lowStock?.data.map((item) => ({
                  id: item.id,
                  title: item.ingredient?.name ?? item.ingredientId,
                  detail: `${Number(item.quantityOnHand).toLocaleString("en-IN")} ${item.ingredient?.uom ?? ""} on hand · Reorder at ${item.reorderLevel}`,
                  badge: {
                    label:
                      Number(item.quantityOnHand) <= 0
                        ? "Out of stock"
                        : "Low stock",
                    tone: Number(item.quantityOnHand) <= 0 ? "rose" : "amber",
                  },
                }))}
              />
              {lowStock && (
                <p className="mt-3 border-t border-zinc-800 pt-3 text-[10px] text-zinc-500">
                  Showing {lowStock.data.length} of {lowStock.pagination.total}{" "}
                  stock exceptions
                </p>
              )}
            </SourceContent>
          </DashboardPanel>
          <DashboardPanel
            title="Active Roster Checkin"
            icon={Users}
            tone="violet"
            href="/operations/staff"
            action={
              <DashboardBadge
                label={
                  attendance
                    ? `${working.size} clocked in`
                    : "Attendance unavailable"
                }
                tone={attendance ? "emerald" : "neutral"}
              />
            }
          >
            <SourceContent source={data?.staff}>
              {!staff?.data.length ? (
                <p className="py-6 text-center text-xs text-zinc-500">
                  No active staff are assigned to this restaurant.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-80 text-left text-xs">
                      <caption className="sr-only">
                        Active restaurant workforce
                      </caption>
                      <thead className={head}>
                        <tr>
                          <th className={cell}>Employee</th>
                          <th className={cell}>Role</th>
                          <th className={`${cell} text-right`}>Attendance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/70">
                        {staff.data.map((person) => (
                          <tr key={person.id} className="hover:bg-zinc-900/50">
                            <th scope="row" className={cell}>
                              <div className="flex items-center gap-2.5">
                                <span
                                  aria-hidden
                                  className="grid size-8 shrink-0 place-items-center rounded-lg border border-zinc-800 bg-zinc-900 text-[10px] text-emerald-400"
                                >
                                  {person.firstName[0]}
                                  {person.lastName[0]}
                                </span>
                                <div>
                                  <p className="font-medium text-zinc-200">
                                    {person.firstName} {person.lastName}
                                  </p>
                                  <p className="mt-1 font-mono text-[9px] font-normal text-zinc-500">
                                    {person.employeeCode}
                                  </p>
                                </div>
                              </div>
                            </th>
                            <td className={`${cell} text-zinc-400`}>
                              {person.role.replaceAll("_", " ")}
                            </td>
                            <td className={`${cell} text-right`}>
                              <DashboardBadge
                                label={
                                  !attendance
                                    ? "Unavailable"
                                    : working.has(person.id)
                                      ? "Clocked in"
                                      : "Not clocked in"
                                }
                                tone={
                                  attendance && working.has(person.id)
                                    ? "emerald"
                                    : "neutral"
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 border-t border-zinc-800 pt-3 text-[10px] text-zinc-500">
                    Showing {staff.data.length} of {staff.pagination.total}{" "}
                    active staff
                  </p>
                </>
              )}
            </SourceContent>
          </DashboardPanel>
          <DashboardPanel title="Data availability" icon={Activity} tone="sky">
            <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {sources.map(({ label, source }) => (
                <li
                  key={label}
                  className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2.5"
                >
                  <span className="text-[11px] text-zinc-400">{label}</span>
                  <DashboardBadge
                    label={
                      !source
                        ? "Loading"
                        : source.status === "fulfilled"
                          ? "Loaded"
                          : "Unavailable"
                    }
                    tone={
                      source?.status === "fulfilled"
                        ? "emerald"
                        : source
                          ? "amber"
                          : "neutral"
                    }
                  />
                </li>
              ))}
            </ul>
          </DashboardPanel>
        </div>
      </div>
    </div>
  );
}
