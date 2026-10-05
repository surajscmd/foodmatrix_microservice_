"use client";

import { useState } from "react";

import { Building2, Database, Loader2, X } from "lucide-react";

import type {
  CreateRestaurantData,
  Restaurant,
  UpdateRestaurantData,
} from "@/utils/types/organization";

interface AddRestaurantDrawerProps {
  isOpen: boolean;

  mode: "create" | "edit";

  isSubmitting: boolean;

  franchiseId: string | null;

  initialRestaurant?: Restaurant | null;

  onClose: () => void;

  onCreateRestaurant: (data: CreateRestaurantData) => Promise<void>;

  onUpdateRestaurant: (
    restaurantId: string,
    data: UpdateRestaurantData,
  ) => Promise<void>;
}

const DEFAULT_COUNTRY = "India";
const DEFAULT_TIMEZONE = "Asia/Kolkata";

export default function AddRestaurantDrawer({
  isOpen,
  mode,
  isSubmitting,
  franchiseId,
  initialRestaurant,
  onClose,
  onCreateRestaurant,
  onUpdateRestaurant,
}: AddRestaurantDrawerProps) {
  const [name, setName] = useState(initialRestaurant?.name ?? "");
  const [address, setAddress] = useState(initialRestaurant?.address ?? "");
  const [city, setCity] = useState(initialRestaurant?.city ?? "");
  const [state, setState] = useState(initialRestaurant?.state ?? "");
  const [country, setCountry] = useState(
    initialRestaurant?.country ?? DEFAULT_COUNTRY,
  );
  const [timezone, setTimezone] = useState(
    initialRestaurant?.timezone ?? DEFAULT_TIMEZONE,
  );
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const isEditMode = mode === "edit";

  const resetForm = () => {
    setName(initialRestaurant?.name ?? "");
    setAddress(initialRestaurant?.address ?? "");
    setCity(initialRestaurant?.city ?? "");
    setState(initialRestaurant?.state ?? "");
    setCountry(initialRestaurant?.country ?? DEFAULT_COUNTRY);
    setTimezone(initialRestaurant?.timezone ?? DEFAULT_TIMEZONE);
    setFormError(null);
  };
  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    resetForm();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();

    const trimmedAddress = address.trim();

    const trimmedCity = city.trim();

    const trimmedState = state.trim();

    const trimmedCountry = country.trim();

    const trimmedTimezone = timezone.trim();

    if (!trimmedName) {
      setFormError("Restaurant name is required.");
      return;
    }

    if (!trimmedAddress) {
      setFormError("Street address is required.");
      return;
    }

    if (!trimmedCity) {
      setFormError("City is required.");
      return;
    }

    if (!trimmedCountry) {
      setFormError("Country is required.");
      return;
    }

    if (!trimmedTimezone) {
      setFormError("Timezone is required.");
      return;
    }

    try {
      setFormError(null);

      if (isEditMode) {
        if (!initialRestaurant) {
          setFormError("No restaurant was selected for editing.");
          return;
        }

        const payload: UpdateRestaurantData = {
          name: trimmedName,
          address: trimmedAddress,
          city: trimmedCity,
          state: trimmedState || undefined,
          country: trimmedCountry,
          timezone: trimmedTimezone,
        };

        await onUpdateRestaurant(initialRestaurant.id, payload);
      } else {
        if (!franchiseId) {
          setFormError("No franchise context is available for this account.");
          return;
        }

        const payload: CreateRestaurantData = {
          name: trimmedName,
          address: trimmedAddress,
          city: trimmedCity,
          state: trimmedState || undefined,
          country: trimmedCountry,
          timezone: trimmedTimezone,
          franchiseId,
        };

        await onCreateRestaurant(payload);
      }

      resetForm();
    } catch (error) {
      console.error("Restaurant submission failed:", error);

      setFormError(
        error instanceof Error
          ? error.message
          : isEditMode
            ? "Unable to update restaurant node."
            : "Unable to create restaurant node.",
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm flex justify-end z-[9999]">
      {/* Overlay */}
      <button
        type="button"
        aria-label="Close drawer"
        onClick={handleClose}
        disabled={isSubmitting}
        className="flex-1 cursor-default"
      />

      <div className="w-full max-w-md bg-[#0c0c0e] border-l border-zinc-800 h-full p-6 flex flex-col shadow-2xl overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />

            <div>
              <h3 className="text-sm font-bold text-white">
                {isEditMode ? "Edit Franchise Site" : "Deploy Franchise Site"}
              </h3>

              <p className="text-[10px] text-zinc-400 font-mono">
                {isEditMode
                  ? "NODE REGISTRY UPDATE"
                  : "FRANCHISE REGISTRATION METRIC"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white disabled:opacity-40"
            id="btn-close-franchise-drawer"
            aria-label="Close drawer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Error */}
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 text-xs text-rose-300">
            {formError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 flex-1">
          {/* Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="input-new-store-name"
              className="text-[11px] font-mono uppercase tracking-wider text-zinc-400"
            >
              Franchise Site Name
            </label>

            <input
              id="input-new-store-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. FoodMatrix Bengaluru Central"
              required
              disabled={isSubmitting}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
            />
          </div>

          {/* City + State */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="input-new-store-city"
                className="text-[11px] font-mono uppercase tracking-wider text-zinc-400"
              >
                City
              </label>

              <input
                id="input-new-store-city"
                type="text"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="e.g. Bengaluru"
                required
                disabled={isSubmitting}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="input-new-store-state"
                className="text-[11px] font-mono uppercase tracking-wider text-zinc-400"
              >
                State / Province
              </label>

              <input
                id="input-new-store-state"
                type="text"
                value={state}
                onChange={(event) => setState(event.target.value)}
                placeholder="e.g. Karnataka"
                disabled={isSubmitting}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label
              htmlFor="input-new-store-address"
              className="text-[11px] font-mono uppercase tracking-wider text-zinc-400"
            >
              Street Address
            </label>

            <input
              id="input-new-store-address"
              type="text"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="e.g. 1205 MG Road"
              required
              disabled={isSubmitting}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
            />
          </div>

          {/* Country + Timezone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="input-new-store-country"
                className="text-[11px] font-mono uppercase tracking-wider text-zinc-400"
              >
                Country
              </label>

              <input
                id="input-new-store-country"
                type="text"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                required
                disabled={isSubmitting}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="input-new-store-timezone"
                className="text-[11px] font-mono uppercase tracking-wider text-zinc-400"
              >
                Timezone
              </label>

              <input
                id="input-new-store-timezone"
                type="text"
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                required
                disabled={isSubmitting}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Info */}
          <div className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-xl space-y-2 mt-4 text-[11px] text-zinc-400">
            <div className="flex justify-between text-zinc-500 font-mono text-[9px] uppercase">
              <span>{isEditMode ? "REGISTRY UPDATE" : "REGISTRATION"}</span>

              <span>ORGANIZATION SERVICE</span>
            </div>

            <div className="flex items-center gap-2 text-white font-semibold">
              <Database className="w-3.5 h-3.5 text-emerald-400" />

              <span>
                {isEditMode
                  ? "Updates the restaurant node registry."
                  : "Creates a restaurant node in the franchise registry."}
              </span>
            </div>

            <p>
              Restaurant identity, location and timezone are managed by the
              Organization Service.
            </p>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-zinc-800 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800/80 text-zinc-300 text-xs font-medium rounded-xl border border-zinc-800 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || (!isEditMode && !franchiseId)}
              className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold rounded-xl shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              id="btn-submit-store-drawer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />

                  {isEditMode ? "Saving..." : "Creating..."}
                </>
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Launch Node"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
