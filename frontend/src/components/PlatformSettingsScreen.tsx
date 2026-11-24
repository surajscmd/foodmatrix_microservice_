"use client";

import { useState } from "react";

import {
  Bell,
  CheckCircle2,
  Clock3,
  Globe2,
  HardDrive,
  Loader2,
  RotateCcw,
  Save,
  Volume2,
  X,
} from "lucide-react";

import SettingsSection from "@/elements/settings/SettingsSection";
import AccountSecuritySection from "@/elements/settings/AccountSecuritySection";

import {
  DEFAULT_PLATFORM_PREFERENCES,
  savePlatformPreferences,
  usePlatformPreferences,
  usePlatformPreferencesReady,
} from "@/store/platform-preferences";

import {
  formatPlatformDate,
  formatPlatformTime,
  resolvePlatformTimezone,
} from "@/lib/platform-format";

import {
  testNotificationSound,
  unlockNotificationAudio,
} from "@/lib/notification-sound";

import type {
  PlatformDateFormat,
  PlatformPreferences,
  PlatformTimeFormat,
} from "@/utils/types/platform-settings";

const inputClass =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-xs text-zinc-200 outline-none transition-colors focus:border-emerald-500/50";

const labelClass =
  "font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-400";

const TIMEZONES = [
  { value: "browser", label: "Browser Default" },
  { value: "Asia/Kolkata", label: "India — Asia/Kolkata" },
  { value: "UTC", label: "UTC" },
  { value: "Asia/Dubai", label: "Dubai — Asia/Dubai" },
  { value: "Asia/Singapore", label: "Singapore — Asia/Singapore" },
  { value: "Europe/London", label: "London — Europe/London" },
  { value: "America/New_York", label: "New York — America/New_York" },
];

const EXAMPLE_TIMESTAMP = "2026-10-26T10:45:00.000Z";

