export default function TableRepresentation({
  label,
  ready,
  preparing,
}: {
  label: string | null;
  ready: boolean;
  preparing: boolean;
}) {
  const tone = ready
    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300 shadow-[0_0_24px_rgba(52,211,153,0.08)]"
    : preparing
      ? "border-amber-400/35 bg-amber-500/10 text-amber-200"
      : "border-sky-400/35 bg-sky-500/10 text-sky-200";

  return (
    <span className="relative mx-auto my-2 block w-full max-w-40 px-5 py-4">
      <span aria-hidden className="absolute inset-x-10 top-0 h-2.5 rounded-t-lg border border-zinc-700 bg-zinc-800/70" />
      <span aria-hidden className="absolute inset-x-10 bottom-0 h-2.5 rounded-b-lg border border-zinc-700 bg-zinc-800/70" />
      <span aria-hidden className="absolute inset-y-8 left-0 w-3 rounded-l-lg border border-zinc-700 bg-zinc-800/70" />
      <span aria-hidden className="absolute inset-y-8 right-0 w-3 rounded-r-lg border border-zinc-700 bg-zinc-800/70" />
      <span className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border px-3 py-3 transition-colors ${tone}`}>
        <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.2em] opacity-70">Table</span>
        <span className="max-w-full break-words text-center text-xl font-semibold tracking-tight">{label}</span>
      </span>
    </span>
  );
}
