import Link from "next/link";
import {
  ArrowUpRight,
  ChefHat,
  CreditCard,
  MapPin,
  Store,
  UserRound,
  Utensils,
} from "lucide-react";
import type { Restaurant } from "@/utils/types/organization";

const stations = [
  {
    label: "POS",
    href: "/restaurant/pos",
    Icon: CreditCard,
    button:
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-300 hover:border-emerald-400/40 hover:bg-emerald-400/15",
    icon: "bg-emerald-300/10 text-emerald-200",
  },
  {
    label: "Waiter",
    href: "/restaurant/waiter",
    Icon: Utensils,
    button:
      "border-zinc-700/80 bg-zinc-900/80 text-zinc-300 hover:border-emerald-400/30 hover:bg-emerald-400/5 hover:text-emerald-300",
    icon: "bg-sky-400/10 text-sky-400",
  },
  {
    label: "Kitchen",
    href: "/restaurant/kitchen",
    Icon: ChefHat,
    button:
      "border-zinc-700/80 bg-zinc-900/80 text-zinc-300 hover:border-emerald-400/30 hover:bg-emerald-400/5 hover:text-emerald-300",
    icon: "bg-amber-400/10 text-amber-400",
  },
];

export default function RestaurantWorkspaceHeader({
  restaurant,
  accountName,
  isManager,
}: {
  restaurant: Pick<
    Restaurant,
    "name" | "city" | "state" | "country" | "status"
  >;
  accountName: string;
  isManager: boolean;
}) {
  const active = restaurant.status === "ACTIVE";
  const location = [restaurant.city, restaurant.state, restaurant.country]
    .filter(Boolean)
    .join(", ");

  return (
    <header className="@container group relative overflow-hidden rounded-3xl border border-zinc-800/90 bg-gradient-to-br from-[#0d1117] via-[#090b0f] to-[#07090c] shadow-[0_20px_55px_rgba(0,0,0,0.18)] motion-safe:animate-slide-up">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:36px_36px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/[0.07] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent"
      />
      <div className="grid @3xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="relative grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3.5 px-5 py-6 sm:gap-4 sm:px-7 @3xl:py-8">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-400/15 via-emerald-500/5 to-cyan-400/10 text-emerald-300 shadow-[0_0_24px_rgba(52,211,153,0.08)]">
            <Store size={20} aria-hidden />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <h1 className="min-w-0 text-xl leading-tight font-semibold tracking-tight text-white wrap-anywhere sm:text-2xl">
                Restaurant workspace
              </h1>
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1 font-mono text-[9px] leading-4 font-semibold uppercase tracking-wider ${active ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-400" : "border-zinc-700 bg-zinc-800 text-zinc-400"}`}
              >
                <span
                  aria-hidden
                  className={`size-1.5 rounded-full ${active ? "bg-emerald-300/75" : "bg-zinc-400"}`}
                />
                {active ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] leading-5 text-zinc-500">
              {location && (
                <p className="flex min-w-0 items-start gap-1.5">
                  <MapPin
                    size={13}
                    className="mt-0.5 shrink-0 text-zinc-400"
                    aria-hidden
                  />
                  <span className="wrap-anywhere">{location}</span>
                </p>
              )}
              <p className="flex min-w-0 items-start gap-1.5">
                <UserRound
                  size={13}
                  className="mt-0.5 shrink-0 text-zinc-400"
                  aria-hidden
                />
                <span className="wrap-anywhere">
                  {accountName}
                  <span className="mx-1.5 text-zinc-500">·</span>
                  {isManager ? "Manager" : "Staff"}
                </span>
              </p>
            </div>
          </div>
        </div>

        <nav
          aria-label="Restaurant stations"
          className="relative grid grid-cols-[repeat(auto-fit,minmax(4.75rem,1fr))] items-center gap-2 border-t border-zinc-800/80 bg-zinc-950/40 px-5 py-4 sm:px-7 @3xl:grid-cols-3 @3xl:border-t-0 @3xl:border-l"
        >
          {stations.map(({ label, href, Icon, button, icon }) => (
            <Link
              key={href}
              href={href}
              className={`group inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-2 font-mono text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 motion-safe:transition-[translate,background-color,border-color,box-shadow] motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 @md:justify-start @md:px-3 ${button}`}
            >
              <span
                className={`grid size-5 shrink-0 place-items-center rounded-md motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-105 @sm:size-6 ${icon}`}
              >
                <Icon size={14} aria-hidden />
              </span>
              {label}
              <ArrowUpRight
                size={12}
                aria-hidden
                className="ml-auto hidden shrink-0 opacity-60 group-hover:opacity-100 motion-safe:transition-[translate,opacity] motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5 @md:block"
              />
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
