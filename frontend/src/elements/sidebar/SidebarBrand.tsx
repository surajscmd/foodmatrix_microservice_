"use client";

import { PanelLeftClose } from "lucide-react";
import FoodMatrixMark from "@/elements/branding/FoodMatrixMark";

interface SidebarBrandProps {
  portal?: "edge" | "regional";
  onToggleSidebar: () => void;
}

export default function SidebarBrand({
  portal = "edge",
  onToggleSidebar,
}: SidebarBrandProps) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <FoodMatrixMark size={40} className="rounded-xl" />

        <div>
          <h1 className="text-sm font-semibold tracking-tight text-white">
            FoodMatrix
          </h1>

          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
            {portal === "edge" ? "Store Edge" : "Regional Hub"}
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {/* Live Status */}
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>

        {/* Collapse */}
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-1.5 text-zinc-500 transition-all hover:bg-zinc-800 hover:text-white"
          title="Collapse Sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
