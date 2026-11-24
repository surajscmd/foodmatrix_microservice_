import { RefreshCw } from "lucide-react";

interface Props {
  label: string;
  refreshing: boolean;
  disabled: boolean;
  onClick: () => void;
}

export default function RefreshButton({
  label,
  refreshing,
  disabled,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-busy={refreshing}
      title={label}
      disabled={disabled || refreshing}
      onClick={onClick}
      className="grid size-11 shrink-0 place-items-center rounded-lg border border-zinc-800 bg-zinc-900/70 text-zinc-400 transition-colors enabled:hover:border-emerald-400/30 enabled:hover:text-emerald-400 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-60"
    >
      <RefreshCw
        aria-hidden="true"
        className={`size-4 ${refreshing ? "text-emerald-200 motion-safe:animate-spin" : ""}`}
      />
    </button>
  );
}
