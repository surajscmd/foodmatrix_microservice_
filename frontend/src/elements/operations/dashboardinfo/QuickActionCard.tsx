"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
      className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 transition-all duration-300 hover:border-emerald-500/30 hover:bg-zinc-900/70"
    >
      <div className="absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-emerald-500/5 blur-2xl transition-all duration-300 group-hover:bg-emerald-500/10" />

      <div className="relative flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
          <Icon className="h-5 w-5" />
        </div>

        <ArrowRight className="h-4 w-4 text-zinc-600 transition-all duration-300 group-hover:translate-x-1 group-hover:text-emerald-400" />
      </div>

      <div className="relative mt-5 space-y-2">
        <h3 className="text-sm font-semibold text-white">
          {title}
        </h3>

        <p className="text-xs leading-6 text-zinc-500">
          {description}
        </p>
      </div>
    </Link>
  );
}