import { ChefHat, Clock3, MapPin, Store, Wallet } from "lucide-react";
import { DashboardBadge } from "@/elements/dashboard/DashboardPanel";

import type { Restaurant } from "@/utils/types/organization";

export default function RegionPerformanceCard({
  restaurant,
  revenue,
  activeOrders,
}: {
  restaurant: Restaurant;
  revenue: string;
  activeOrders?: number;
}) {
  const active = restaurant.status === "ACTIVE";

  return (
    <article className="min-w-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60 transition-colors duration-300 hover:border-zinc-700 hover:bg-zinc-900/50">
      <div className="flex flex-wrap items-start gap-3 border-b border-zinc-800/80 bg-gradient-to-r from-zinc-900/60 to-transparent p-4">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-violet-400/20 bg-violet-400/10 text-violet-300">
          <Store size={15} aria-hidden />
        </span>
        <div className="min-w-0 flex-1 basis-24">
          <h3 className="break-words text-xs font-semibold leading-5 text-zinc-200">
            {restaurant.name}
          </h3>
          <p className="mt-1 flex items-start gap-1 text-[10px] text-zinc-500">
            <MapPin size={12} className="mt-0.5 shrink-0" aria-hidden />
            <span className="break-words">{restaurant.city}</span>
          </p>
        </div>
        <DashboardBadge
          label={active ? "Active" : "Inactive"}
          tone={active ? "emerald" : "neutral"}
        />
      </div>
      <dl className="grid grid-cols-2 divide-x divide-zinc-800/80 p-4">
        <div className="min-w-0 pr-3">
          <dt className="flex items-start gap-1.5 text-[9px] font-mono uppercase leading-4 tracking-wide text-zinc-500">
            <Wallet
              size={13}
              className="mt-0.5 shrink-0 text-emerald-400"
              aria-hidden
            />{" "}
            Net payments today
          </dt>
          <dd className="mt-2 break-words text-2xl font-semibold tracking-tight tabular-nums text-zinc-100">
            {revenue}
          </dd>
        </div>
        <div className="min-w-0 pl-3">
          <dt className="flex items-start gap-1.5 text-[9px] font-mono uppercase leading-4 tracking-wide text-zinc-500">
            <ChefHat
              size={13}
              className="mt-0.5 shrink-0 text-sky-400"
              aria-hidden
            />{" "}
            Kitchen queue
          </dt>
          <dd className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-zinc-100">
            {activeOrders ?? "—"}
          </dd>
        </div>
      </dl>
      <p className="flex items-center gap-1.5 border-t border-zinc-800/80 px-4 py-2.5 text-[9px] font-mono uppercase tracking-wider text-zinc-500">
        <Clock3 size={13} aria-hidden /> Revenue day in UTC
      </p>
    </article>
  );
}
