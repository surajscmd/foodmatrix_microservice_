"use client";

import type { SidebarSection as SidebarSectionType } from "../../utils/types";
import SidebarItem from "./SidebarItem";

interface SidebarSectionProps {
  section: SidebarSectionType;
}

export default function SidebarSection({
  section,
}: SidebarSectionProps) {
  return (
    <section className="space-y-2">
      {/* Section Heading */}
      <h2 className="px-3 text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-zinc-500">
        {section.title}
      </h2>

      {/* Navigation */}
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