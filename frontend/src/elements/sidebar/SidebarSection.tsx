"use client";

import type { SidebarNavSection } from "@/utils/types/platform-settings";
import SidebarItem from "./SidebarItem";
interface SidebarSectionProps {
  section: SidebarNavSection;
}

export default function SidebarSection({
  section,
}: SidebarSectionProps) {
  return (
    <section className="space-y-2">
      <h2 className="px-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
        {section.title}
      </h2>

      <nav className="space-y-1">
        {section.items.map((item) => (
          <SidebarItem
            key={item.href}
            item={item}
          />
        ))}
      </nav>
    </section>
  );
}
