"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
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
      className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/30 hover:bg-zinc-900/80"
    >
      {/* Decorative grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Ambient glow */}
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-500/5 blur-3xl transition-all duration-500 group-hover:bg-emerald-500/10" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 transition-all duration-300 group-hover:border-emerald-400/30 group-hover:bg-emerald-500/15">
            <Icon className="h-5 w-5" />
          </div>

          <div className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-zinc-700 transition-colors group-hover:text-emerald-400">
            Open
            <ArrowUpRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>

        {/* Content */}
        <div className="mt-7">
          <h3 className="text-sm font-semibold text-white">
            {title}
          </h3>

          <p className="mt-2 max-w-sm text-xs leading-5 text-zinc-500">
            {description}
          </p>
        </div>

        {/* Bottom command indicator */}
        <div className="mt-6 flex items-center justify-between border-t border-zinc-800/80 pt-4">
          <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-zinc-700">
            Command module
          </span>

          <div className="flex items-center gap-1 text-zinc-700 transition-colors group-hover:text-emerald-400">
            <span className="text-[10px] font-mono">
              Launch
            </span>

            <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}