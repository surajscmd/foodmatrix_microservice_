export default function WorkforceTableStatus({ value }: { value: string }) {
  const tone = ["ACTIVE", "APPROVED", "PAID", "COMPLETED"].includes(value)
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
    : ["PENDING", "DRAFT"].includes(value)
      ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
      : ["REJECTED", "TERMINATED", "MISSED"].includes(value)
        ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
        : ["PROCESSED", "UPCOMING", "READY FOR REVIEW"].includes(value)
          ? "border-sky-500/20 bg-sky-500/10 text-sky-400"
          : "border-zinc-700 bg-zinc-800/50 text-zinc-400";

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider ${tone}`}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {value.replaceAll("_", " ")}
    </span>
  );
}
