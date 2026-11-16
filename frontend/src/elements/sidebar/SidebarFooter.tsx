"use client";

import { LogOut } from "lucide-react";

import type { OrganizationSidebarUser } from "@/utils/types/organization";

interface SidebarFooterProps {
  user: OrganizationSidebarUser;
  onLogout: () => void;
}

const roleLabels: Record<OrganizationSidebarUser["role"], string> = {
  SUPER_ADMIN: "Super admin",
  FRANCHISE_ADMIN: "Franchise admin",
  RESTAURANT_ADMIN: "Restaurant admin",
  STAFF: "Staff",
  OPERATIONS: "Operations",
};

export default function SidebarFooter({
  user,
  onLogout,
}: SidebarFooterProps) {
  const name = user.name.trim() || user.email;
  const words = name.split(/\s+/);
  const initials = (
    words.length > 1
      ? words[0].slice(0, 1) + words[words.length - 1].slice(0, 1)
      : name.slice(0, 2)
  ).toUpperCase();

  return (
    <div className="space-y-2.5 border-t border-zinc-800 bg-[#0c0c0e] px-4 py-3">
      <div className="flex items-center gap-2.5">
        <div
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-xs font-semibold text-emerald-200"
        >
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <p
            title={name}
            className="truncate text-[13px] leading-5 font-semibold text-zinc-100"
          >
            {name}
          </p>
          <p className="truncate text-[11px] leading-4 text-zinc-400">
            {roleLabels[user.role]}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="flex min-h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-red-400/10 hover:text-red-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
      >
        <LogOut aria-hidden="true" className="size-4" />
        <span>Sign out</span>
      </button>
    </div>
  );
}
