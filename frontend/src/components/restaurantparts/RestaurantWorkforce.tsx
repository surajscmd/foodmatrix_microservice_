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
    <div className="@container space-y-4">
      <header className={panel}>
        <div className="flex items-center gap-3 border-b border-emerald-400/20 bg-linear-to-r from-teal-800 via-teal-950 to-slate-800 px-4 py-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-300 text-emerald-950">
            <Users size={19} aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold tracking-tight text-white">
              Staff &amp; Payroll
            </h1>
            <p className="mt-0.5 truncate text-xs text-teal-100">
              {restaurant.name}
            </p>
          </div>
        </div>
        <nav
          aria-label="Workforce views"
          className="flex flex-wrap gap-1 bg-[#18191d] p-2"
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
              className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium focus-visible:outline-2 focus-visible:outline-emerald-300 ${view === id ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-100" : "border-transparent text-zinc-300 hover:bg-white/8"}`}
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
