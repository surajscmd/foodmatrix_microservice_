import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

const tones = {
  emerald: {
    surface:
      "border-emerald-500/20 from-emerald-500/[0.08] hover:border-emerald-400/40",
    text: "text-emerald-300/80",
    icon: "border-emerald-400/20 from-emerald-400/15 to-emerald-500/[0.04] text-emerald-300",
    glow: "bg-emerald-400/10",
  },
  sky: {
    surface: "border-sky-500/20 from-sky-500/[0.08] hover:border-sky-400/40",
    text: "text-sky-300/80",
    icon: "border-sky-400/20 from-sky-400/15 to-sky-500/[0.04] text-sky-300",
    glow: "bg-sky-400/10",
  },
  amber: {
    surface:
      "border-amber-500/20 from-amber-500/[0.08] hover:border-amber-400/40",
    text: "text-amber-300/80",
    icon: "border-amber-400/20 from-amber-400/15 to-amber-500/[0.04] text-amber-300",
    glow: "bg-amber-400/10",
  },
  violet: {
    surface:
      "border-violet-500/20 from-violet-500/[0.08] hover:border-violet-400/40",
    text: "text-violet-300/80",
    icon: "border-violet-400/20 from-violet-400/15 to-violet-500/[0.04] text-violet-300",
    glow: "bg-violet-400/10",
  },
};

export default function DetailMetricCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "emerald",
  progress,
}: {
  title: string;
  value: ReactNode;
  description: ReactNode;
  icon: LucideIcon;
  tone?: keyof typeof tones;
  progress?: number;
}) {
  const style = tones[tone];
  return (
    <div
      className={`group relative isolate flex h-full min-h-[116px] min-w-0 items-center justify-between gap-3 overflow-hidden rounded-2xl border bg-gradient-to-br via-zinc-950/95 to-zinc-950 p-4 shadow-[0_6px_20px_rgba(0,0,0,0.12)] transition-[border-color,transform] duration-300 motion-safe:hover:-translate-y-0.5 ${style.surface}`}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute -right-8 -top-8 -z-10 size-24 rounded-full blur-3xl ${style.glow}`}
      />
      <div className="min-w-0 flex-1">
        <h3
          className={`font-mono text-[9px] font-semibold uppercase leading-4 tracking-[0.12em] ${style.text}`}
        >
          {title}
        </h3>
        <p className="mt-1 break-words font-mono text-xl font-semibold leading-7 tracking-tight tabular-nums text-white">
          {value}
        </p>
        <p className="mt-1 text-[10px] leading-4 text-zinc-500">
          {description}
        </p>
      </div>
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-xl border bg-gradient-to-br shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${style.icon}`}
      >
        <Icon size={17} aria-hidden />
      </span>
      {progress !== undefined && Number.isFinite(progress) && (
        <span
          aria-hidden
          className="absolute inset-x-4 bottom-1.5 h-0.5 overflow-hidden rounded-full bg-zinc-800/70"
        >
          <span
            className="block h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-300 transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </span>
      )}
    </div>
  );
}
