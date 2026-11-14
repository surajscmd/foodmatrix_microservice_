import type {
  PlatformPreferences,
} from "@/utils/types/platform-settings";

export function resolvePlatformTimezone(
  preferences: PlatformPreferences,
): string {
  if (preferences.timezone !== "browser") {
    return preferences.timezone;
  }

  return (
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "UTC"
  );
}

function parseDate(
  value: string | number | Date | null | undefined,
): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const date =
    value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatPlatformDate(
  value: string | number | Date | null | undefined,
  preferences: PlatformPreferences,
): string {
  const date = parseDate(value);

  if (!date) return "—";

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: resolvePlatformTimezone(preferences),
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(date);

  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const day = getPart("day");
  const month = getPart("month");
  const year = getPart("year");

  switch (preferences.dateFormat) {
    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`;

    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;

    default:
      return `${day}/${month}/${year}`;
  }
}

export function formatPlatformTime(
  value: string | number | Date | null | undefined,
  preferences: PlatformPreferences,
): string {
  const date = parseDate(value);

  if (!date) return "—";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: resolvePlatformTimezone(preferences),
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: preferences.timeFormat === "12h",
    timeZoneName: "short",
  }).format(date);
}

export function formatPlatformDateTime(
  value: string | number | Date | null | undefined,
  preferences: PlatformPreferences,
): string {
  if (!parseDate(value)) return "—";

  return `${formatPlatformDate(
    value,
    preferences,
  )} · ${formatPlatformTime(value, preferences)}`;
}