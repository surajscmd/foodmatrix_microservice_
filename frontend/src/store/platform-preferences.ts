"use client";

import { useSyncExternalStore } from "react";

import type {
  PlatformPreferences,
} from "@/utils/types/platform-settings";

const STORAGE_KEY = "foodmatrix:platform-preferences:v1";

export const DEFAULT_PLATFORM_PREFERENCES:
  Readonly<PlatformPreferences> = Object.freeze({
    notificationSound: false,
    notificationVolume: 50,
    timeFormat: "12h",
    dateFormat: "DD/MM/YYYY",
    timezone: "browser",
  });

let cachedRaw: string | null | undefined;
let snapshot: PlatformPreferences =
  DEFAULT_PLATFORM_PREFERENCES;

const listeners = new Set<() => void>();

function validTimezone(value: string): boolean {
  if (value === "browser") return true;

  try {
    new Intl.DateTimeFormat("en-IN", {
      timeZone: value,
    }).format();

    return true;
  } catch {
    return false;
  }
}

function normalize(value: unknown): PlatformPreferences {
  if (typeof value !== "object" || value === null) {
    return { ...DEFAULT_PLATFORM_PREFERENCES };
  }

  const data = value as Record<string, unknown>;

  const notificationVolume =
    typeof data.notificationVolume === "number" &&
    Number.isFinite(data.notificationVolume)
      ? Math.min(100, Math.max(0, Math.round(data.notificationVolume)))
      : DEFAULT_PLATFORM_PREFERENCES.notificationVolume;

  return {
    notificationSound:
      typeof data.notificationSound === "boolean"
        ? data.notificationSound
        : DEFAULT_PLATFORM_PREFERENCES.notificationSound,

    notificationVolume,

    timeFormat:
      data.timeFormat === "12h" || data.timeFormat === "24h"
        ? data.timeFormat
        : DEFAULT_PLATFORM_PREFERENCES.timeFormat,

    dateFormat:
      data.dateFormat === "DD/MM/YYYY" ||
      data.dateFormat === "MM/DD/YYYY" ||
      data.dateFormat === "YYYY-MM-DD"
        ? data.dateFormat
        : DEFAULT_PLATFORM_PREFERENCES.dateFormat,

    timezone:
      typeof data.timezone === "string" &&
      validTimezone(data.timezone)
        ? data.timezone
        : DEFAULT_PLATFORM_PREFERENCES.timezone,
  };
}

export function getPlatformPreferences(): PlatformPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_PLATFORM_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (raw === cachedRaw) return snapshot;

    cachedRaw = raw;

    if (!raw) {
      snapshot = DEFAULT_PLATFORM_PREFERENCES;
      return snapshot;
    }

    try {
      const stored: unknown = JSON.parse(raw);

      if (
        typeof stored === "object" &&
        stored !== null &&
        "preferences" in stored
      ) {
        snapshot = normalize(stored.preferences);
      } else {
        snapshot = { ...DEFAULT_PLATFORM_PREFERENCES };
      }
    } catch {
      snapshot = { ...DEFAULT_PLATFORM_PREFERENCES };
    }

    return snapshot;
  } catch {
    return snapshot;
  }
}

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function handleStorage(event: StorageEvent) {
  if (event.key === STORAGE_KEY || event.key === null) {
    notifyListeners();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    listeners.delete(listener);

    if (
      listeners.size === 0 &&
      typeof window !== "undefined"
    ) {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function getServerSnapshot(): PlatformPreferences {
  return DEFAULT_PLATFORM_PREFERENCES;
}

export function usePlatformPreferences() {
  return useSyncExternalStore(
    subscribe,
    getPlatformPreferences,
    getServerSnapshot,
  );
}

// Avoid rendering browser-specific preferences during SSR.
function subscribeHydration() {
  return () => {};
}

function getClientReady() {
  return true;
}

function getServerReady() {
  return false;
}

export function usePlatformPreferencesReady() {
  return useSyncExternalStore(
    subscribeHydration,
    getClientReady,
    getServerReady,
  );
}

export function savePlatformPreferences(
  preferences: PlatformPreferences,
): void {
  if (typeof window === "undefined") return;

  if (!validTimezone(preferences.timezone)) {
    throw new Error("Select a valid timezone.");
  }

  const next = normalize(preferences);

  const raw = JSON.stringify({
    version: 1,
    preferences: next,
  });

  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    throw new Error(
      "Unable to save preferences. Browser storage may be disabled or full.",
    );
  }

  cachedRaw = raw;
  snapshot = next;

  notifyListeners();
}