"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Calendar,
  PanelLeftOpen,
  RefreshCw,
} from "lucide-react";

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  alertsCount: number;
  onOpenAlerts: () => void;

  title: string;
  subtitle: string;

  portal?: "regional" | "edge";
}

export default function Header({
  sidebarOpen,
  onToggleSidebar,
  alertsCount,
  onOpenAlerts,
  title,
  subtitle,
  portal = "edge",
}: HeaderProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      setTime(
        now.toISOString().replace("T", " ").substring(0, 19) + " UTC"
      );
    };

    updateTime();

    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-800 bg-[#09090b]/80 px-6 backdrop-blur-md">

      {/* Left */}

      <div className="flex items-center gap-3">
        {!sidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="mr-1 flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-400 transition-all hover:text-white"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}

        <div>
          <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider">
            <span
              className={
                portal === "edge"
                  ? "font-bold text-emerald-400"
                  : "font-bold text-zinc-500"
              }
            >
              {subtitle}
            </span>
          </div>

          <h2 className="text-sm font-semibold tracking-tight text-white">
            {title}
          </h2>
        </div>
      </div>

      {/* Right */}

      <div className="flex items-center gap-4">

        <div className="hidden lg:flex items-center gap-2 rounded-xl border border-white/5 bg-zinc-900/30 px-3 py-1 font-mono text-[10px] text-zinc-400">
          <RefreshCw
            className="h-3 w-3 animate-spin text-emerald-500"
            style={{ animationDuration: "4s" }}
          />

          <span>42ms</span>
        </div>

        <div className="hidden md:flex items-center gap-2 rounded-xl border border-white/5 bg-zinc-900/30 px-3 py-1 font-mono text-[10px] text-zinc-400">
          <Calendar className="h-3 w-3 text-zinc-500" />

          <span>{time}</span>
        </div>

        <button
          onClick={onOpenAlerts}
          className="relative rounded-xl border border-transparent p-2 text-zinc-400 transition-all hover:border-zinc-800 hover:bg-zinc-900 hover:text-white"
        >
          <Bell className="h-4 w-4" />

          {alertsCount > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          )}
        </button>
      </div>
    </header>
  );
}