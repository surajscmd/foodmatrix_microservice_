"use client";

import { useEffect } from "react";

import {
  getCurrentUser,
  getFranchise,
  getRestaurants,
} from "@/lib/organization-api";

import { useOrganizationStore } from "@/store/organization-store";

export default function OrganizationBootstrap() {
  const isHydrated = useOrganizationStore(
    (state) => state.isHydrated,
  );

  const setCurrentUser = useOrganizationStore(
    (state) => state.setCurrentUser,
  );

  const setFranchise = useOrganizationStore(
    (state) => state.setFranchise,
  );

  const setRestaurants = useOrganizationStore(
    (state) => state.setRestaurants,
  );

  const setLoading = useOrganizationStore(
    (state) => state.setLoading,
  );

  const setHydrated = useOrganizationStore(
    (state) => state.setHydrated,
  );

  useEffect(() => {
    if (isHydrated) {
      return;
    }

    let cancelled = false;

    const restoreOrganization = async () => {
      try {
        setLoading(true);

        const currentUserData = await getCurrentUser();

        if (cancelled) return;

        setCurrentUser(currentUserData);

        const role = currentUserData.systemUser.role;

        const isOperationsUser =
          role === "SUPER_ADMIN" ||
          role === "FRANCHISE_ADMIN" ||
          role === "OPERATIONS";

        if (isOperationsUser) {
          const [franchiseData, restaurantsData] =
            await Promise.all([
              getFranchise(),
              getRestaurants(),
            ]);

          if (cancelled) return;

          setFranchise(franchiseData);
          setRestaurants(restaurantsData);
        }

        if (!cancelled) {
          setHydrated(true);
        }
      } catch (error) {
        console.error(
          "Failed to restore organization state:",
          error,
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void restoreOrganization();

    return () => {
      cancelled = true;
    };
  }, [
    isHydrated,
    setCurrentUser,
    setFranchise,
    setRestaurants,
    setLoading,
    setHydrated,
  ]);

  return null;
}