"use client";

import {
  Activity,
  BarChart3,
  Bell,
  ChefHat,
  History,
  LayoutGrid,
  Package,
  ShoppingBag,
  Store,
  Users,
  Wallet,
} from "lucide-react";

import {
  DashboardBadge,
  DashboardPanel,
  DashboardRows,
} from "@/elements/dashboard/DashboardPanel";
import RevenueChart from "@/elements/edgedashboard/RevenueChart";
import CreateSystemUser from "@/elements/operations/CreateSystemUser";
import ManageSystemLogins from "@/elements/operations/ManageSystemLogins";
import FranchiseOverview from "@/elements/operations/FranchiseOverview";
import MetricCard from "@/elements/operations/MetricCard";
import QuickActionCard from "@/elements/operations/QuickActionCard";
import RegionPerformanceCard from "@/elements/operations/RegionPerformanceCard";
import useOperationsMetrics from "@/elements/operations/useOperationsMetrics";

export default function OperationsControlScreen() {
  const {
    restaurants,
    orders,
    staff,
    currency,
    alerts,
    activity,
    activityError,
    activityLoading,
    locationId,
    accountReady,
  } = useOperationsMetrics();
  const day = new Date().toISOString().slice(0, 10);
  const money = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: /^[A-Z]{3}$/.test(currency) ? currency : "INR",
  });
  const time = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const allOrdersLoaded =
    orders != null && orders.every(({ dashboard }) => dashboard !== null);
  const totals = new Map<string, number>();
  if (allOrdersLoaded) {
    for (const { dashboard } of orders) {
      for (const { day, amount } of dashboard?.revenue ?? []) {
        totals.set(day, (totals.get(day) ?? 0) + amount);
      }
    }
  }
  const revenue = Array.from(totals, ([day, amount]) => ({ day, amount })).sort(
    (a, b) => a.day.localeCompare(b.day),
  );
  const today = allOrdersLoaded ? (totals.get(day) ?? 0) : null;
  const openOrders = allOrdersLoaded
    ? orders.reduce((sum, item) => sum + (item.dashboard?.queueTotal ?? 0), 0)
    : null;
  const activeRestaurants = restaurants?.filter(
    (restaurant) => restaurant.status === "ACTIVE",
  ).length;
  const criticalAlerts =
    alerts?.data.filter((alert) => alert.priority === "CRITICAL") ?? [];
  const sources = [
    {
      service: "Restaurant directory",
      state: restaurants
        ? "Available"
        : accountReady
          ? "Unavailable"
          : "Loading",
    },
    {
      service: "Order Service",
      state: allOrdersLoaded
        ? "Available"
        : orders === undefined
          ? "Loading"
          : orders?.some(({ dashboard }) => dashboard)
            ? "Partial data"
            : "Unavailable",
    },
    {
      service: "HR Service",
      state:
        staff == null
          ? staff === null
            ? "Unavailable"
            : "Loading"
          : "Available",
    },
    {
      service: "Warehouse notifications",
      state:
        activityError || (!locationId && accountReady)
          ? "Unavailable"
          : activityLoading || !locationId
            ? "Loading"
            : "Available",
    },
  ];
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}

      <FranchiseOverview />
      <CreateSystemUser />
      <ManageSystemLogins />
      {/* KPI */}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Revenue Today"
          value={today === null ? "—" : money.format(today)}
          description="Net payments today (UTC)"
          icon={Wallet}
          tone="emerald"
        />
        <MetricCard
          title="Kitchen Queue"
          value={openOrders ?? "—"}
          description="Orders awaiting completion"
          icon={ChefHat}
          tone="sky"
        />
        <MetricCard
          title="Restaurants"
          value={activeRestaurants ?? "—"}
          description="Active locations"
          icon={Store}
          tone="violet"
        />
        <MetricCard
          title="Employees"
          value={staff ?? "—"}
          description="Staff visible to your account"
          icon={Users}
          tone="amber"
        />
      </section>
      {/* Quick Actions */}

      <DashboardPanel title="Quick actions" icon={LayoutGrid} tone="emerald">
        <nav
          aria-label="Quick actions"
          className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3"
        >
          <QuickActionCard
            title="Franchise Network"
            description="Locations and restaurant access"
            href="/operations/restaurants"
            icon={Store}
            tone="violet"
          />

          <QuickActionCard
            title="Staff Registry"
            description="Employees, roles and allocation"
            href="/operations/staff"
            icon={Users}
            tone="sky"
          />

          <QuickActionCard
            title="Inventory"
            description="Stock levels and warehouse balances"
            href="/operations/inventory"
            icon={ShoppingBag}
            tone="emerald"
          />

          <QuickActionCard
            title="Stock Audit"
            description="Movements, references and corrections"
            href="/operations/stockaudit"
            icon={BarChart3}
            tone="amber"
          />

          <QuickActionCard
            title="Fulfillment"
            description="Shipments, transfers and deliveries"
            href="/operations/fulfillment"
            icon={Package}
            tone="sky"
          />

          <QuickActionCard
            title="Alerts Hub"
            description="Warehouse alerts and stock updates"
            href="/operations/notifications"
            icon={Bell}
            tone="rose"
          />
        </nav>
      </DashboardPanel>

      <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <DashboardPanel
          title="Revenue overview"
          icon={Wallet}
          tone="emerald"
          action={
            <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/15 bg-emerald-400/5 px-2.5 py-1.5">
              <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400">
                Today · UTC
              </span>
              <span className="text-xs font-semibold tabular-nums text-zinc-100">
                {today === null ? "—" : money.format(today)}
              </span>
            </span>
          }
        >
          {allOrdersLoaded && revenue.length > 0 ? (
            <RevenueChart revenue={revenue} currency={currency} />
          ) : (
            <p className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-[#070914] px-4 text-center text-xs leading-5 text-zinc-500">
              {orders === undefined
                ? "Loading revenue…"
                : allOrdersLoaded
                  ? "No restaurant payments to display."
                  : "Revenue is unavailable for one or more restaurants."}
            </p>
          )}
        </DashboardPanel>

        <DashboardPanel title="Data sources" icon={Activity} tone="sky">
          <ul className="divide-y divide-zinc-800">
            {sources.map((source) => (
              <li
                key={source.service}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg px-2 py-3.5 transition-colors first:pt-1 last:pb-1 hover:bg-zinc-900/50"
              >
                <span className="text-xs font-medium text-zinc-200">
                  {source.service}
                </span>
                <DashboardBadge
                  label={source.state}
                  tone={
                    source.state === "Available"
                      ? "emerald"
                      : source.state === "Loading"
                        ? "neutral"
                        : "amber"
                  }
                />
              </li>
            ))}
          </ul>
        </DashboardPanel>
      </section>

      <DashboardPanel
        title="Critical alerts"
        icon={Bell}
        tone="rose"
        href="/operations/notifications"
        action={
          <DashboardBadge
            label={alerts ? `${criticalAlerts.length} shown` : "—"}
            tone={criticalAlerts.length ? "rose" : "neutral"}
          />
        }
      >
        <DashboardRows
          empty={
            alerts
              ? "No critical alerts among recent unread warehouse notifications."
              : alerts === null || (!locationId && accountReady)
                ? "Warehouse alerts are unavailable."
                : "Loading warehouse alerts…"
          }
          items={criticalAlerts.map((alert) => ({
            id: alert.id,
            title: alert.title,
            detail: `${alert.message} · ${time.format(new Date(alert.createdAt))}`,
            badge: { label: "Critical", tone: "rose" },
          }))}
        />
      </DashboardPanel>

      <DashboardPanel
        title="Restaurant performance"
        icon={Store}
        tone="violet"
        href="/operations/restaurants"
      >
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {!restaurants?.length && (
            <p className="rounded-xl border border-dashed border-zinc-800 bg-[#070914] p-4 text-xs leading-5 text-zinc-500">
              {restaurants
                ? "No restaurants in this franchise."
                : accountReady
                  ? "The restaurant directory is unavailable."
                  : "Loading restaurants…"}
            </p>
          )}
          {(restaurants ?? []).map((restaurant) => {
            const dashboard = orders?.find(
              (item) => item.restaurant.id === restaurant.id,
            )?.dashboard;
            const amount = dashboard?.revenue.find(
              (entry) => entry.day === day,
            )?.amount;
            return (
              <RegionPerformanceCard
                key={restaurant.id}
                restaurant={restaurant}
                revenue={amount === undefined ? "—" : money.format(amount)}
                activeOrders={dashboard?.queueTotal}
              />
            );
          })}
        </div>
      </DashboardPanel>

      <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <DashboardPanel
          title="Live operational statistics"
          icon={BarChart3}
          tone="emerald"
        >
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              {
                label: "Restaurants",
                value: restaurants?.length,
                icon: Store,
                color: "text-violet-300",
                background: "border-violet-400/15 bg-violet-400/5",
              },
              {
                label: "Active locations",
                value: activeRestaurants,
                icon: Activity,
                color: "text-emerald-300",
                background: "border-emerald-400/15 bg-emerald-400/5",
              },
              {
                label: "Unread warehouse alerts",
                value: alerts?.pagination.total,
                icon: Bell,
                color: "text-amber-300",
                background: "border-amber-400/15 bg-amber-400/5",
              },
              {
                label: "Locations reporting orders",
                value: orders?.filter(({ dashboard }) => dashboard !== null)
                  .length,
                icon: ChefHat,
                color: "text-sky-300",
                background: "border-sky-400/15 bg-sky-400/5",
              },
            ].map(({ label, value, icon: Icon, color, background }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4"
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-lg border ${background} ${color}`}
                >
                  <Icon size={16} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <dt className="font-mono text-[9px] uppercase leading-4 tracking-wider text-zinc-500">
                    {label}
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-zinc-100">
                    {value ?? "—"}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </DashboardPanel>

        <DashboardPanel
          title="Recent activity"
          icon={History}
          tone="amber"
          href="/operations/notifications"
        >
          <DashboardRows
            empty={
              activityError || (!locationId && accountReady)
                ? "Warehouse activity is unavailable."
                : activityLoading || !locationId
                  ? "Loading activity…"
                  : "No warehouse notifications yet."
            }
            items={activity.map((entry) => ({
              id: entry.id,
              title: entry.title,
              detail: `${entry.message} · ${time.format(new Date(entry.createdAt))}`,
            }))}
          />
        </DashboardPanel>
      </section>
    </div>
  );
}
