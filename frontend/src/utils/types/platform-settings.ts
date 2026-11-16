import type { LucideIcon } from "lucide-react";

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

interface SidebarHeaderConfig {
  title: string;
  subtitle: string;
}

export interface SidebarNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  header: SidebarHeaderConfig;
  badge?: number;
}

export interface SidebarNavSection {
  title: string;
  items: SidebarNavItem[];
}
