import { useEffect, useState } from "react";
import { getRestaurantMenuItems } from "@/lib/catalog-api";
import { getAttendance, getStaffByRestaurant } from "@/lib/hr-api";
import {
  getRestaurantLowStock,
  getRestaurantStocks,
} from "@/lib/inventory-api";
import { orderApi } from "@/lib/order-api";

async function loadDetails(restaurantId: string, signal: AbortSignal) {
  const [orders, staff, attendance, stock, lowStock, menu] =
    await Promise.allSettled([
      orderApi.getRestaurantDashboard(restaurantId, signal),
      getStaffByRestaurant(restaurantId, 1, 6, {
        status: "ACTIVE",
        directory: true,
      }),
      getAttendance({ restaurantId }),
      getRestaurantStocks(restaurantId, { page: 1, limit: 1 }, { signal }),
      getRestaurantLowStock(restaurantId, { page: 1, limit: 6 }, { signal }),
      getRestaurantMenuItems(restaurantId, 1, 6, {
        signal,
        includeAvailabilityCounts: true,
      }),
    ]);
  return { orders, staff, attendance, stock, lowStock, menu };
}

export default function useRestaurantDetails(restaurantId: string) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data: Awaited<ReturnType<typeof loadDetails>>;
  }>();
  const key = `${restaurantId}/${revision}`;
  useEffect(() => {
    const controller = new AbortController();
    void loadDetails(restaurantId, controller.signal).then((data) => {
      if (!controller.signal.aborted) setResult({ key, data });
    });
    return () => controller.abort();
  }, [restaurantId, key]);

  return {
    data: result?.key === key ? result.data : undefined,
    loading: result?.key !== key,
    refresh: () => setRevision((value) => value + 1),
  };
}
