"use client";

import { useState } from "react";
import KitchenScreen from "@/components/restaurantparts/KicthenScreen";
import type { Order } from "@/utils/types";
import { initialOrders } from "@/utils/mockData";

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  function handleProgressOrder(
    id: string,
    nextStatus: Order["status"]
  ) {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id
          ? { ...order, status: nextStatus }
          : order
      )
    );
  }

  return (
    <main className="h-full w-full">
      <KitchenScreen
        orders={orders}
        onProgressOrder={handleProgressOrder}
      />
    </main>
  );
}