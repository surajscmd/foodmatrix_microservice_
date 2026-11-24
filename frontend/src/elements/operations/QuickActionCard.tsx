"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const tones = {
  emerald:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-300 group-hover:bg-emerald-500/15",
  sky: "border-sky-500/20 bg-sky-500/10 text-sky-300 group-hover:bg-sky-500/15",
  violet:
    "border-violet-500/20 bg-violet-500/10 text-violet-300 group-hover:bg-violet-500/15",
  amber:
    "border-amber-500/20 bg-amber-500/10 text-amber-300 group-hover:bg-amber-500/15",
  rose: "border-rose-500/20 bg-rose-500/10 text-rose-300 group-hover:bg-rose-500/15",
};

interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tone?: keyof typeof tones;
}

export default function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
  tone = "emerald",
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex min-w-0 items-center gap-3 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/20 p-3.5 transition-[background-color,border-color,transform] duration-200 hover:border-zinc-600 hover:bg-zinc-900/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 motion-safe:hover:-translate-y-0.5"
    >
      <div
        className={`grid size-9 shrink-0 place-items-center rounded-xl border transition-colors ${tones[tone]}`}
      >
        <Icon size={17} strokeWidth={1.7} aria-hidden />
      </div>
      <div className="relative min-w-0 flex-1">
        <h3 className="text-xs font-semibold leading-5 text-zinc-200 transition-colors group-hover:text-white">
          {title}
        </h3>
        <p className="mt-0.5 text-[10px] leading-4 text-zinc-500">
          {description}
        </p>
      </div>
      <span className="grid size-6 shrink-0 place-items-center rounded-md border border-transparent text-zinc-600 transition-colors group-hover:border-zinc-700 group-hover:bg-zinc-800/70 group-hover:text-zinc-200">
        <ArrowUpRight
          size={14}
          className="transition-transform duration-200 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
    </Link>
  );
}
