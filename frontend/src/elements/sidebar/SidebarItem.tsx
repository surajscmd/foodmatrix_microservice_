"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SidebarItem as SidebarItemType } from "../../utils/types";

interface SidebarItemProps {
  item: SidebarItemType;
}

export default function SidebarItem({ item }: SidebarItemProps) {
  const pathname = usePathname();

  const Icon = item.icon;

  const isActive =
    pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      className={`group relative flex items-center justify-between rounded-xl border px-3 py-2.5 transition-all duration-200 ${
        isActive
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          : "border-transparent text-zinc-400 hover:border-zinc-800 hover:bg-zinc-800/50 hover:text-white"
      }`}
    >
      {/* Active Indicator */}
      {isActive && (
        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-emerald-500" />
      )}

      <div className="flex items-center gap-3">
        <Icon
          className={`h-4 w-4 transition-colors ${
            isActive
              ? "text-emerald-400"
              : "text-zinc-500 group-hover:text-white"
          }`}
        />

        <span className="text-xs font-medium">{item.title}</span>
      </div>

      {item.badge !== undefined && item.badge > 0 && (
        <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-zinc-950">
          {item.badge}
        </span>
      )}
    </Link>
  );
}