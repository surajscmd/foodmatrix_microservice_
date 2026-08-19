"use client";

import {
  BarChart3,
  Bell,
  Building2,
  DollarSign,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";
import MetricCard from "@/elements/operations/dashboardinfo/MetricCard";
import QuickActionCard from "@/elements/operations/dashboardinfo/QuickActionCard";
import RegionPerformanceCard from "@/elements/operations/dashboardinfo/RegionPerformanceCard"; // Added missing import
import {
  corporateMetrics,
  initialEmployees,
  initialOrders,
  initialRestaurants,
} from "@/utils/mockData";

export default function OperationsControlScreen() {
  const activeRestaurants = initialRestaurants.filter(
    (r) => r.status === "Operational",
  ).length;

  const totalRevenue = initialRestaurants.reduce(
    (sum, restaurant) => sum + restaurant.revenue24h,
    0,
  );

  const totalEmployees = initialEmployees.length;

  const activeOrders = initialOrders.filter(
    (order) => order.status !== "Completed",
  ).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}

      <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-[#0d111c] to-[#081014] p-8">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Regional Operations
            </span>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white">
              Enterprise Operations Control Center
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
              Monitor franchise performance, operational health, workforce,
              inventory, and supply chain from one centralized command center.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Active Restaurants
              </p>

              <h2 className="mt-2 text-4xl font-bold text-white">
                {activeRestaurants}
              </h2>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Employees
              </p>

              <h2 className="mt-2 text-4xl font-bold text-white">
                {totalEmployees}
              </h2>
            </div>
          </div>
        </div>
      </section>

      {/* KPI */}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Revenue Today"
          value={`₹${totalRevenue.toLocaleString("en-IN")}`}
          // Using parseFloat will extract the number even if the string is "+12.5%"
          change={parseFloat(corporateMetrics.totalRevenueMonthly.change) || 0}
          description="vs yesterday"
        />

        <MetricCard
          title="Open Orders"
          value={activeOrders}
          change={12.6}
          description="currently processing"
        />

        <MetricCard
          title="Restaurants"
          value={activeRestaurants}
          change={4.2}
          description="network online"
        />

        <MetricCard
          title="Employees"
          value={totalEmployees}
          change={2.8}
          description="active workforce"
        />
      </section>

      {/* Quick Actions */}

      <section className="space-y-5">
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

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <QuickActionCard
            title="Franchise Network"
            description="Manage all restaurant locations across the region."
            href="/regional/franchises"
            icon={Store}
          />

          <QuickActionCard
            title="Staff Registry"
            description="View employees, roles and workforce allocation."
            href="/regional/staff"
            icon={Users}
          />

          <QuickActionCard
            title="Inventory"
            description="Monitor stock levels and warehouse movement."
            href="/regional/inventory"
            icon={ShoppingBag}
          />

          <QuickActionCard
            title="Analytics"
            description="Business intelligence and performance insights."
            href="/regional/analytics"
            icon={BarChart3}
          />

          <QuickActionCard
            title="Financial Overview"
            description="Revenue, profitability and operational costs."
            href="/regional/finance"
            icon={DollarSign}
          />

          <QuickActionCard
            title="Alerts Hub"
            description="Review operational alerts across all restaurants."
            href="/regional/alerts"
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
                ₹{totalRevenue.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="mt-8 flex h-[340px] items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-[#070914]">
            <div className="text-center">
              <TrendingUp className="mx-auto mb-4 h-10 w-10 text-emerald-400" />

              <h3 className="text-lg font-semibold text-white">
                Revenue Trend
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                Recharts AreaChart will be placed here.
              </p>
            </div>
          </div>
        </div>

        {/* System Health */}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Monitoring
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              System Health
            </h2>
          </div>

          <div className="mt-6 space-y-4">
            {[
              {
                service: "API Gateway",
                status: "Healthy",
                color: "bg-emerald-500",
              },
              {
                service: "Authentication",
                status: "Healthy",
                color: "bg-emerald-500",
              },
              {
                service: "Order Service",
                status: "Healthy",
                color: "bg-emerald-500",
              },
              {
                service: "Inventory Service",
                status: "Warning",
                color: "bg-yellow-500",
              },
              {
                service: "Payment Gateway",
                status: "Healthy",
                color: "bg-emerald-500",
              },
              {
                service: "Notification Queue",
                status: "Healthy",
                color: "bg-emerald-500",
              },
            ].map((service) => (
              <div
                key={service.service}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-[#070914] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${service.color}`}
                  />

                  <span className="text-sm text-zinc-200">
                    {service.service}
                  </span>
                </div>

                <span className="text-xs text-zinc-500">{service.status}</span>
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
            4 Active
          </span>
        </div>

        <div className="mt-6 divide-y divide-zinc-800">
          {[
            {
              title: "Low Inventory",
              location: "Koramangala Outlet",
              time: "5 min ago",
            },
            {
              title: "Kitchen Delay",
              location: "Indiranagar Outlet",
              time: "11 min ago",
            },
            {
              title: "POS Offline",
              location: "Electronic City",
              time: "18 min ago",
            },
            {
              title: "Staff Shortage",
              location: "Whitefield",
              time: "31 min ago",
            },
          ].map((alert) => (
            <div
              key={alert.title}
              className="flex items-center justify-between py-4"
            >
              <div>
                <h4 className="font-medium text-white">{alert.title}</h4>

                <p className="mt-1 text-sm text-zinc-500">{alert.location}</p>
              </div>

              <span className="text-xs text-zinc-600">{alert.time}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Regional Performance */}

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Franchise Network
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              Regional Performance
            </h2>
          </div>

          <button className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-sm text-zinc-300 transition hover:border-emerald-500/30 hover:text-white">
            View All Regions
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          <RegionPerformanceCard
            region="Bengaluru North"
            stores={12}
            revenue={3845000}
            growth={12.4}
            activeOrders={241}
            status="healthy"
          />

          <RegionPerformanceCard
            region="Bengaluru South"
            stores={9}
            revenue={2910000}
            growth={6.2}
            activeOrders={184}
            status="warning"
          />

          <RegionPerformanceCard
            region="Mysuru Region"
            stores={5}
            revenue={1485000}
            growth={-2.3}
            activeOrders={69}
            status="critical"
          />
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
            <div className="rounded-xl border border-zinc-800 bg-[#070914] p-5">
              <p className="text-xs text-zinc-500">Today Orders</p>
              <h3 className="mt-2 text-3xl font-bold text-white">2,481</h3>
              <span className="mt-2 inline-block text-xs text-emerald-400">
                +8.4%
              </span>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-[#070914] p-5">
              <p className="text-xs text-zinc-500">Customers</p>
              <h3 className="mt-2 text-3xl font-bold text-white">1,927</h3>
              <span className="mt-2 inline-block text-xs text-emerald-400">
                +5.8%
              </span>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-[#070914] p-5">
              <p className="text-xs text-zinc-500">Avg Ticket</p>
              <h3 className="mt-2 text-3xl font-bold text-white">₹486</h3>
              <span className="mt-2 inline-block text-xs text-emerald-400">
                +3.1%
              </span>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-[#070914] p-5">
              <p className="text-xs text-zinc-500">Satisfaction</p>
              <h3 className="mt-2 text-3xl font-bold text-white">4.8★</h3>
              <span className="mt-2 inline-block text-xs text-emerald-400">
                +0.2
              </span>
            </div>
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
            {[
              {
                title: "New franchise onboarded",
                desc: "Rajajinagar • 2 min ago",
              },
              {
                title: "Purchase Order Approved",
                desc: "Central Warehouse • 12 min ago",
              },
              {
                title: "Inventory Sync Completed",
                desc: "All Regions • 25 min ago",
              },
              {
                title: "Regional Audit Completed",
                desc: "Bengaluru South • 38 min ago",
              },
              {
                title: "Payroll Generated",
                desc: "Head Office • 1 hour ago",
              },
            ].map((activity) => (
              <div key={activity.title} className="flex items-start gap-4">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />

                <div>
                  <h4 className="text-sm font-medium text-white">
                    {activity.title}
                  </h4>

                  <p className="mt-1 text-xs text-zinc-500">{activity.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
