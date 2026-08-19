export interface RegionalMetric {
  id: string;
  title: string;
  value: string;
  change: number;
  trend: "up" | "down" | "neutral";
  description: string;
}

export interface RegionalStatus {
  id: string;
  title: string;
  status: "healthy" | "warning" | "critical";
  value: string;
  updatedAt: string;
}

export interface RegionPerformance {
  id: string;
  region: string;
  stores: number;
  revenue: number;
  growth: number;
  activeOrders: number;
  status: "healthy" | "warning" | "critical";
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface RegionalAlert {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  time: string;
}

export interface RevenuePoint {
  day: string;
  revenue: number;
}