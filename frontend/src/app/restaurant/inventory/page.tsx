"use client";

import FranchiseInventoryScreen from "@/components/restaurantparts/FranchiseInventoryScreen";
import {
  initialRestaurants as restaurants,
  initialFranchiseInventory as franchiseInventory,
  initialInventoryRequests as inventoryRequests,
} from "@/utils/mockData";
import { InventoryRequest } from "@/utils/types";


export default function InventoryPage() {
  const handleUpdateFranchiseStock = (
    restaurantId: string,
    itemId: string,
    newQty: number
  ) => {
    console.log("Update Stock", {
      restaurantId,
      itemId,
      newQty,
    });

    // TODO: API Call
  };



const handleAddInventoryRequest = (
  request: Partial<InventoryRequest>
) => {
  console.log(request);
};
  return (
    <FranchiseInventoryScreen
      restaurants={restaurants}
      franchiseInventory={franchiseInventory}
      inventoryRequests={inventoryRequests}
      onUpdateFranchiseStock={handleUpdateFranchiseStock}
      onAddInventoryRequest={handleAddInventoryRequest}
      searchTerm=""
    />
  );
}