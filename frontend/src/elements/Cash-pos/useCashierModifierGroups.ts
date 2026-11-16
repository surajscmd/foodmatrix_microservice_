"use client";

import { useCallback, useEffect, useState } from "react";
import { catalogError, getMenuItemModifierGroups } from "@/lib/catalog-api";
import { groupMenuModifiers } from "./cashier-modifiers";

export default function useCashierModifierGroups() {
  const [revision, setRevision] = useState(0);
  const [groups, setGroups] = useState<ReturnType<
    typeof groupMenuModifiers
  > | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    setError("");
    setRevision((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void getMenuItemModifierGroups(undefined, controller.signal)
      .then(({ result }) => {
        if (!controller.signal.aborted) {
          setGroups(groupMenuModifiers(result));
          setError("");
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setError(catalogError(error, "Unable to load menu item options."));
        }
      });
    return () => controller.abort();
  }, [revision]);

  useEffect(() => {
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refresh]);

  return { groups, error, refresh };
}
