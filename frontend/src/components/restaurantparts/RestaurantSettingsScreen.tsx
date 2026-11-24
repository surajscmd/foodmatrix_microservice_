"use client";

import { useState } from "react";
import { Building2, KeyRound, SlidersHorizontal } from "lucide-react";

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
  const [panel, setPanel] = useState<(typeof panels)[number]["id"]>(
    panels[0].id,
  );
  const restaurant = useOrganizationStore((state) => state.selectedRestaurant);
  const user = useOrganizationStore((state) => state.currentUser?.systemUser);
  const hydrated = useOrganizationStore((state) => state.isHydrated);
  const error = useOrganizationStore((state) => state.error);
  const assignedRestaurant =
    user?.isActive && restaurant && restaurant.id === user.managedRestaurantId
      ? restaurant
      : null;

  return (
    <div className="@container mx-auto max-w-[1500px] space-y-5">
      <header className="flex min-w-0 items-center gap-3 py-2">
        <span
          aria-hidden
          className="h-4 w-1 shrink-0 rounded-full bg-emerald-400"
        />
        <div className="min-w-0">
          <h1 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
            Restaurant settings
          </h1>
          <p className="mt-0.5 text-[10px] text-zinc-500">
            Browser preferences, restaurant details and account security
          </p>
        </div>
      </header>
      <nav
        aria-label="Restaurant settings views"
        className="flex flex-wrap gap-2 rounded-xl border border-zinc-800 bg-zinc-950/80 p-2"
      >
        {panels.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={panel === id}
            onClick={() => setPanel(id)}
            className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 ${panel === id ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-transparent text-zinc-500 hover:border-zinc-800 hover:bg-zinc-900 hover:text-zinc-200"}`}
          >
            <Icon size={15} aria-hidden />
            {label}
          </button>
        ))}
      </nav>

      <div hidden={panel !== "restaurant"}>
        {hydrated && assignedRestaurant ? (
          <RestaurantProfileForm
            key={`${user?.id}:${assignedRestaurant.id}`}
            restaurant={assignedRestaurant}
            canEdit={user?.role === "RESTAURANT_ADMIN"}
          />
        ) : (
          <p
            role={error ? "alert" : "status"}
            className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 text-xs text-zinc-500"
          >
            {hydrated
              ? error || "No restaurant is assigned to this account."
              : "Loading restaurant settings…"}
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
