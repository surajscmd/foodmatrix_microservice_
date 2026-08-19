import ManagerHeader from "../../elements/edgedashboard/ManagerHeader";
import OverviewCards from "../../elements/edgedashboard/OverviewCards";
import LiveOrders from "../../elements/edgedashboard/LiveOrders";
import InventoryPanel from "../../elements/edgedashboard/InventoryPanel";
import TeamShiftPanel from "../../elements/edgedashboard/TeamShiftPanel";
import AttendancePanel from "../../elements/edgedashboard/AttendancePanel";
import NotificationPanel from "../../elements/edgedashboard/NotificationPanel";
import RevenueChart from "../../elements/edgedashboard/RevenueChart";

import {
  currentUser,
  initialRestaurants,
  initialOrders,
  initialFranchiseInventory,
  initialShifts,
  initialAttendance,
  initialNotifications,
} from "@/utils/mockData";

export default function ManagerDashboard() {
  const restaurant = initialRestaurants.find((item) => item.id === "R-101");

  const orders = initialOrders.filter(
    (order) => order.restaurantId === "R-101",
  );

  const inventory = initialFranchiseInventory.find(
    (item) => item.restaurantId === "R-101",
  );

  const shifts = initialShifts.filter(
    (shift) => shift.restaurantId === "R-101",
  );

  const attendance = initialAttendance.filter(
    (item) => item.restaurantId === "R-101",
  );

  if (!restaurant || !inventory) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">
          Restaurant data not found
        </p>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-background text-foreground p-6 space-y-6"
    >
      <ManagerHeader
        user={currentUser}
        restaurant={restaurant}
      />

      <OverviewCards
        restaurant={restaurant}
      />

      <div
        className="grid grid-cols-1 xl:grid-cols-3 gap-6"
      >
        {/* Left */}
        <div className="xl:col-span-2 space-y-6">
          <RevenueChart />

          <LiveOrders orders={orders} />

          <InventoryPanel inventory={inventory} />
        </div>

        {/* Right */}
        <div className="space-y-6">
          <TeamShiftPanel shifts={shifts} />

          <AttendancePanel attendance={attendance} />

          <NotificationPanel notifications={initialNotifications} />
        </div>
      </div>
    </main>
  );
}