"use client";

import { Activity, AlertCircle, Calendar, UserCheck } from "lucide-react";

interface AttendanceOverviewProps {
  stats: {
    activePunches: number;
    totalShifts: number;
    latePunches: number;
    completedPunches: number;
  };

  activeTab: "roster" | "monthly-tracker" | "add-shift";

  setActiveTab: (tab: "roster" | "monthly-tracker" | "add-shift") => void;
}

export default function AttendanceOverview({
  stats,
  activeTab,
  setActiveTab,
}: AttendanceOverviewProps) {
  const fulfillmentRate =
    stats.totalShifts > 0
      ? Math.round((stats.completedPunches / stats.totalShifts) * 100)
      : 0;

  const lateRatio =
    stats.completedPunches + stats.activePunches > 0
      ? Math.round(
          (stats.latePunches / (stats.completedPunches + stats.activePunches)) *
            100,
        )
      : 0;

  return (
    <>
      {/* KPI CARDS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active On-Shift"
          value={`${stats.activePunches} staff`}
          subtitle="Currently punched in"
          icon={<Activity className="w-5 h-5" />}
          color="emerald"
        />

        <MetricCard
          title="Today's Schedule"
          value={`${stats.totalShifts} blocks`}
          subtitle="Total shifts registered"
          icon={<Calendar className="w-5 h-5" />}
          color="zinc"
        />

        <MetricCard
          title="Late Punch Ratio"
          value={`${lateRatio}%`}
          subtitle={`${stats.latePunches} delayed arrivals`}
          icon={<AlertCircle className="w-5 h-5" />}
          color="amber"
        />

        <MetricCard
          title="Fulfillment Rate"
          value={`${fulfillmentRate}%`}
          subtitle="Shift completion"
          icon={<UserCheck className="w-5 h-5" />}
          color="cyan"
        />
      </div>

      {/* TABS */}

      <div className="flex gap-5 border-b border-zinc-800">
        <TabButton
          label="Shift Schedules"
          active={activeTab === "roster"}
          onClick={() => setActiveTab("roster")}
        />

        <TabButton
          label="Monthly Tracker"
          active={activeTab === "monthly-tracker"}
          onClick={() => setActiveTab("monthly-tracker")}
        />

        <TabButton
          label="Plan New Shift"
          active={activeTab === "add-shift"}
          onClick={() => setActiveTab("add-shift")}
        />
      </div>
    </>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: "emerald" | "amber" | "cyan" | "zinc";
}) {
  const colors = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",

    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",

    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",

    zinc: "text-zinc-400 bg-zinc-800/60 border-zinc-700",
  };

  return (
    <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
      <div className="space-y-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
          {title}
        </span>

        <div className="text-xl font-bold font-mono text-white">{value}</div>

        <p className="text-[10px] text-zinc-400">{subtitle}</p>
      </div>

      <div className={`p-3 rounded-xl border ${colors[color]}`}>{icon}</div>
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        pb-3
        text-xs
        font-bold
        uppercase
        font-mono
        tracking-wider
        transition
        relative
        cursor-pointer

        ${
          active
            ? "text-emerald-400 border-b-2 border-emerald-500"
            : "text-zinc-500 hover:text-zinc-300"
        }
      `}
    >
      {label}
    </button>
  );
}
