import type { Order } from "@/lib/order-api";

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  category: { id: string; name: string; sortOrder: number };
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export function canAddToTable(order: Order) {
  return (
    ["PENDING", "CONFIRMED", "PREPARING"].includes(order.status) &&
    !order.payments.some(
      (payment) => payment.status === "COMPLETED" && Number(payment.amount) > 0,
    )
  );
}
