
"use client";
import CashierPOS from "@/components/restaurantparts/CashierPOS";
import { initialMenuItems, initialOrders } from "@/utils/mockData";
export default function POSPage() {
  return (
    <CashierPOS
      menuItems={initialMenuItems}
      orders={initialOrders}
      searchTerm=""

      onAddOrder={(order)=>{

        console.log("New Order", order);

      }}

      onProgressOrder={(id,status)=>{

        console.log(
          "Update Order",
          id,
          status
        );

      }}

      onUpdateOrderDetails={(id,updates)=>{

        console.log(
          "Update details",
          id,
          updates
        );

      }}

    />
  );
}