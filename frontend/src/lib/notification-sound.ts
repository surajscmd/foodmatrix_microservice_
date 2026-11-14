"use client";

import {
  getPlatformPreferences,
} from "@/store/platform-preferences";

let context: AudioContext | null = null;
let lastPlayedAt = 0;

export async function unlockNotificationAudio(): Promise<boolean> {
  if (
    typeof window === "undefined" ||
    typeof window.AudioContext === "undefined"
  ) {
    return false;
  }

  if (!context || context.state === "closed") {
    context = new window.AudioContext();
  }

  if (context.state === "suspended") {
    await context.resume();
  }

  return context.state === "running";
}

function playTone(volume: number): boolean {
  if (!context || context.state !== "running") return false;

  const level = Math.min(100, Math.max(0, volume)) / 100;

  if (level === 0) return false;

  const start = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, start);
  oscillator.frequency.setValueAtTime(1174.66, start + 0.1);

  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(level * 0.12, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.onended = () => {
    oscillator.disconnect();
    gain.disconnect();
  };

  oscillator.start(start);
  oscillator.stop(start + 0.3);

  return true;
}

export async function testNotificationSound(
  volume: number,
): Promise<boolean> {
  const available = await unlockNotificationAudio();

  if (!available) return false;

  return playTone(volume);
}

export function playSavedNotificationSound(): void {
  const preferences = getPlatformPreferences();

  if (
    !preferences.notificationSound ||
    preferences.notificationVolume === 0
  ) {
    return;
  }

  const now = Date.now();

  // Avoid overlapping tones during event bursts.
  if (now - lastPlayedAt < 800) return;

  if (playTone(preferences.notificationVolume)) {
    lastPlayedAt = now;
  }
}