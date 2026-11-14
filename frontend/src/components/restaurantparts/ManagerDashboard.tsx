"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChefHat,
  CreditCard,
  MapPin,
  Package,
  RefreshCw,
  Store,
  Users,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import RevenueChart from "@/elements/edgedashboard/RevenueChart";
import usePlatformFormatter from "@/hooks/usePlatformFormatter";
import { getAttendance, getShiftSchedules } from "@/lib/hr-api";
import { getRestaurantLowStock } from "@/lib/inventory-api";
import { getNotifications } from "@/lib/notification-api";
import { orderApi } from "@/lib/order-api";
import { useOrganizationStore } from "@/store/organization-store";
import type { Restaurant } from "@/utils/types/organization";

const panelClass = "min-w-0 rounded-2xl border border-zinc-800 bg-[#101219]";

const tones = {
  emerald: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  sky: "border-sky-400/25 bg-sky-400/10 text-sky-300",
  violet: "border-violet-400/25 bg-violet-400/10 text-violet-300",
  amber: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  rose: "border-rose-400/25 bg-rose-400/10 text-rose-300",
  neutral: "border-zinc-700 bg-zinc-800/60 text-zinc-300",
};

type Tone = keyof typeof tones;

const stations = [
  { label: "POS", href: "/restaurant/pos", icon: CreditCard },
  { label: "Waiter", href: "/restaurant/waiter", icon: Utensils },
  { label: "Kitchen", href: "/restaurant/kitchen", icon: ChefHat },
];

const orderStatus = {
  PENDING: { label: "Pending", tone: "amber" },
  CONFIRMED: { label: "Confirmed", tone: "sky" },
  PREPARING: { label: "Preparing", tone: "violet" },
  READY: { label: "Ready", tone: "emerald" },
  COMPLETED: { label: "Completed", tone: "emerald" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
} satisfies Record<string, { label: string; tone: Tone }>;

const alertPriority = {
  LOW: { label: "Low", tone: "neutral" },
  NORMAL: { label: "Normal", tone: "sky" },
  HIGH: { label: "High", tone: "amber" },
  CRITICAL: { label: "Critical", tone: "rose" },
} satisfies Record<string, { label: string; tone: Tone }>;

const number = new Intl.NumberFormat("en-IN");

async function loadActivity(restaurantId: string, signal: AbortSignal) {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86_400_000);

  const [orders, stock, attendance, shifts, alerts] = await Promise.all([
    orderApi.getDashboard(signal).catch(() => null),
    getRestaurantLowStock(restaurantId, { page: 1, limit: 5 }, { signal })
      .catch(() => null),
    getAttendance({ restaurantId }).catch(() => null),
    getShiftSchedules({
      restaurantId,
      startDate: now.toISOString(),
      endDate: tomorrow.toISOString(),
    }).catch(() => null),
    getNotifications(
      "RESTAURANT",
      restaurantId,
      { page: 1, limit: 5, isRead: false },
      { signal },
    ).catch(() => null),
  ]);

  return { orders, stock, attendance, shifts, alerts };
}

type Activity = Awaited<ReturnType<typeof loadActivity>>;

function Badge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}>
      {label}
    </span>
  );
}

