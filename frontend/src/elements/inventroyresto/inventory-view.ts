import type { PaginatedResult } from "@/lib/inventory-api";

export const panel =
  "overflow-hidden rounded-2xl border border-zinc-700/80 bg-[#18191d]";
export const field =
  "min-h-10 w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-300";
export const button =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-zinc-600 px-3 text-sm font-medium text-zinc-100 enabled:hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-50";
export const primary =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-300 px-3 text-sm font-semibold text-emerald-950 enabled:hover:bg-emerald-200 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-50";

const numbers = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 4 });
export const quantity = (value: string | number) =>
  numbers.format(Number(value));
export const statusLabel = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());

export function formatDate(value: string, timezone: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  };
  try {
    return new Intl.DateTimeFormat("en-IN", {
      ...options,
      timeZone: timezone,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-IN", options).format(date);
  }
}

export async function allPages<T extends { id: string }>(
  getPage: (page: number) => Promise<PaginatedResult<T>>,
  signal: AbortSignal,
) {
  const rows = new Map<string, T>();
  for (let page = 1; ; page += 1) {
    signal.throwIfAborted();
    const result = await getPage(page);
    for (const entry of result.data) rows.set(entry.id, entry);
    if (page >= result.pagination.totalPages) return [...rows.values()];
  }
}

export const validQuantity = (value: string) =>
  /^\d+(?:\.\d{1,4})?$/.test(value) &&
  Number(value) > 0 &&
  Number(value) <= 99999999.9999;
