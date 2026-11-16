"use client";

import { useState } from "react";
import { Building2, KeyRound, SlidersHorizontal, Store } from "lucide-react";

import PlatformSettingsScreen from "@/components/PlatformSettingsScreen";
import RestaurantProfileForm from "@/elements/settings/RestaurantProfileForm";
import AccountSecuritySection from "@/elements/settings/AccountSecuritySection";
import { useOrganizationStore } from "@/store/organization-store";

const panels = [
  { id: "preferences", label: "Browser preferences", icon: SlidersHorizontal },
  { id: "restaurant", label: "Restaurant details", icon: Building2 },
  { id: "account", label: "Account security", icon: KeyRound },
] as const;

export default function RestaurantSettingsScreen() {
  const [panel, setPanel] = useState<(typeof panels)[number]["id"]>(panels[0].id);
  const restaurant = useOrganizationStore((state) => state.selectedRestaurant);
  const user = useOrganizationStore((state) => state.currentUser?.systemUser);
  const hydrated = useOrganizationStore((state) => state.isHydrated);
  const error = useOrganizationStore((state) => state.error);
  const assignedRestaurant = user?.isActive && restaurant && restaurant.id === user.managedRestaurantId
    ? restaurant
    : null;

  return (
    <div className="@container space-y-4">
      <header className="overflow-hidden rounded-2xl border border-zinc-700/75 bg-zinc-950 shadow-lg shadow-black/20">
        <div className="flex min-w-0 items-center gap-3 border-b border-emerald-400/20 bg-linear-to-r from-teal-800 to-slate-800 px-4 py-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-300 text-emerald-950">
            <Store size={19} aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold tracking-tight text-white">Restaurant Settings</h1>
            {assignedRestaurant && <p className="mt-0.5 break-words text-xs text-teal-100">{assignedRestaurant.name}</p>}
          </div>
        </div>
        <nav aria-label="Restaurant settings views" className="flex flex-wrap gap-1 bg-[#18191d] p-2">
          {panels.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={panel === id}
              onClick={() => setPanel(id)}
              className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium focus-visible:outline-2 focus-visible:outline-emerald-300 ${panel === id ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-100" : "border-transparent text-zinc-300 hover:bg-white/8"}`}
            >
              <Icon size={15} aria-hidden />
              {label}
            </button>
          ))}
        </nav>
      </header>

      <div hidden={panel !== "restaurant"}>
        {hydrated && assignedRestaurant ? (
          <RestaurantProfileForm
            key={`${user?.id}:${assignedRestaurant.id}`}
            restaurant={assignedRestaurant}
            canEdit={user?.role === "RESTAURANT_ADMIN"}
          />
        ) : (
          <p role={error ? "alert" : "status"} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
            {hydrated ? error || "No restaurant is assigned to this account." : "Loading restaurant settings…"}
          </p>
        )}
      </div>
      <div hidden={panel !== "preferences"}>
        <PlatformSettingsScreen embedded />
      </div>
      {panel === "account" && <AccountSecuritySection />}
    </div>
  );
}
