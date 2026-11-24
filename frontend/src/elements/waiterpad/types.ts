import type { Order } from "@/lib/order-api";
import type { CartModifier } from "@/elements/Cash-pos/cashier-modifiers";

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  category: { id: string; name: string; sortOrder: number };
}

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  modifiers: CartModifier[];
}

export function canAddToTable(order: Order) {
  return (
    ["PENDING", "CONFIRMED", "PREPARING"].includes(order.status) &&
    !order.payments.some(
      (payment) => payment.status === "COMPLETED" && Number(payment.amount) > 0,
    )
  );
}
