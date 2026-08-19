"use client";

import CartPanel from "@/elements/Cash-pos/CartPanel";
import MenuCatalog from "@/elements/Cash-pos/MenuCatalog";
import SettleDesk from "@/elements/Cash-pos/SettleDesk";
import type { MenuItem, Order } from "@/utils/pos.types";

interface CashierPOSProps {
  menuItems: MenuItem[];

  orders: Order[];

  searchTerm: string;

  onAddOrder: (order: Partial<Order>) => void;

  onProgressOrder: (orderId: string, status: Order["status"]) => void;

  onUpdateOrderDetails?: (orderId: string, updates: Partial<Order>) => void;
}

export default function CashierPOS({
  menuItems,

  orders,

  searchTerm,

  onAddOrder,

  onProgressOrder,

  onUpdateOrderDetails,
}: CashierPOSProps) {
  return (
    <div className="space-y-8 animate-fade-in p-6">
      {/* MAIN POS WORKSPACE */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* MENU */}

        <div className="lg:col-span-8">
          <MenuCatalog menuItems={menuItems} searchTerm={searchTerm} />
        </div>

        {/* CART */}

        <div className="lg:col-span-4">
          <CartPanel onAddOrder={onAddOrder} />
        </div>
      </div>

      {/* DINE IN SETTLEMENT */}

      <SettleDesk
        orders={orders}
        onProgressOrder={onProgressOrder}
        onUpdateOrderDetails={onUpdateOrderDetails}
      />
    </div>
  );
}
