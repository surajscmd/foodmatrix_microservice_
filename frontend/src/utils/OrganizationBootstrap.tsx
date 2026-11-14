"use client";

import { useEffect } from "react";

import {
  getCurrentUser,
  getFranchise,
  getRestaurant,
  getRestaurants,
} from "@/lib/organization-api";
import { useOrganizationStore } from "@/store/organization-store";

export default function OrganizationBootstrap() {
  const isHydrated = useOrganizationStore((state) => state.isHydrated);

  useEffect(() => {
    if (isHydrated) return;

    let cancelled = false;
    const store = useOrganizationStore.getState();

    async function restoreOrganization() {
      store.setLoading(true);
      store.setError(null);

      try {
        const currentUser = await getCurrentUser();
        if (cancelled) return;

        store.setCurrentUser(currentUser);

        const { role, managedRestaurantId } = currentUser.systemUser;

        if (role === "RESTAURANT_ADMIN" || role === "STAFF") {
          const restaurant = managedRestaurantId
            ? await getRestaurant(managedRestaurantId)
            : null;

          if (cancelled) return;

          store.setSelectedRestaurant(restaurant);
          store.setRestaurants(restaurant ? [restaurant] : []);
        }

        if (
          role === "SUPER_ADMIN" ||
          role === "FRANCHISE_ADMIN" ||
          role === "OPERATIONS"
        ) {
          const [franchise, restaurants] = await Promise.all([
            getFranchise(),
            getRestaurants(),
          ]);

          if (cancelled) return;

          store.setFranchise(franchise);
          store.setRestaurants(restaurants);
        }
      } catch {
        if (!cancelled) {
          store.setError("Unable to load your account or organization.");
        }
      } finally {
        if (!cancelled) {
          store.setLoading(false);
          store.setHydrated(true);
        }
      }
    }

    void restoreOrganization();

    return () => {
      cancelled = true;
    };
  }, [isHydrated]);

  return null;
}