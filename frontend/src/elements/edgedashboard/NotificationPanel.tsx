import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  priority: string;
}

interface NotificationPanelProps {
  notifications: Notification[];
}

export default function NotificationPanel({
  notifications,
}: NotificationPanelProps) {
  const getConfig = (type: string) => {
    switch (type) {
      case "alert":
        return {
          icon: AlertCircle,
          color: "text-red-400",
          bg: "bg-red-500/10",
          border: "border-red-500/20",
        };

      case "warning":
        return {
          icon: AlertTriangle,
          color: "text-amber-400",
          bg: "bg-amber-500/10",
          border: "border-amber-500/20",
        };

      case "success":
        return {
          icon: CheckCircle2,
          color: "text-emerald-400",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/20",
        };

      default:
        return {
          icon: Info,
          color: "text-cyan-400",
          bg: "bg-cyan-500/10",
          border: "border-cyan-500/20",
        };
    }
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
      {/* Header */}

      <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
            <Bell size={18} />
          </div>

          <div>
            <h2 className="font-semibold text-white">
              Operations Feed
            </h2>

            <p className="text-xs text-zinc-500">
              Live restaurant activity
            </p>
          </div>
        </div>

        <button className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:border-emerald-500/30 hover:text-emerald-400">
          View All

          <ArrowRight size={14} />
        </button>
      </div>

      {/* Feed */}

      <div className="space-y-3 p-5">
        {notifications.map((notification) => {
          const config = getConfig(notification.type);
          const Icon = config.icon;

          return (
            <div
              key={notification.id}
              className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 transition-all hover:border-zinc-700"
            >
              <div className="flex gap-4">
                {/* Icon */}

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border ${config.bg} ${config.border}`}
                >
                  <Icon
                    size={18}
                    className={config.color}
                  />
                </div>

                {/* Content */}

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-white">
                        {notification.title}
                      </h3>

                      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                        {notification.message}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-zinc-500">
                        {notification.time}
                      </span>

                      <div
                        className={`mt-2 inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${config.bg} ${config.border} ${config.color}`}
                      >
                        {notification.priority}
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}

                  <div className="mt-4 flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        notification.type === "success"
                          ? "bg-emerald-400"
                          : notification.type === "warning"
                          ? "bg-amber-400"
                          : notification.type === "alert"
                          ? "bg-red-400"
                          : "bg-cyan-400"
                      }`}
                    />

                    <div className="h-px flex-1 bg-zinc-800" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}