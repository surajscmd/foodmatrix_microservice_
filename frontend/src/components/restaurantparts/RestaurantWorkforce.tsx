"use client";

import { useState } from "react";
import { Banknote, CalendarDays, Users } from "lucide-react";
import LeavePanel from "@/elements/restaurantworkforce/LeavePanel";
import PayrollPanel from "@/elements/restaurantworkforce/PayrollPanel";
import StaffDirectory from "@/elements/restaurantworkforce/StaffDirectory";
import { Empty, panel } from "@/elements/restaurantworkforce/shared";
import { restaurantDate } from "@/elements/staffattendance/report-dates";
import { useOrganizationStore } from "@/store/organization-store";

export default function RestaurantWorkforce() {
  const hydrated = useOrganizationStore((state) => state.isHydrated);
  const user = useOrganizationStore((state) => state.currentUser?.systemUser);
  const restaurant = useOrganizationStore((state) => state.selectedRestaurant);
  const error = useOrganizationStore((state) => state.error);
  const [view, setView] = useState<"staff" | "leave" | "payroll">("staff");

  if (!hydrated)
    return (
      <div className={panel}>
        <Empty>Loading workforce…</Empty>
      </div>
    );
  if (error)
    return (
      <div className={panel}>
        <Empty>{error}</Empty>
      </div>
    );
  if (
    !user?.isActive ||
    user.role !== "RESTAURANT_ADMIN" ||
    !restaurant ||
    restaurant.id !== user.managedRestaurantId
  ) {
    return (
      <div className={panel}>
        <Empty>
          Staff and payroll are available to the administrator of this
          restaurant.
        </Empty>
      </div>
    );
  }

  const timeZone = restaurant.timezone || "UTC";
  const today = restaurantDate(new Date(), timeZone);
  const currency = restaurant.defaultCurrency || "INR";

  return (
    <div className="@container mx-auto max-w-[1500px] space-y-5 motion-safe:animate-fade-in">
      <header className="space-y-5">
        <div className="flex items-center gap-3 py-2">
          <span aria-hidden className="h-4 w-1 rounded-full bg-emerald-400" />
          <div className="min-w-0">
            <h1 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
              Staff &amp; Payroll
            </h1>
            <p className="mt-0.5 text-[10px] text-zinc-500">
              Staff profiles, leave requests and payroll management
            </p>
          </div>
        </div>
        <nav
          aria-label="Workforce views"
          className="flex flex-wrap gap-2 rounded-xl border border-zinc-800 bg-zinc-950/80 p-2"
        >
          {(
            [
              { id: "staff", label: "Staff directory", Icon: Users },
              { id: "leave", label: "Leave requests", Icon: CalendarDays },
              { id: "payroll", label: "Payroll runs", Icon: Banknote },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              onClick={() => setView(id)}
              className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-emerald-300 ${view === id ? "border-emerald-400 bg-emerald-400 text-zinc-950" : "border-transparent text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"}`}
            >
              <Icon size={15} aria-hidden />
              {label}
            </button>
          ))}
        </nav>
      </header>

      {view === "staff" ? (
        <StaffDirectory
          key={restaurant.id}
          restaurantId={restaurant.id}
          currency={currency}
          today={today}
          timeZone={timeZone}
        />
      ) : view === "leave" ? (
        <LeavePanel
          key={restaurant.id}
          restaurantId={restaurant.id}
          today={today}
        />
      ) : (
        <PayrollPanel
          key={restaurant.id}
          restaurantId={restaurant.id}
          currency={currency}
          today={today}
        />
      )}
    </div>
  );
}
