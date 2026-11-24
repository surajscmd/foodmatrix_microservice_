import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Building2, type LucideIcon } from "lucide-react";
import usePlatformFormatter from "@/hooks/usePlatformFormatter";
import type { Restaurant, Franchise } from "@/utils/types/organization";
import type { DashboardTone } from "@/elements/dashboard/DashboardPanel";

export function RestaurantDetailPanel({
  title,
  icon: Icon,
  tone,
  href,
  action,
  children,
}: {
  title: string;
  icon: LucideIcon;
  tone?: DashboardTone;
  href?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <Icon
            size={16}
            aria-hidden
            className={
              tone === "rose" || tone === "amber"
                ? "text-rose-400"
                : "text-emerald-400"
            }
          />
          {title}
        </h3>
        {(action || href) && (
          <div className="flex flex-wrap items-center gap-2">
            {action}
            {href && (
              <Link
                href={href}
                aria-label={`View ${title}`}
                className="inline-flex items-center gap-1 text-[10px] text-zinc-500 hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-emerald-300"
              >
                View
                <ArrowUpRight size={12} aria-hidden />
              </Link>
            )}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}

export default function RestaurantRecordDetails({
  restaurant,
  franchise,
}: {
  restaurant: Restaurant;
  franchise: Franchise | null;
}) {
  const { formatDateTime } = usePlatformFormatter();
  const linkedFranchise =
    franchise?.id === restaurant.franchiseId ? franchise : null;
  const items = [
    { label: "Node name", value: restaurant.name },
    {
      label: "Node location",
      value: [
        restaurant.address,
        restaurant.city,
        restaurant.state,
        restaurant.country,
      ]
        .filter(Boolean)
        .join(", "),
    },
    { label: "Operating timezone", value: restaurant.timezone },
    {
      label: "Franchise",
      value: linkedFranchise?.name ?? restaurant.franchiseId,
    },
    { label: "Franchise link", value: restaurant.franchiseId },
    {
      label: "Reporting currency",
      value:
        restaurant.defaultCurrency ??
        linkedFranchise?.defaultCurrency ??
        "Not set",
    },
    { label: "Node created", value: formatDateTime(restaurant.createdAt) },
    {
      label: "Last registry update",
      value: formatDateTime(restaurant.updatedAt),
    },
  ];
  return (
    <RestaurantDetailPanel title="Node Connection Metas" icon={Building2}>
      <dl className="grid grid-cols-1 gap-4 border-t border-zinc-800 pt-4 text-xs sm:grid-cols-2">
        {items.map(({ label, value }) => (
          <div key={label} className="min-w-0 space-y-1">
            <dt className="text-zinc-500">{label}</dt>
            <dd className="break-words leading-5 text-zinc-200">
              {value || "Not set"}
            </dd>
          </div>
        ))}
      </dl>
    </RestaurantDetailPanel>
  );
}
