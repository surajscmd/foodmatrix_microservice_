import { useEffect, useState } from "react";
import type { OrderDashboard } from "@/lib/order-api";
import { getStaff } from "@/lib/hr-api";
import { getNotifications, type NotificationListResponse } from "@/lib/notification-api";
import type { Restaurant } from "@/utils/types/organization";
import { useNotifications } from "@/providers/NotificationProvider";
import { useOrganizationStore } from "@/store/organization-store";

type LocationMetric = { restaurant: Restaurant; dashboard: OrderDashboard | null };

export default function useOperationsMetrics() {
  const user = useOrganizationStore((state) => state.currentUser?.systemUser);
  const restaurants = useOrganizationStore((state) => state.restaurants);
  const hydrated = useOrganizationStore((state) => state.isHydrated);
  const organizationError = useOrganizationStore((state) => state.error);
  const franchise = useOrganizationStore((state) => state.franchise);
  const notifications = useNotifications();
  const accountId = hydrated && user?.isActive ? user.id : undefined;
  const locationId = notifications?.scope === "WAREHOUSE" ? notifications.locationId : "";
  const revision = notifications?.revision;
  const locations = restaurants.filter((item) => !user?.franchiseId || item.franchiseId === user.franchiseId);
  const [orders, setOrders] = useState<{ id: string; metrics: LocationMetric[] | null }>();
  const [staff, setStaff] = useState<{ key: string; count: number | null }>();
  const [alerts, setAlerts] = useState<{ id: string; list: NotificationListResponse | null }>();

  useEffect(() => {
    if (!accountId) return;
    const controller = new AbortController();
    fetch("/api/operations/info", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Order metrics unavailable");
        const { metrics } = await response.json() as { metrics: LocationMetric[] };
        if (!controller.signal.aborted) {
          setOrders({ id: accountId, metrics });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setOrders({ id: accountId, metrics: null });
      });
    return () => controller.abort();
  }, [accountId]);

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;
    getStaff(1, 1)
      .then(({ data }) => {
        if (!cancelled) setStaff({ key: accountId, count: data.pagination.total });
      })
      .catch(() => {
        if (!cancelled) setStaff({ key: accountId, count: null });
      });
    return () => { cancelled = true; };
  }, [accountId]);

  useEffect(() => {
    if (!accountId || !locationId) return;
    const controller = new AbortController();
    getNotifications("WAREHOUSE", locationId, { isRead: false, page: 1, limit: 100 }, { signal: controller.signal })
      .then((list) => {
        if (!controller.signal.aborted) setAlerts({ id: locationId, list });
      })
      .catch(() => {
        if (!controller.signal.aborted) setAlerts({ id: locationId, list: null });
      });
    return () => controller.abort();
  }, [accountId, locationId, revision]);

  return {
    restaurants: hydrated && !organizationError && accountId ? locations : undefined,
    currency: franchise?.defaultCurrency ?? "INR",
    orders: orders?.id === accountId ? orders?.metrics : undefined,
    staff: staff && staff.key === accountId ? staff.count : undefined,
    alerts: alerts && alerts.id === locationId ? alerts.list : undefined,
    activity: notifications?.scope === "WAREHOUSE" ? notifications.preview : [],
    activityError: notifications?.error,
    activityLoading: notifications?.loading,
    locationId,
    accountReady: hydrated,
  };
}
