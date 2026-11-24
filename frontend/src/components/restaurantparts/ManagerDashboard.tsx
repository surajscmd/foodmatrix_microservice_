"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Bell,
  CalendarDays,
  ChefHat,
  Package,
  RefreshCw,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import {
  DashboardPanel as Panel,
  DashboardRows as Rows,
  dashboardPanelClass as panelClass,
  type DashboardTone as Tone,
} from "@/elements/dashboard/DashboardPanel";
import RevenueChart from "@/elements/edgedashboard/RevenueChart";
import RestaurantWorkspaceHeader from "@/elements/edgedashboard/RestaurantWorkspaceHeader";
import MetricCard from "@/elements/operations/MetricCard";
import usePlatformFormatter from "@/hooks/usePlatformFormatter";
import { getAttendance, getShiftSchedules } from "@/lib/hr-api";
import { getRestaurantLowStock } from "@/lib/inventory-api";
import { getNotifications } from "@/lib/notification-api";
import { orderApi } from "@/lib/order-api";
import { useOrganizationStore } from "@/store/organization-store";
import type { Restaurant } from "@/utils/types/organization";

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
    getRestaurantLowStock(
      restaurantId,
      { page: 1, limit: 5 },
      { signal },
    ).catch(() => null),
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

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 motion-safe:animate-fade-in">
      <RestaurantWorkspaceHeader
        restaurant={restaurant}
        accountName={[user.firstName, user.lastName].filter(Boolean).join(" ")}
        isManager={isManager}
      />

      {isManager && (
        <RestaurantActivity
          key={`${user.id}:${restaurant.id}`}
          restaurant={restaurant}
        />
      )}
    </div>
  );
}

function RestaurantActivity({ restaurant }: { restaurant: Restaurant }) {
  const { formatDateTime } = usePlatformFormatter();
  const restaurantId = restaurant.id;
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    revision: number;
    data: Activity;
  } | null>(null);

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
      description: "Orders awaiting completion",
      icon: ChefHat,
      tone: "sky",
    },
    {
      label: "Staff clocked in",
      value: onDuty?.length,
      description: "Staff currently on duty",
      icon: Users,
      tone: "violet",
    },
    {
      label: "Low stock",
      value: data?.stock?.pagination.total,
      description: "Ingredients at or below reorder level",
      icon: Package,
      tone: "amber",
    },
    {
      label: "Unread alerts",
      value: data?.alerts?.pagination.total,
      description: "Notifications awaiting review",
      icon: Bell,
      tone: "rose",
    },
  ] satisfies Array<{
    label: string;
    value: number | undefined;
    description: string;
    icon: LucideIcon;
    tone: "sky" | "violet" | "amber" | "rose";
  }>;

  return (
    <section
      aria-labelledby="restaurant-activity"
      aria-busy={loading}
      className="space-y-5"
    >
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-400">
            <Activity className="size-4" aria-hidden />
          </span>
          <h2
            id="restaurant-activity"
            className="text-base font-semibold tracking-tight text-white sm:text-lg"
          >
            Restaurant activity
          </h2>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => setRevision((value) => value + 1)}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-400 transition-colors hover:border-emerald-400/30 hover:bg-emerald-400/5 hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-emerald-400 disabled:opacity-60"
        >
          <RefreshCw
            aria-hidden="true"
            className={`h-4 w-4 ${loading ? "motion-safe:animate-spin" : ""}`}
          />
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, description, icon, tone }) => (
          <MetricCard
            key={label}
            title={label}
            value={
              value === undefined
                ? data
                  ? "Unavailable"
                  : "Loading…"
                : number.format(value)
            }
            description={description}
            icon={icon}
            tone={tone}
          />
        ))}
      </div>

      {data && (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-6">
            <Panel
              title="Net payments · Last 7 UTC days"
              icon={Wallet}
              tone="emerald"
            >
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

            <Panel
              title="Kitchen queue"
              icon={ChefHat}
              tone="sky"
              href="/restaurant/kitchen"
            >
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

            <Panel
              title="Shifts · Next 24 hours"
              icon={CalendarDays}
              tone="violet"
              href="/restaurant/attendancereports"
            >
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

          <div className="min-w-0 space-y-6">
            <Panel
              title="Unread alerts"
              icon={Bell}
              tone="rose"
              href="/restaurant/alerts"
            >
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

            <Panel
              title="Low stock"
              icon={Package}
              tone="amber"
              href="/restaurant/inventory"
            >
              <Rows
                empty="No ingredients are at or below their reorder level."
                items={data.stock?.data.map((stock) => {
                  const unit = stock.ingredient?.uom
                    ? ` ${stock.ingredient.uom}`
                    : "";
                  const outOfStock = Number(stock.quantityOnHand) <= 0;

                  return {
                    id: stock.id,
                    title:
                      stock.ingredient?.name ??
                      `Ingredient ${stock.ingredientId}`,
                    detail: `${stock.quantityOnHand}${unit} on hand · Reorder at ${stock.reorderLevel}${unit}`,
                    badge: outOfStock
                      ? { label: "Out of stock", tone: "rose" }
                      : { label: "Low", tone: "amber" },
                  };
                })}
              />
            </Panel>

            <Panel
              title="Clocked in"
              icon={Users}
              tone="violet"
              href="/restaurant/attendancereports"
            >
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
