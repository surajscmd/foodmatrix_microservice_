export type PlatformTimeFormat = "12h" | "24h";

export type PlatformDateFormat =
  | "DD/MM/YYYY"
  | "MM/DD/YYYY"
  | "YYYY-MM-DD";

export interface PlatformPreferences {
  notificationSound: boolean;
  notificationVolume: number;
  timeFormat: PlatformTimeFormat;
  dateFormat: PlatformDateFormat;
  timezone: string;
}