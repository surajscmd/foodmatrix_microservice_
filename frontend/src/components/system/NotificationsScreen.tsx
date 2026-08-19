"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Info,
  MailOpen,
  Trash2,
  Check,
  Filter,
  Clock3,
  ShieldAlert,
  Activity,
  Circle,
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "alert" | "warning" | "success" | "info";
  priority: "Critical" | "High" | "Medium" | "Low";
  read: boolean;
}

interface NotificationsScreenProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
  searchTerm: string;
}

type FilterType = "all" | "unread" | "alert" | "warning" | "success" | "info";

const priorityStyles = {
  Critical: "bg-rose-500/10 border border-rose-500/20 text-rose-400",
  High: "bg-orange-500/10 border border-orange-500/20 text-orange-400",
  Medium: "bg-amber-500/10 border border-amber-500/20 text-amber-400",
  Low: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
};

const typeStyles = {
  alert: "bg-rose-500/10 border border-rose-500/20 text-rose-400",
  warning: "bg-amber-500/10 border border-amber-500/20 text-amber-400",
  success: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
  info: "bg-blue-500/10 border border-blue-500/20 text-blue-400",
};

export default function NotificationsScreen({
  notifications,
  onMarkRead,
  onClearAll,
  searchTerm,
}: NotificationsScreenProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const stats = useMemo(() => {
    return {
      total: notifications.length,
      unread: notifications.filter((n) => !n.read).length,
      critical: notifications.filter((n) => n.priority === "Critical").length,
      alerts: notifications.filter((n) => n.type === "alert").length,
    };
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const matchesSearch =
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      switch (activeFilter) {
        case "unread":
          return !notification.read;

        case "alert":
        case "warning":
        case "success":
        case "info":
          return notification.type === activeFilter;

        default:
          return true;
      }
    });
  }, [notifications, activeFilter, searchTerm]);

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "alert":
        return <AlertOctagon className="w-5 h-5" />;

      case "warning":
        return <AlertTriangle className="w-5 h-5" />;

      case "success":
        return <CheckCircle2 className="w-5 h-5" />;

      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const filters: {
    key: FilterType;
    label: string;
  }[] = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
    { key: "alert", label: "Alerts" },
    { key: "warning", label: "Warnings" },
    { key: "success", label: "Success" },
    { key: "info", label: "Info" },
  ];

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* KPI CARDS */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-zinc-500">
              Total Signals
            </span>

            <Bell className="w-5 h-5 text-emerald-400" />
          </div>

          <h2 className="mt-4 text-3xl font-bold text-white">{stats.total}</h2>

          <p className="mt-1 text-xs text-zinc-500">
            Active operational notifications
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-zinc-500">
              Unread
            </span>

            <MailOpen className="w-5 h-5 text-blue-400" />
          </div>

          <h2 className="mt-4 text-3xl font-bold text-white">{stats.unread}</h2>

          <p className="mt-1 text-xs text-zinc-500">Awaiting acknowledgement</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-zinc-500">
              Critical
            </span>

            <ShieldAlert className="w-5 h-5 text-rose-400" />
          </div>

          <h2 className="mt-4 text-3xl font-bold text-white">
            {stats.critical}
          </h2>

          <p className="mt-1 text-xs text-zinc-500">High priority incidents</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-zinc-500">
              Alert Events
            </span>

            <Activity className="w-5 h-5 text-amber-400" />
          </div>

          <h2 className="mt-4 text-3xl font-bold text-white">{stats.alerts}</h2>

          <p className="mt-1 text-xs text-zinc-500">
            Operational alerts generated
          </p>
        </div>
      </div>

      {/* FILTER BAR */}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                  activeFilter === filter.key
                    ? "bg-emerald-500 text-black"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-500" />

            <span className="text-xs font-mono text-zinc-500">
              {filteredNotifications.length} Results
            </span>

            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="ml-3 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notification List starts below */}
      {/* NOTIFICATION LIST */}

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>

            <h3 className="mt-6 text-xl font-semibold text-white">
              Notification Center Clear
            </h3>

            <p className="mt-2 max-w-md text-center text-sm text-zinc-500">
              No operational alerts match the current search or filter. Your
              restaurant is running without pending notifications.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`relative transition-all duration-200 hover:bg-zinc-900/70 ${
                  notification.read ? "opacity-70" : "bg-zinc-900/20"
                }`}
              >
                {!notification.read && (
                  <div className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-emerald-500" />
                )}

                <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-start lg:justify-between">
                  {/* LEFT */}

                  <div className="flex flex-1 gap-4">
                    <div
                      className={`mt-1 flex h-12 w-12 items-center justify-center rounded-xl ${
                        typeStyles[notification.type]
                      }`}
                    >
                      {getIcon(notification.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-base font-semibold text-white">
                          {notification.title}
                        </h3>

                        {!notification.read && (
                          <div className="relative">
                            <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-emerald-400 opacity-70" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                          </div>
                        )}
                      </div>

                      <p className="mt-2 max-w-4xl text-sm leading-6 text-zinc-400">
                        {notification.message}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                            priorityStyles[notification.priority]
                          }`}
                        >
                          {notification.priority}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold capitalize ${
                            typeStyles[notification.type]
                          }`}
                        >
                          {notification.type}
                        </span>

                        <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-[11px] text-zinc-400">
                          Signal ID • {notification.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT */}

                  <div className="flex min-w-[220px] flex-col items-start gap-4 lg:items-end">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Clock3 className="h-4 w-4" />

                      <span>{notification.time}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
                        <p className="text-zinc-500">Module</p>
                        <p className="mt-1 font-medium text-white">
                          Operations
                        </p>
                      </div>

                      <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
                        <p className="text-zinc-500">Source</p>
                        <p className="mt-1 font-medium text-white">
                          Restaurant
                        </p>
                      </div>
                    </div>

                    {!notification.read ? (
                      <button
                        onClick={() => onMarkRead(notification.id)}
                        className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500 hover:text-black cursor-pointer"
                      >
                        <Check className="h-4 w-4" />
                        Mark as Read
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-500">
                        <Circle className="h-2 w-2 fill-emerald-400 text-emerald-400" />
                        Acknowledged
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
