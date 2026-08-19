"use client";
import WaiterScreen from "@/components/restaurantparts/WaiterScreen";
import {
  initialMenuItems,
  initialOrders,
  initialRestaurants,
} from "@/utils/mockData";
import { Order } from "@/elements/waiterpad/types";


export default function WaiterPage() {
  const handleAddOrder = (order: Partial<Order>) => {
    // Temporary until backend/API is connected
    // initialOrders.unshift({
    //   id: `ORD-${Date.now()}`,
    //   restaurantId: order.restaurantId!,
    //   restaurantName: order.restaurantName!,
    //   items: order.items ?? [],
    //   total: order.total ?? 0,
    //   status: order.status ?? "Pending",
    //   timestamp: order.timestamp ?? "",
    //   type: order.type ?? "Dine-In",
    //   cashierName: order.cashierName ?? "Waiter Portal",
    //   customerName: order.customerName,
    //   tableNumber: order.tableNumber,
    // });

    console.log("New Waiter Order", order);
  };

  return (
    <main className="h-full w-full">
      <WaiterScreen
        menuItems={initialMenuItems}
        restaurants={initialRestaurants}
        searchTerm=""
        onAddOrder={handleAddOrder}
      />
    </main>
  );
}