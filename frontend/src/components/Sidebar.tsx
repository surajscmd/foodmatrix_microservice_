"use client";

import SidebarBrand from "@/elements/sidebar/SidebarBrand";
import SidebarFooter from "@/elements/sidebar/SidebarFooter";
import SidebarSection from "@/elements/sidebar/SidebarSection";
import OrganizationBootstrap from "@/utils/OrganizationBootstrap";

import { useOrganizationStore } from "@/store/organization-store";
import type { SidebarNavSection } from "@/utils/types";
import type { OrganizationSidebarUser } from "@/utils/types/organization";

import axios from "axios";
import { useRouter } from "next/navigation";

interface SidebarProps {
  navigation: SidebarNavSection[];
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  portal?: "edge" | "regional";
}

export default function Sidebar({
  navigation,
  sidebarOpen,
  onToggleSidebar,
  portal = "edge",
}: SidebarProps) {
  const router = useRouter();

  const currentUser = useOrganizationStore((state) => state.currentUser);

  const handleLogout = async () => {
    try {
      const response = await axios.post(
        "/api/sign-out",
        {},
        {
          withCredentials: true,
        },
      );

      console.log("Logout successful:", response.status);

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);

      if (axios.isAxiosError(error)) {
        console.error("Status:", error.response?.status);
        console.error("Response:", error.response?.data);
      }
    }
  };

  const sidebarUser: OrganizationSidebarUser | null = currentUser
    ? {
        id: currentUser.systemUser.id,
        name: `${currentUser.systemUser.firstName} ${currentUser.systemUser.lastName}`,
        email: currentUser.systemUser.email,
        role: currentUser.systemUser.role,
      }
    : null;

  return (
    <>
      <OrganizationBootstrap />

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-zinc-800 bg-[#0c0c0e] transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <SidebarBrand portal={portal} onToggleSidebar={onToggleSidebar} />

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-6">
            {navigation.map((section) => (
              <SidebarSection key={section.title} section={section} />
            ))}
          </div>
        </div>

        {/* Footer */}
        {sidebarUser && (
          <SidebarFooter user={sidebarUser} onLogout={handleLogout} />
        )}
      </aside>
    </>
  );
}
