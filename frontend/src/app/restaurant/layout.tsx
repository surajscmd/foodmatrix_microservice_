"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import NotificationProvider from "@/providers/NotificationProvider";

import { navigation } from "@/utils/navigation";
import { useOrganizationStore } from "@/store/organization-store";
import OrganizationBootstrap from "@/utils/OrganizationBootstrap";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const pathname = usePathname();
  const role = useOrganizationStore((state) => state.currentUser?.systemUser.role);
  const restaurantNavigation = navigation.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.href !== "/restaurant/staff" || role === "RESTAURANT_ADMIN"),
  }));

  const currentPage = navigation
    .flatMap((section) => section.items)
    .find((item) => item.href === pathname);

  return (
    <NotificationProvider scope="RESTAURANT">
      <div className="flex min-h-screen bg-[#070914] text-slate-100">
        <Sidebar
          navigation={restaurantNavigation}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          portal="edge"
        />

        <div
          className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${
            sidebarOpen ? "ml-64" : "ml-0"
          }`}
        >
          <Header
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen((v) => !v)}
            portal="edge"
            title={currentPage?.header.title ?? "FoodMatrix"}
            subtitle={
              currentPage?.header.subtitle ?? "Restaurant Dashboard"
            }
          />

          <main className="flex-1 overflow-y-auto bg-[#070914] p-6">
            <OrganizationBootstrap>{children}</OrganizationBootstrap>
          </main>

          <footer className="border-t border-zinc-800 bg-[#070914] px-6 py-4 text-[10px] font-mono text-zinc-600 flex justify-between">
            <span>FOODMATRIX OPERATIONS SYSTEM</span>
            <span>STATE NODE REPLICATED • SSL SECURE</span>
          </footer>
        </div>
      </div>
    </NotificationProvider>
  );
}
