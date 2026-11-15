import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { attendanceError } from "@/lib/hr-api";

export const panel =
  "min-w-0 overflow-hidden rounded-2xl border border-zinc-700/70 bg-[#111217] shadow-lg shadow-black/15";
export const input =
  "min-h-9 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-100 scheme-dark outline-none placeholder:text-zinc-500 focus:border-emerald-400";
export const secondary =
  "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-xs font-medium text-zinc-100 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-50";
export const primary =
  "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-300 px-3 text-xs font-semibold text-emerald-950 hover:bg-emerald-200 focus-visible:outline-2 focus-visible:outline-emerald-200 disabled:opacity-50";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-xs font-medium text-zinc-300">
      {label}
      {children}
    </label>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="px-4 py-8 text-center text-xs text-zinc-400">
      {children}
    </p>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-lg border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-xs text-rose-200"
    >
      {children}
    </p>
  );
}

export function Status({ value }: { value: string }) {
  const color = ["ACTIVE", "APPROVED", "CURRENT"].includes(value)
    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
    : value === "REVOKED"
      ? "border-zinc-500/35 bg-zinc-500/10 text-zinc-200"
      : value === "TERMINATED" || value === "SUSPENDED"
        ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
        : ["PAID", "UPCOMING", "READY FOR REVIEW"].includes(value)
          ? "border-sky-400/20 bg-sky-400/10 text-sky-200"
          : "border-amber-400/20 bg-amber-400/10 text-amber-200";
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${color}`}
    >
      {value.toLowerCase().replaceAll("_", " ")}
    </span>
  );
}

export function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (value: number) => void;
}) {
  if (pages <= 1 && page === 1) return null;
  return (
    <div className="flex items-center justify-between gap-2 border-t border-white/8 px-4 py-2 text-xs text-zinc-400">
      <span>
        Page {page} of {Math.max(1, pages)}
      </span>
      <div className="flex gap-1.5">
        <button
          className={secondary}
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={14} />
        </button>
        <button
          className={secondary}
          aria-label="Next page"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export function money(
  value: string | number | null | undefined,
  currency: string,
) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: /^[A-Z]{3}$/.test(currency) ? currency : "INR",
  }).format(Number(value));
}

export function dayLabel(day: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(day));
}

export function dayOffset(day: string, offset: number) {
  const value = new Date(day + "T00:00:00Z");
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

export function useWorkforceQuery<T>(
  key: string,
  load: () => Promise<T>,
  failure: string,
) {
  const [result, setResult] = useState<{
    key: string;
    data?: T;
    error?: string;
  }>();
  useEffect(() => {
    let active = true;
    load()
      .then((data) => {
        if (active) setResult({ key, data });
      })
      .catch((error: unknown) => {
        if (active) setResult({ key, error: attendanceError(error, failure) });
      });
    return () => {
      active = false;
    };
  }, [failure, key, load]);

  return {
    data: result?.key === key ? result.data : undefined,
    error: result?.key === key ? result.error : undefined,
    loading: result?.key !== key,
  };
}
