"use client";

import Link from "next/link";
import { BarChart3, Bell, Package, ShoppingBag, Store, Users } from "lucide-react";

import RevenueChart from "@/elements/edgedashboard/RevenueChart";
import CreateSystemUser from "@/elements/operations/CreateSystemUser";
import ManageSystemLogins from "@/elements/operations/ManageSystemLogins";
import FranchiseOverview from "@/elements/operations/FranchiseOverview";
import MetricCard from "@/elements/operations/MetricCard";
import QuickActionCard from "@/elements/operations/QuickActionCard";
import RegionPerformanceCard from "@/elements/operations/RegionPerformanceCard";
import useOperationsMetrics from "@/elements/operations/useOperationsMetrics";

export default function OperationsControlScreen() {
  const { restaurants, orders, staff, currency, alerts, activity, activityError, activityLoading, locationId, accountReady } = useOperationsMetrics();
  const day = new Date().toISOString().slice(0, 10);
  const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: /^[A-Z]{3}$/.test(currency) ? currency : "INR" });
  const time = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const allOrdersLoaded = orders != null && orders.every(({ dashboard }) => dashboard !== null);
  const totals = new Map<string, number>();
  if (allOrdersLoaded) {
    for (const { dashboard } of orders) {
      for (const { day, amount } of dashboard?.revenue ?? []) {
        totals.set(day, (totals.get(day) ?? 0) + amount);
      }
    }
  }
  const revenue = Array.from(totals, ([day, amount]) => ({ day, amount })).sort((a, b) => a.day.localeCompare(b.day));
  const today = allOrdersLoaded ? totals.get(day) ?? 0 : null;
  const openOrders = allOrdersLoaded ? orders.reduce((sum, item) => sum + (item.dashboard?.queueTotal ?? 0), 0) : null;
  const activeRestaurants = restaurants?.filter((restaurant) => restaurant.status === "ACTIVE").length;
  const criticalAlerts = alerts?.data.filter((alert) => alert.priority === "CRITICAL") ?? [];
  const sources = [
    { service: "Restaurant directory", state: restaurants ? "Available" : accountReady ? "Unavailable" : "Loading" },
    { service: "Order Service", state: allOrdersLoaded ? "Available" : orders === undefined ? "Loading" : orders?.some(({ dashboard }) => dashboard) ? "Partial data" : "Unavailable" },
    { service: "HR Service", state: staff == null ? staff === null ? "Unavailable" : "Loading" : "Available" },
    { service: "Warehouse notifications", state: activityError || (!locationId && accountReady) ? "Unavailable" : activityLoading || !locationId ? "Loading" : "Available" },
  ];
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}

      <FranchiseOverview />
      <CreateSystemUser/>
      <ManageSystemLogins />
      {/* KPI */}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Revenue Today" value={today === null ? "—" : money.format(today)} description="Net payments today (UTC)" />
        <MetricCard title="Kitchen Queue" value={openOrders ?? "—"} description="Orders awaiting completion" />
        <MetricCard title="Restaurants" value={activeRestaurants ?? "—"} description="Active locations" />
        <MetricCard title="Employees" value={staff ?? "—"} description="Staff visible to your account" />
      </section>
      {/* Quick Actions */}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Productivity
            </p>

            <h2 className="mt-1 text-2xl font-bold text-white">
              Quick Actions
            </h2>
          </div>
        </div>

        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          <QuickActionCard
            title="Franchise Network"
            description="Manage all restaurant locations across the region."
            href="/operations/restaurants"
            icon={Store}
          />

          <QuickActionCard
            title="Staff Registry"
            description="View employees, roles and workforce allocation."
            href="/operations/staff"
            icon={Users}
          />

          <QuickActionCard
            title="Inventory"
            description="Monitor stock levels and warehouse movement."
            href="/operations/inventory"
            icon={ShoppingBag}
          />

          <QuickActionCard
            title="Stock Audit"
            description="Review stock movements and inventory history."
            href="/operations/stockaudit"
            icon={BarChart3}
          />

          <QuickActionCard
            title="Fulfillment"
            description="Track warehouse shipments and transfers."
            href="/operations/fulfillment"
            icon={Package}
          />

          <QuickActionCard
            title="Alerts Hub"
            description="Review warehouse alerts and stock updates."
            href="/operations/notifications"
            icon={Bell}
          />
        </div>
      </section>

      {/* Analytics & Monitoring */}

      <section className="grid gap-6 xl:grid-cols-3">
        {/* Revenue Analytics */}

        <div className="xl:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                Analytics
              </p>

              <h2 className="mt-1 text-xl font-semibold text-white">
                Revenue Overview
              </h2>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-emerald-400">
                Today
              </p>

              <p className="text-lg font-bold text-white">
                {today === null ? "—" : money.format(today)}
              </p>
            </div>
          </div>

          <div className="mt-8">
            {allOrdersLoaded && revenue.length > 0 ? (
              <RevenueChart revenue={revenue} currency={currency} />
            ) : (
              <p className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-[#070914] px-4 text-center text-sm text-zinc-400">
                {orders === undefined ? "Loading revenue…" : allOrdersLoaded ? "No restaurant payments to display." : "Revenue is unavailable for one or more restaurants."}
              </p>
            )}
          </div>
        </div>
        {/* Data Sources */}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Monitoring
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              Data Sources
            </h2>
          </div>

          <div className="mt-6 space-y-4">
            {sources.map((service) => (
              <div
                key={service.service}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-[#070914] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${service.state === "Available" ? "bg-emerald-500" : service.state === "Loading" ? "bg-zinc-500" : "bg-yellow-500"}`}
                  />

                  <span className="text-sm text-zinc-200">
                    {service.service}
                  </span>
                </div>

                <span className="text-xs text-zinc-500">{service.state}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Critical Alerts */}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Live Events
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              Critical Alerts
            </h2>
          </div>

          <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
            {alerts ? `${criticalAlerts.length} shown` : "—"}
          </span>
        </div>

        <div className="mt-6 divide-y divide-zinc-800">
          {criticalAlerts.length === 0 && (
            <p className="py-4 text-sm text-zinc-400">
              {alerts ? "No critical alerts among recent unread warehouse notifications." : alerts === null || (!locationId && accountReady) ? "Warehouse alerts are unavailable." : "Loading warehouse alerts…"}
            </p>
          )}
          {criticalAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between py-4"
            >
              <div>
                <h4 className="font-medium text-white">{alert.title}</h4>

                <p className="mt-1 text-sm text-zinc-500">{alert.message}</p>
              </div>

              <span className="text-xs text-zinc-600">{time.format(new Date(alert.createdAt))}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Restaurant Performance */}

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Franchise Network
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              Restaurant Performance
            </h2>
          </div>

          <Link href="/operations/restaurants" className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-sm text-zinc-300 transition hover:border-emerald-500/30 hover:text-white">
            View All Restaurants
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {!restaurants?.length && (
            <p className="rounded-xl border border-zinc-800 bg-zinc-950/75 p-4 text-sm text-zinc-400">
              {restaurants ? "No restaurants in this franchise." : accountReady ? "The restaurant directory is unavailable." : "Loading restaurants…"}
            </p>
          )}
          {(restaurants ?? []).map((restaurant) => {
            const dashboard = orders?.find((item) => item.restaurant.id === restaurant.id)?.dashboard;
            const amount = dashboard?.revenue.find((entry) => entry.day === day)?.amount;
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
      </section>

      {/* Bottom Dashboard */}

      <section className="grid gap-6 xl:grid-cols-3">
        {/* Operational Statistics */}

        <div className="xl:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                Operations
              </p>

              <h2 className="mt-1 text-xl font-semibold text-white">
                Live Operational Statistics
              </h2>
            </div>

            <BarChart3 className="h-6 w-6 text-emerald-400" />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-4">
            {[
              { label: "Restaurants", value: restaurants?.length },
              { label: "Active locations", value: activeRestaurants },
              { label: "Unread warehouse alerts", value: alerts?.pagination.total },
              { label: "Locations reporting orders", value: orders?.filter(({ dashboard }) => dashboard !== null).length },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-zinc-800 bg-[#070914] p-5">
                <p className="text-xs text-zinc-500">{label}</p>
                <h3 className="mt-2 text-3xl font-bold text-white">{value ?? "—"}</h3>
              </div>
            ))}
          </div>
        </div>
        {/* Recent Activity */}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Timeline
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              Recent Activity
            </h2>
          </div>

          <div className="mt-6 space-y-5">
            {activity.length === 0 && (
              <p className="text-sm text-zinc-400">
                {activityError || (!locationId && accountReady) ? "Warehouse activity is unavailable." : activityLoading || !locationId ? "Loading activity…" : "No warehouse notifications yet."}
              </p>
            )}
            {activity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />

                <div>
                  <h4 className="text-sm font-medium text-white">
                    {activity.title}
                  </h4>

                  <p className="mt-1 text-xs text-zinc-500">{activity.message} · {time.format(new Date(activity.createdAt))}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
