"use client";

import {
  usePlatformPreferences,
  usePlatformPreferencesReady,
} from "@/store/platform-preferences";

import {
  formatPlatformDate,
  formatPlatformDateTime,
  formatPlatformTime,
} from "@/lib/platform-format";

export default function usePlatformFormatter() {
  const preferences = usePlatformPreferences();
  const ready = usePlatformPreferencesReady();

  return {
    preferences,
    ready,

    formatDate: (
      value: string | number | Date | null | undefined,
    ) =>
      ready
        ? formatPlatformDate(value, preferences)
        : "—",

    formatTime: (
      value: string | number | Date | null | undefined,
    ) =>
      ready
        ? formatPlatformTime(value, preferences)
        : "—",

    formatDateTime: (
      value: string | number | Date | null | undefined,
    ) =>
      ready
        ? formatPlatformDateTime(value, preferences)
        : "—",
  };
}