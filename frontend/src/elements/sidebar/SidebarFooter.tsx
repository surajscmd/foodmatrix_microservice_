"use client";

import { LogOut, ShieldCheck } from "lucide-react";

import type { OrganizationSidebarUser } from "@/utils/types/organization";

interface SidebarFooterProps {
  user: OrganizationSidebarUser;
  onLogout: () => void;
}

export default function SidebarFooter({
  user,
  onLogout,
}: SidebarFooterProps) {
  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="border-t border-zinc-800 bg-[#0c0c0e] p-4">
      {/* User Card */}
      <div className="mb-3 flex items-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-3">
        {/* User Initials */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs font-semibold text-zinc-300">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {user.name}
          </p>

          <div className="mt-1 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />

            <span className="truncate font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              {user.role}
            </span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        type="button"
        onClick={onLogout}
        className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-xs font-medium text-zinc-500 transition-all duration-200 hover:border-red-500/10 hover:bg-red-500/5 hover:text-red-400"
      >
        <LogOut className="h-4 w-4" />

        <span>Exit Safe Terminal</span>
      </button>
    </div>
  );
}
