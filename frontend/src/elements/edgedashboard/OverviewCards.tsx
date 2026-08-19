import {
  DollarSign,
  ShoppingBag,
  AlertTriangle,
  Users,
  Star,
  TrendingUp,
} from "lucide-react";

interface OverviewCardsProps {
  restaurant: {
    revenue24h: number;
    revenueMonth: number;
    openOrders: number;
    inventoryAlerts: number;
    employeeCount: number;
    rating: number;
  };
}

export default function OverviewCards({
  restaurant,
}: OverviewCardsProps) {
  const cards = [
    {
      title: "Today's Revenue",
      value: `$${restaurant.revenue24h.toLocaleString()}`,
      subtitle: "Sales generated today",
      icon: DollarSign,
      trend: "+12%",
      color: "emerald",
    },
    {
      title: "Monthly Revenue",
      value: `$${restaurant.revenueMonth.toLocaleString()}`,
      subtitle: "Current month",
      icon: TrendingUp,
      trend: "+18%",
      color: "cyan",
    },
    {
      title: "Active Orders",
      value: restaurant.openOrders,
      subtitle: "Orders in kitchen",
      icon: ShoppingBag,
      trend: "LIVE",
      color: "amber",
    },
    {
      title: "Inventory Alerts",
      value: restaurant.inventoryAlerts,
      subtitle: "Need attention",
      icon: AlertTriangle,
      trend:
        restaurant.inventoryAlerts > 0
          ? "ALERT"
          : "GOOD",
      color:
        restaurant.inventoryAlerts > 0
          ? "red"
          : "emerald",
    },
    {
      title: "Employees",
      value: restaurant.employeeCount,
      subtitle: "Working today",
      icon: Users,
      trend: "ACTIVE",
      color: "violet",
    },
    {
      title: "Customer Rating",
      value: restaurant.rating.toFixed(1),
      subtitle: "Google Reviews",
      icon: Star,
      trend: "4.8 ★",
      color: "yellow",
    },
  ];

  const styles = {
    emerald: {
      icon: "text-emerald-400",
      bg: "bg-emerald-500/10",
      badge: "bg-emerald-500/10 text-emerald-400",
      line: "bg-emerald-500",
    },
    cyan: {
      icon: "text-cyan-400",
      bg: "bg-cyan-500/10",
      badge: "bg-cyan-500/10 text-cyan-400",
      line: "bg-cyan-500",
    },
    amber: {
      icon: "text-amber-400",
      bg: "bg-amber-500/10",
      badge: "bg-amber-500/10 text-amber-400",
      line: "bg-amber-500",
    },
    red: {
      icon: "text-red-400",
      bg: "bg-red-500/10",
      badge: "bg-red-500/10 text-red-400",
      line: "bg-red-500",
    },
    violet: {
      icon: "text-violet-400",
      bg: "bg-violet-500/10",
      badge: "bg-violet-500/10 text-violet-400",
      line: "bg-violet-500",
    },
    yellow: {
      icon: "text-yellow-400",
      bg: "bg-yellow-500/10",
      badge: "bg-yellow-500/10 text-yellow-400",
      line: "bg-yellow-500",
    },
  };

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-5">
      {cards.map((card) => {
        const Icon = card.icon;
        const theme =
          styles[card.color as keyof typeof styles];

        return (
          <div
            key={card.title}
            className="
              relative
              overflow-hidden
              rounded-2xl
              border
              border-zinc-800
              bg-zinc-900/50
              backdrop-blur-md
              p-5
              transition-all
              duration-300
              hover:border-emerald-500/40
              hover:-translate-y-1
              hover:shadow-[0_0_25px_rgba(16,185,129,0.08)]
            "
          >
            {/* top accent */}
            <div
              className={`absolute left-0 top-0 h-1 w-full ${theme.line}`}
            />

            <div className="flex items-start justify-between">
              <div
                className={`
                  h-12
                  w-12
                  rounded-xl
                  ${theme.bg}
                  flex
                  items-center
                  justify-center
                `}
              >
                <Icon
                  size={22}
                  className={theme.icon}
                />
              </div>

              <div
                className={`
                  rounded-full
                  px-2.5
                  py-1
                  text-[10px]
                  font-mono
                  font-bold
                  tracking-wider
                  ${theme.badge}
                `}
              >
                {card.trend}
              </div>
            </div>

            <div className="mt-8">
              <p
                className="
                  text-[11px]
                  uppercase
                  tracking-wider
                  font-mono
                  text-zinc-500
                "
              >
                {card.title}
              </p>

              <h2
                className="
                  mt-3
                  text-3xl
                  font-bold
                  text-white
                  tracking-tight
                "
              >
                {card.value}
              </h2>

              <p
                className="
                  mt-2
                  text-xs
                  text-zinc-500
                "
              >
                {card.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}