function Panel({
  title,
  icon: Icon,
  tone,
  href,
  children,
}: {
  title: string;
  icon: LucideIcon;
  tone: Tone;
  href?: string;
  children: ReactNode;
}) {
  return (
    <section className={panelClass}>
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${tones[tone]}`}>
            <Icon aria-hidden="true" className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
        </div>
        {href && (
          <Link
            href={href}
            aria-label={`View ${title}`}
            className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded px-1 text-xs font-medium text-zinc-300 hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            View
            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </section>
  );
}

interface Row {
  id: string;
  title: string;
  detail: string;
  badge?: { label: string; tone: Tone };
}

function Rows({ items, empty }: { items?: Row[]; empty: string }) {
  if (!items?.length) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-700 px-3 py-4 text-sm text-zinc-400">
        {items ? empty : "Data unavailable. Try refreshing."}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-800">
      {items.map(({ id, title, detail, badge }) => (
        <li key={id} className="flex flex-wrap items-start justify-between gap-2 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0 flex-1 basis-32">
            <p className="break-words text-sm font-medium text-white">{title}</p>
            <p className="mt-1 break-words text-xs leading-5 text-zinc-400">{detail}</p>
          </div>
          {badge && <Badge {...badge} />}
        </li>
      ))}
    </ul>
  );
}

export default function ManagerDashboard() {
  const user = useOrganizationStore((state) => state.currentUser?.systemUser);
  const restaurant = useOrganizationStore((state) => state.selectedRestaurant);
  const hydrated = useOrganizationStore((state) => state.isHydrated);
  const error = useOrganizationStore((state) => state.error);

  if (!hydrated) {
    return (
      <p role="status" className={`${panelClass} p-5 text-sm text-zinc-300`}>
        Loading your restaurant…
      </p>
    );
  }

  if (error) {
    return (
      <div role="alert" className={`${panelClass} p-5 text-sm text-zinc-300`}>
        <p>{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 text-emerald-300 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const isManager = user?.role === "RESTAURANT_ADMIN";

  if (!user?.isActive || (!isManager && user.role !== "STAFF")) {
    return (
      <p className={`${panelClass} p-5 text-sm text-zinc-300`}>
        Sign in with an active restaurant account.
      </p>
    );
  }

  if (!restaurant || restaurant.id !== user.managedRestaurantId) {
    return (
      <p className={`${panelClass} p-5 text-sm text-zinc-300`}>
        Your account has no assigned restaurant.
      </p>
    );
  }

  const active = restaurant.status === "ACTIVE";
  const location = [restaurant.city, restaurant.state, restaurant.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <header className="relative isolate overflow-hidden rounded-3xl border border-teal-400/25 bg-[#101b23] px-5 py-5 sm:px-7 sm:py-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,#134e4a,transparent_65%),radial-gradient(ellipse_at_bottom_right,#312e81,transparent_60%)]"
        />
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex min-w-0 items-start gap-3.5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-emerald-300/30 bg-emerald-300/15 text-emerald-200">
              <Store aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="break-words text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {restaurant.name}
                </h1>
                <Badge
                  label={active ? "Active" : "Inactive"}
                  tone={active ? "emerald" : "neutral"}
                />
              </div>
              {location && (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-200">
                  <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
                  {location}
                </p>
              )}
              <p className="mt-1 text-xs text-zinc-300">
                {user.firstName} {user.lastName} · {isManager ? "Restaurant Manager" : "Staff"}
              </p>
            </div>
          </div>

          <nav aria-label="Restaurant stations" className="flex flex-wrap gap-2">
            {stations.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 ${
                  label === "POS"
                    ? "border-emerald-300 bg-emerald-300 text-emerald-950 hover:bg-emerald-200"
                    : "border-white/20 bg-zinc-950/55 text-zinc-100 hover:bg-zinc-800"
                }`}
              >
                <Icon aria-hidden="true" className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {isManager && (
        <RestaurantActivity key={`${user.id}:${restaurant.id}`} restaurant={restaurant} />
      )}
    </div>
  );
}

