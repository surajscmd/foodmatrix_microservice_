"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export default function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex min-w-0 items-center gap-3 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2.5 transition-colors hover:border-emerald-500/30 hover:bg-zinc-900/80 focus-visible:outline-2 focus-visible:outline-emerald-400"
    >
      {/* Decorative grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Ambient glow */}
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-500/5 blur-3xl transition-all duration-500 group-hover:bg-emerald-500/10" />

      <div className="relative grid size-8 shrink-0 place-items-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/15">
        <Icon size={16} aria-hidden />
      </div>
      <div className="relative min-w-0 flex-1">
        <h3 className="text-xs font-semibold text-white">{title}</h3>
        <p className="mt-0.5 text-xs leading-4 text-zinc-400">{description}</p>
      </div>
      <ChevronRight size={15} className="relative shrink-0 text-zinc-500 group-hover:text-emerald-400" aria-hidden />
    </Link>
  );
}