export default function PlatformSettingsScreen({ embedded = false }: { embedded?: boolean }) {
  const saved = usePlatformPreferences();
  const ready = usePlatformPreferencesReady();

  const [message, setMessage] = useState("");

  return (
    <div className="space-y-6">
      {!embedded && <header className="px-6 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-4 w-1 rounded-full bg-emerald-400" />

            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                Platform Settings
              </p>

              <p className="mt-0.5 text-[10px] text-zinc-600">
                Notification sound and display preferences
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 font-mono text-[9px] text-zinc-500">
            <HardDrive className="h-3 w-3" />
            Saved on this browser
          </span>
        </div>
      </header>}

      <div className={embedded ? "space-y-4" : "space-y-5 px-6 pb-6"}>
        {message && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300"
          >
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {message}
            </span>

            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Dismiss message"
              className="rounded p-1 hover:bg-emerald-500/10"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {!ready ? (
          <div className="flex min-h-[260px] items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/80 text-xs text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
            Loading preferences...
          </div>
        ) : (
          <PreferencesForm
            key={JSON.stringify(saved)}
            saved={saved}
            onSaved={setMessage}
          />
        )}
        {!embedded && <AccountSecuritySection />}
      </div>
    </div>
  );
}

function PreferencesForm({
  saved,
  onSaved,
}: {
  saved: PlatformPreferences;
  onSaved: (message: string) => void;
}) {
  const [draft, setDraft] = useState<PlatformPreferences>(
    () => ({ ...saved }),
  );

  const [error, setError] = useState("");
  const [soundMessage, setSoundMessage] = useState("");
  const [testingSound, setTestingSound] = useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const update = <K extends keyof PlatformPreferences>(
    key: K,
    value: PlatformPreferences[K],
  ) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));

    setError("");
    onSaved("");
  };

  const handleTestSound = async () => {
    setSoundMessage("");
    setTestingSound(true);

    try {
      const played = await testNotificationSound(
        draft.notificationVolume,
      );

      setSoundMessage(
        played
          ? "Test sound played."
          : "Sound could not play. Check your browser and device volume.",
      );
    } catch {
      setSoundMessage(
        "Sound could not play. Check your browser and device volume.",
      );
    } finally {
      setTestingSound(false);
    }
  };

  const handleSave = () => {
    setError("");

    try {
      savePlatformPreferences(draft);

      if (draft.notificationSound) {
        void unlockNotificationAudio().catch(() => {});
      }

      onSaved("Preferences saved on this browser.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to save preferences.",
      );
    }
  };

  const handleReset = () => {
    setError("");

    try {
      savePlatformPreferences({
        ...DEFAULT_PLATFORM_PREFERENCES,
      });

      setDraft({ ...DEFAULT_PLATFORM_PREFERENCES });
      setSoundMessage("");
      onSaved("Default preferences restored.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to reset preferences.",
      );
    }
  };

  const selectedTimezoneExists = TIMEZONES.some(
    (item) => item.value === draft.timezone,
  );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleSave();
      }}
      className="space-y-5"
    >
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <SettingsSection
            title="Notification Sound"
            description="Choose whether new live notifications play a sound."
            icon={Bell}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <label
                  htmlFor="notification-sound"
                  className="text-xs font-medium text-zinc-200"
                >
                  Play notification sound
                </label>

                <p className="mt-1 text-[10px] text-zinc-600">
                  Applies to warehouse and restaurant notifications.
                </p>
              </div>

              <button
                id="notification-sound"
                type="button"
                role="switch"
                aria-checked={draft.notificationSound}
                aria-label="Play notification sound"
                onClick={() =>
                  update(
                    "notificationSound",
                    !draft.notificationSound,
                  )
                }
                className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
                  draft.notificationSound
                    ? "border-emerald-500/30 bg-emerald-500"
                    : "border-zinc-700 bg-zinc-800"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full transition-transform ${
                    draft.notificationSound
                      ? "translate-x-0 bg-zinc-950"
                      : "-translate-x-[18px] bg-zinc-400"
                  }`}
                />
              </button>
            </div>

            <div
              className={
                draft.notificationSound ? "" : "opacity-50"
              }
            >
              <div className="mb-3 flex items-center justify-between">
                <label
                  htmlFor="notification-volume"
                  className={labelClass}
                >
                  Volume
                </label>

                <span className="font-mono text-[10px] text-emerald-400">
                  {draft.notificationVolume}%
                </span>
              </div>

              <input
                id="notification-volume"
                type="range"
                min={0}
                max={100}
                step={5}
                value={draft.notificationVolume}
                disabled={!draft.notificationSound}
                onChange={(event) =>
                  update(
                    "notificationVolume",
                    Number(event.target.value),
                  )
                }
                className="h-1.5 w-full cursor-pointer accent-emerald-500 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-zinc-800 pt-4">
              <button
                type="button"
                disabled={
                  !draft.notificationSound ||
                  draft.notificationVolume === 0 ||
                  testingSound
                }
                onClick={() => void handleTestSound()}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {testingSound ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
                Test Sound
              </button>

              {soundMessage && (
                <p role="status" className="text-[10px] text-zinc-500">
                  {soundMessage}
                </p>
              )}
            </div>
          </SettingsSection>

          <SettingsSection
            title="Date & Time"
            description="Choose how timestamps appear in the shared Header and connected screens."
            icon={Clock3}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="platform-time-format"
                  className={labelClass}
                >
                  Time Format
                </label>

                <select
                  id="platform-time-format"
                  value={draft.timeFormat}
                  onChange={(event) =>
                    update(
                      "timeFormat",
                      event.target.value as PlatformTimeFormat,
                    )
                  }
                  className={inputClass}
                >
                  <option value="12h">12-hour · 04:15 PM</option>
                  <option value="24h">24-hour · 16:15</option>
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="platform-date-format"
                  className={labelClass}
                >
                  Date Format
                </label>

                <select
                  id="platform-date-format"
                  value={draft.dateFormat}
                  onChange={(event) =>
                    update(
                      "dateFormat",
                      event.target.value as PlatformDateFormat,
                    )
                  }
                  className={inputClass}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="platform-timezone"
                className={labelClass}
              >
                Timezone
              </label>

              <select
                id="platform-timezone"
                value={draft.timezone}
                onChange={(event) =>
                  update("timezone", event.target.value)
                }
                className={inputClass}
              >
                {TIMEZONES.map((timezone) => (
                  <option
                    key={timezone.value}
                    value={timezone.value}
                  >
                    {timezone.label}
                  </option>
                ))}

                {!selectedTimezoneExists && (
                  <option value={draft.timezone}>
                    {draft.timezone}
                  </option>
                )}
              </select>

              <p className="text-[10px] text-zinc-600">
                Changes display only. Stored timestamps and scheduled
                backend jobs are unaffected.
              </p>
            </div>
          </SettingsSection>
        </div>

        <div className="space-y-5">
          <SettingsSection
            title="Preview"
            description="Example using your current selections."
            icon={Globe2}
          >
            <div className="space-y-4">
              <div>
                <p className={labelClass}>Date</p>
                <p className="mt-2 font-mono text-lg text-zinc-200">
                  {formatPlatformDate(EXAMPLE_TIMESTAMP, draft)}
                </p>
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <p className={labelClass}>Time</p>
                <p className="mt-2 font-mono text-sm text-emerald-400">
                  {formatPlatformTime(EXAMPLE_TIMESTAMP, draft)}
                </p>
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <p className={labelClass}>Timezone</p>
                <p className="mt-2 break-all font-mono text-[11px] text-zinc-400">
                  {resolvePlatformTimezone(draft)}
                </p>
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <p className={labelClass}>Notification Sound</p>
                <p className="mt-2 text-xs text-zinc-400">
                  {draft.notificationSound
                    ? `Enabled · ${draft.notificationVolume}%`
                    : "Disabled"}
                </p>
              </div>
            </div>
          </SettingsSection>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
            <div className="flex items-center gap-2">
              <HardDrive className="h-3.5 w-3.5 text-zinc-500" />
              <p className="text-xs font-medium text-zinc-300">
                Browser Preferences
              </p>
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">
              These preferences are shared by the Operations and
              Restaurant sides on this browser. They do not change
              another device’s settings.
            </p>

            <p className="mt-2 text-[11px] leading-relaxed text-zinc-600">
              Clearing browser storage restores the defaults.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-5 py-4">
        <p className="font-mono text-[10px] text-zinc-500">
          {dirty ? "Unsaved changes" : "Preferences are up to date"}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Defaults
          </button>

          <button
            type="submit"
            disabled={!dirty}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save className="h-3.5 w-3.5" />
            Save Changes
          </button>
        </div>
      </div>
    </form>
  );
}
