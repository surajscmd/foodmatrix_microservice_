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
      "border-emerald-300/25 bg-[#26372f] text-emerald-50 hover:border-emerald-300/40 hover:bg-[#2d4338]",
    icon: "bg-emerald-300/10 text-emerald-200",
  },
  {
    label: "Waiter",
    href: "/restaurant/waiter",
    Icon: Utensils,
    button:
      "border-sky-300/25 bg-[#263542] text-sky-50 hover:border-sky-300/40 hover:bg-[#304151]",
    icon: "bg-sky-300/10 text-sky-200",
  },
  {
    label: "Kitchen",
    href: "/restaurant/kitchen",
    Icon: ChefHat,
    button:
      "border-amber-200/25 bg-[#363027] text-amber-50 hover:border-amber-200/40 hover:bg-[#43392d]",
    icon: "bg-amber-200/10 text-amber-200",
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
    <header className="@container relative overflow-hidden rounded-2xl border border-zinc-700/80 bg-[#191b20] bg-linear-to-b from-[#222429] to-[#191b20] shadow-[0_8px_24px_#05080e4a] motion-safe:animate-slide-up">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-emerald-300/35 via-white/12 to-transparent"
      />
      <div className="grid @3xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="relative grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3.5 px-4 py-4 sm:gap-4 sm:px-5 @3xl:px-6 @3xl:py-6">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-emerald-300/20 bg-[#23352f] text-emerald-200/85 shadow-[0_2px_8px_#090f0d45,inset_0_1px_0_#d1fae517] @3xl:size-12">
            <Store size={20} aria-hidden />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <h1 className="min-w-0 text-[1.25rem] leading-tight font-semibold tracking-tight text-zinc-100 wrap-anywhere sm:text-[1.5rem]">
                {restaurant.name}
              </h1>
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] leading-4 font-semibold ${active ? "border-emerald-300/20 bg-emerald-300/8 text-emerald-100/90" : "border-zinc-600 bg-zinc-800 text-zinc-200"}`}
              >
                <span
                  aria-hidden
                  className={`size-1.5 rounded-full ${active ? "bg-emerald-300/75" : "bg-zinc-400"}`}
                />
                {active ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs leading-5 text-zinc-300">
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
          className="grid grid-cols-[repeat(auto-fit,minmax(4.75rem,1fr))] items-center gap-2 border-t border-white/9 bg-black/10 px-4 py-3 sm:px-5 @3xl:grid-cols-3 @3xl:border-t-0 @3xl:border-l"
        >
          {stations.map(({ label, href, Icon, button, icon }) => (
            <Link
              key={href}
              href={href}
              className={`group inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border px-2 text-xs font-semibold whitespace-nowrap shadow-[inset_0_1px_0_#ffffff0c] hover:shadow-[0_4px_12px_#09090b55] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 motion-safe:transition-[translate,background-color,border-color,box-shadow] motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 @md:justify-start @md:px-2.5 @3xl:min-h-12 ${button}`}
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
