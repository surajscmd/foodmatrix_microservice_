import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export const dashboardPanelClass =
  "min-w-0 overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-950/75 shadow-[0_12px_32px_rgba(0,0,0,0.12)]";

const tones = {
  emerald: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  sky: "border-sky-400/25 bg-sky-400/10 text-sky-300",
  violet: "border-violet-400/25 bg-violet-400/10 text-violet-300",
  amber: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  rose: "border-rose-400/25 bg-rose-400/10 text-rose-300",
  neutral: "border-zinc-700 bg-zinc-800/60 text-zinc-300",
};

export type DashboardTone = keyof typeof tones;

export function DashboardBadge({
  label,
  tone,
}: {
  label: string;
  tone: DashboardTone;
}) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-lg border px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider ${tones[tone]}`}
    >
      {label}
    </span>
  );
}

export function DashboardPanel({
  title,
  icon: Icon,
  tone,
  href,
  action,
  children,
}: {
  title: string;
  icon: LucideIcon;
  tone: DashboardTone;
  href?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={dashboardPanelClass}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 bg-gradient-to-r from-zinc-900/60 to-transparent px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${tones[tone]}`}
          >
            <Icon aria-hidden className="h-4 w-4" />
          </span>
          <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-300">
            {title}
          </h2>
        </div>
        {(action || href) && (
          <div className="flex flex-wrap items-center gap-2">
            {action}
            {href && (
              <Link
                href={href}
                aria-label={`View ${title}`}
                className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-zinc-400 transition-colors hover:border-emerald-400/30 hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-emerald-400"
              >
                View
                <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        )}
      </div>
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </section>
  );
}

interface DashboardRow {
  id: string;
  title: string;
  detail: string;
  badge?: { label: string; tone: DashboardTone };
}

export function DashboardRows({
  items,
  empty,
}: {
  items?: DashboardRow[];
  empty: string;
}) {
  if (!items?.length)
    return (
      <p className="rounded-xl border border-dashed border-zinc-800 bg-[#070914] px-4 py-5 text-xs leading-5 text-zinc-500">
        {items ? empty : "Data unavailable. Try refreshing."}
      </p>
    );

  return (
    <ul className="divide-y divide-zinc-800">
      {items.map(({ id, title, detail, badge }) => (
        <li
          key={id}
          className="flex flex-wrap items-start justify-between gap-3 rounded-lg px-2 py-3.5 transition-colors first:pt-1 last:pb-1 hover:bg-zinc-900/50"
        >
          <div className="min-w-0 flex-1 basis-32">
            <p className="break-words text-xs font-medium text-zinc-200">
              {title}
            </p>
            <p className="mt-1.5 break-words text-[11px] leading-5 text-zinc-500">
              {detail}
            </p>
          </div>
          {badge && <DashboardBadge {...badge} />}
        </li>
      ))}
    </ul>
  );
}