function RestaurantActivity({ restaurant }: { restaurant: Restaurant }) {
  const { formatDateTime } = usePlatformFormatter();
  const restaurantId = restaurant.id;
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ revision: number; data: Activity } | null>(null);

  const loading = result?.revision !== revision;
  const data = result?.data;

  useEffect(() => {
    const controller = new AbortController();

    void loadActivity(restaurantId, controller.signal).then((activity) => {
      if (!controller.signal.aborted) {
        setResult({ revision, data: activity });
      }
    });

    return () => controller.abort();
  }, [restaurantId, revision]);

  const attendance = data?.attendance?.data;
  const seenStaff = new Set<string>();
  const onDuty = attendance?.filter((record) => {
    if (seenStaff.has(record.staffId)) return false;
    seenStaff.add(record.staffId);
    return record.clockOutAt === null;
  });

  const metrics = [
    {
      label: "Kitchen queue",
      value: data?.orders?.queueTotal,
      icon: ChefHat,
      tone: "sky",
      surface: "border-sky-400/20 from-sky-950/70",
    },
    {
      label: "Staff clocked in",
      value: onDuty?.length,
      icon: Users,
      tone: "violet",
      surface: "border-violet-400/20 from-violet-950/70",
    },
    {
      label: "Low stock",
      value: data?.stock?.pagination.total,
      icon: Package,
      tone: "amber",
      surface: "border-amber-400/20 from-amber-950/55",
    },
    {
      label: "Unread alerts",
      value: data?.alerts?.pagination.total,
      icon: Bell,
      tone: "rose",
      surface: "border-rose-400/20 from-rose-950/55",
    },
  ] satisfies Array<{
    label: string;
    value: number | undefined;
    icon: LucideIcon;
    tone: Tone;
    surface: string;
  }>;

  return (
    <section aria-labelledby="restaurant-activity" aria-busy={loading} className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="restaurant-activity" className="text-lg font-semibold text-white">
          Restaurant activity
        </h2>
        <button
          type="button"
          disabled={loading}
          onClick={() => setRevision((value) => value + 1)}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-xs font-medium text-zinc-200 hover:border-emerald-400/40 hover:text-emerald-200 disabled:opacity-60"
        >
          <RefreshCw aria-hidden="true" className={`h-4 w-4 ${loading ? "motion-safe:animate-spin" : ""}`} />
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, tone, surface }) => (
          <div key={label} className={`min-w-0 rounded-2xl border bg-gradient-to-br to-[#101219] p-4 ${surface}`}>
            <dt className="flex items-center gap-2.5 text-sm font-medium text-zinc-100">
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${tones[tone]}`}>
                <Icon aria-hidden="true" className="h-4 w-4" />
              </span>
              {label}
            </dt>
            <dd className="mt-3 tabular-nums">
              {value === undefined ? (
                <span className="text-sm text-zinc-300">
                  {data ? "Unavailable" : "Loading…"}
                </span>
              ) : (
                <span className="text-3xl font-semibold tracking-tight text-white">
                  {number.format(value)}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      {data && (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-4">
            <Panel title="Net payments · Last 7 UTC days" icon={Wallet} tone="emerald">
              {data.orders ? (
                <RevenueChart
                  revenue={data.orders.revenue}
                  currency={restaurant.defaultCurrency}
                />
              ) : (
                <p className="text-sm text-zinc-400">
                  Payment data unavailable. Try refreshing.
                </p>
              )}
            </Panel>

            <Panel title="Kitchen queue" icon={ChefHat} tone="sky" href="/restaurant/kitchen">
              <Rows
                empty="No orders waiting for the kitchen."
                items={data.orders?.queue.map((order) => ({
                  id: order.id,
                  title: `Order #${order.orderNumber}`,
                  detail: `Placed ${formatDateTime(order.createdAt)}`,
                  badge: orderStatus[order.status],
                }))}
              />
            </Panel>

            <Panel title="Shifts · Next 24 hours" icon={CalendarDays} tone="violet" href="/restaurant/attendancereports">
              <Rows
                empty="No shifts scheduled in the next 24 hours."
                items={data.shifts?.data
                  .filter((shift) => shift.status === "SCHEDULED")
                  .slice(0, 5)
                  .map((shift) => ({
                    id: shift.id,
                    title: `${shift.staff.firstName} ${shift.staff.lastName}`,
                    detail: `${formatDateTime(shift.scheduledStart)} – ${formatDateTime(shift.scheduledEnd)}`,
                  }))}
              />
            </Panel>
          </div>

          <div className="min-w-0 space-y-4">
            <Panel title="Unread alerts" icon={Bell} tone="rose" href="/restaurant/alerts">
              <Rows
                empty="No unread alerts."
                items={data.alerts?.data.map((alert) => ({
                  id: alert.id,
                  title: alert.title,
                  detail: alert.message,
                  badge: alertPriority[alert.priority],
                }))}
              />
            </Panel>

            <Panel title="Low stock" icon={Package} tone="amber" href="/restaurant/inventory">
              <Rows
                empty="No ingredients are at or below their reorder level."
                items={data.stock?.data.map((stock) => {
                  const unit = stock.ingredient?.uom ? ` ${stock.ingredient.uom}` : "";
                  const outOfStock = Number(stock.quantityOnHand) <= 0;

                  return {
                    id: stock.id,
                    title: stock.ingredient?.name ?? `Ingredient ${stock.ingredientId}`,
                    detail: `${stock.quantityOnHand}${unit} on hand · Reorder at ${stock.reorderLevel}${unit}`,
                    badge: outOfStock
                      ? { label: "Out of stock", tone: "rose" }
                      : { label: "Low", tone: "amber" },
                  };
                })}
              />
            </Panel>

            <Panel title="Clocked in" icon={Users} tone="violet" href="/restaurant/attendancereports">
              <Rows
                empty="No staff currently clocked in."
                items={onDuty?.slice(0, 5).map((record) => ({
                  id: record.id,
                  title: `${record.staff.firstName} ${record.staff.lastName}`,
                  detail: `Since ${formatDateTime(record.clockInAt)}`,
                }))}
              />
            </Panel>
          </div>
        </div>
      )}
    </section>
  );
}