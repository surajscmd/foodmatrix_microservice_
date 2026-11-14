"use client";

import { useEffect, useState } from "react";

import {
  Calendar,
  PanelLeftOpen,
  RefreshCw,
} from "lucide-react";

import NotificationBell from "@/elements/notifications/NotificationBell";
import usePlatformFormatter from "@/hooks/usePlatformFormatter";

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  alertsCount?: number;
  onOpenAlerts?: () => void;

  title: string;
  subtitle: string;

  portal?: "regional" | "edge";
}

export default function Header({
  sidebarOpen,
  onToggleSidebar,
  alertsCount = 0,
  onOpenAlerts,
  title,
  subtitle,
  portal = "edge",
}: HeaderProps) {
  const [now, setNow] = useState<Date | null>(null);

  const { formatDateTime } = usePlatformFormatter();

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-800 bg-[#09090b]/80 px-6 backdrop-blur-md">
      {/* Left */}

      <div className="flex items-center gap-3">
        {!sidebarOpen && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Open sidebar"
            className="mr-1 flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-400 transition-all hover:text-white"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}

        <div>
          <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider">
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
        <div className="hidden items-center gap-2 rounded-xl border border-white/5 bg-zinc-900/30 px-3 py-1 font-mono text-[10px] text-zinc-400 lg:flex">
          <RefreshCw
            className="h-3 w-3 animate-spin text-emerald-500"
            style={{ animationDuration: "4s" }}
          />

          <span>42ms</span>
        </div>

        <div className="hidden items-center gap-2 rounded-xl border border-white/5 bg-zinc-900/30 px-3 py-1 font-mono text-[10px] text-zinc-400 md:flex">
          <Calendar className="h-3 w-3 text-zinc-500" />

          <span>{now ? formatDateTime(now) : "—"}</span>
        </div>

        <NotificationBell
          fallbackCount={alertsCount}
          onOpenFallback={onOpenAlerts}
        />
      </div>
    </header>
  );
}