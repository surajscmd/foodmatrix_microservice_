import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
}

export default function SettingsSection({
  title,
  description,
  icon: Icon,
  children,
}: Props) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80">
      <div className="flex items-start gap-3 border-b border-zinc-800 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-500/15 bg-emerald-500/10">
          <Icon className="h-4 w-4 text-emerald-400" />
        </div>

        <div>
          <h2 className="text-xs font-semibold text-zinc-200">
            {title}
          </h2>

          <p className="mt-1 text-[10px] leading-relaxed text-zinc-600">
            {description}
          </p>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {children}
      </div>
    </section>
  );
}