"use client";

import {
  Building2,
  Clock3,
  MapPin,
} from "lucide-react";

import type {
  Restaurant,
} from "@/utils/types/organization";

interface RestaurantGridProps {
  restaurants: Restaurant[];
  onSelect: (id: string) => void;
}

function getStatusConfig(
  status: Restaurant["status"],
) {
  if (status === "ACTIVE") {
    return {
      label: "Operational",
      className:
        "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    };
  }

  return {
    label: "Inactive",
    className:
      "bg-zinc-800 text-zinc-400 border border-zinc-700/50",
  };
}

function getLocation(
  restaurant: Restaurant,
) {
  return [
    restaurant.city,
    restaurant.state,
    restaurant.country,
  ]
    .filter(Boolean)
    .join(", ");
}

export default function RestaurantGrid({
  restaurants,
  onSelect,
}: RestaurantGridProps) {
  if (restaurants.length === 0) {
    return (
      <div className="p-12 text-center bg-zinc-900/50 border border-zinc-800 rounded-2xl">
        <Building2 className="w-7 h-7 mx-auto mb-3 text-zinc-700" />

        <span className="text-sm font-semibold text-zinc-400 block mb-1">
          No franchise node records found
        </span>

        <p className="text-xs text-zinc-500">
          Adjust active filters or clear
          search to look for other nodes.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {restaurants.map((restaurant) => {
        const status =
          getStatusConfig(
            restaurant.status,
          );

        return (
          <button
            key={restaurant.id}
            type="button"
            onClick={() =>
              onSelect(restaurant.id)
            }
            className="text-left bg-zinc-900/50 border border-zinc-800 hover:border-emerald-500/40 p-5 rounded-2xl space-y-4 cursor-pointer hover:shadow-xl transition-all relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-emerald-500/2 opacity-0 group-hover:opacity-100 transition-all rounded-2xl pointer-events-none" />

            {/* Header */}
            <div className="relative flex justify-between items-start gap-4">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold block truncate">
                  {restaurant.id}
                </span>

                <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">
                  {restaurant.name}
                </h3>
              </div>

              <span
                className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${status.className}`}
              >
                {status.label}
              </span>
            </div>

            {/* Location */}
            <div className="relative space-y-2 border-y border-zinc-900 py-3 text-xs text-zinc-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-zinc-600 mt-0.5 shrink-0" />

                <div className="min-w-0">
                  <span className="block truncate">
                    {restaurant.address}
                  </span>

                  <span className="block text-[10px] text-zinc-600 mt-0.5">
                    {getLocation(
                      restaurant,
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock3 className="w-3.5 h-3.5 text-zinc-600" />

                <span>
                  Timezone:{" "}
                  <span className="text-zinc-200">
                    {restaurant.timezone}
                  </span>
                </span>
              </div>
            </div>

            {/* Organization data */}
            <div className="relative flex justify-between gap-4 text-xs">
              <div className="min-w-0">
                <span className="text-[9px] text-zinc-500 font-mono uppercase block">
                  Franchise
                </span>

                <span className="block text-zinc-300 font-mono text-[10px] truncate">
                  {restaurant.franchiseId}
                </span>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[9px] text-zinc-500 font-mono uppercase block">
                  Registry
                </span>

                <span className="text-emerald-400 font-mono text-[10px]">
                  Registered
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="relative pt-2 border-t border-zinc-900/60 text-[10px] font-mono text-zinc-600">
              Updated{" "}
              {new Date(
                restaurant.updatedAt,
              ).toLocaleDateString()}
            </div>
          </button>
        );
      })}
    </div>
  );
}