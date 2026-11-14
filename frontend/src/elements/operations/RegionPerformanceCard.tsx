import { Clock3, MapPin, ShoppingBag, Wallet } from "lucide-react";

import type { Restaurant } from "@/utils/types/organization";

export default function RegionPerformanceCard({ restaurant, revenue, activeOrders }: {
  restaurant: Restaurant;
  revenue: string;
  activeOrders?: number;
}) {
  const active = restaurant.status === "ACTIVE";
  const accent = active
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
    : "border-zinc-700 bg-zinc-800 text-zinc-400";

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/75 p-5 transition-all duration-300 hover:bg-zinc-900/80">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-zinc-500">
            <MapPin size={14} aria-hidden /> {restaurant.city}
          </p>
          <h3 className="mt-2 break-words text-lg font-semibold tracking-tight text-white">{restaurant.name}</h3>
        </div>
        <span className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider ${accent}`}>
          {active ? "Active" : "Inactive"}
        </span>
      </div>
      <dl className="mt-7 grid grid-cols-2 divide-x divide-zinc-800 rounded-xl border border-zinc-800 bg-[#070914]">
        <div className="p-3">
          <dt className="flex items-center gap-1.5 text-[9px] font-mono uppercase text-zinc-500"><Wallet size={14} aria-hidden /> Net payments today</dt>
          <dd className="mt-2 break-words text-lg font-semibold text-white">{revenue}</dd>
        </div>
        <div className="p-3">
          <dt className="flex items-center gap-1.5 text-[9px] font-mono uppercase text-zinc-500"><ShoppingBag size={14} aria-hidden /> Kitchen queue</dt>
          <dd className="mt-2 text-lg font-semibold text-white">{activeOrders ?? "—"}</dd>
        </div>
      </dl>
      <p className="mt-4 flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-zinc-500">
        <Clock3 size={13} aria-hidden /> Revenue day in UTC
      </p>
    </article>
  );
}
