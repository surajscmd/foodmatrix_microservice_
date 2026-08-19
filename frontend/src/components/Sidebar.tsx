"use client";

import SidebarBrand from "@/elements/sidebar/SidebarBrand";
import SidebarFooter from "@/elements/sidebar/SidebarFooter";
import SidebarSection from "@/elements/sidebar/SidebarSection";
import type { SidebarNavSection, User } from "@/utils/types";
interface SidebarProps {
  user: User;
  navigation: SidebarNavSection[];
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onLogout: () => void;
  portal?: "edge" | "regional";
}
export default function Sidebar({
  user,
  navigation,
  sidebarOpen,
  onToggleSidebar,
  onLogout,
  portal = "edge",
}: SidebarProps) {
  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-zinc-800 bg-[#0c0c0e] transition-transform duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Brand */}
      <SidebarBrand
        portal={portal}
        onToggleSidebar={onToggleSidebar}
      />

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-6">
          {navigation.map((section) => (
            <SidebarSection
              key={section.title}
              section={section}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <SidebarFooter
        user={user}
        onLogout={onLogout}
      />
    </aside>
  );
}