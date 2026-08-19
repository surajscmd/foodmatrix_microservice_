"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

import { regionalNavigation } from "@/utils/navigation";
import type { User } from "@/utils/types";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const pathname = usePathname();

  const currentPage = regionalNavigation
    .flatMap((section) => section.items)
    .find((item) => item.href === pathname);

  const user: User = {
    id: "USR-001",
    name: "Suraj S",
    email: "suraj@foodmatrix.com",
    role: "Store Manager",
    avatar: "https://i.pravatar.cc/100",
  };

  return (
    <div className="min-h-screen flex bg-[#070914] text-slate-100">
      <Sidebar
        user={user}
        navigation={regionalNavigation}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onLogout={() => console.log("logout")}
        portal="edge"
      />

      <div
        className={`flex flex-1 flex-col transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        <Header
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          alertsCount={3}
          onOpenAlerts={() => console.log("Open alerts")}
          portal="edge"
          title={currentPage?.header.title ?? "FoodMatrix"}
          subtitle={
            currentPage?.header.subtitle ?? "Restaurant Dashboard"
          }
        />

        <main className="flex-1 overflow-y-auto bg-[#070914] p-6">
          {children}
        </main>

        <footer className="border-t border-zinc-800 bg-[#070914] px-6 py-4 text-[10px] font-mono text-zinc-600 flex justify-between">
          <span>FOODMATRIX OPERATIONS SYSTEM</span>
          <span>STATE NODE REPLICATED • SSL SECURE</span>
        </footer>
      </div>
    </div>
  );
}