import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export default function StaffDetailSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="mb-5 flex items-center gap-2 border-b border-zinc-800 pb-3">
        <Icon size={15} className="shrink-0 text-emerald-400" aria-hidden />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}
