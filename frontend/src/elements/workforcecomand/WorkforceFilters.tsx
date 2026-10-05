import type { WorkforceStatus } from "@/components/centraloperations/EmployeeScreen";
import { Building2, Search, SlidersHorizontal } from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
  city?: string;
}

interface WorkforceFiltersProps {
  restaurants: Restaurant[];

  selectedRestaurantId: string;

  onRestaurantChange: (restaurantId: string) => void;

  searchTerm: string;

  onSearchChange: (value: string) => void;

  statusFilter: WorkforceStatus;

  onStatusChange: (status: WorkforceStatus) => void;
}

export default function WorkforceFilters({
  restaurants,
  selectedRestaurantId,
  onRestaurantChange,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
}: WorkforceFiltersProps) {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-3 sm:p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        {/* SEARCH */}

        <div className="relative min-w-0 flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
          />

          <input
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search name, employee code or role..."
            className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950/70 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
          />
        </div>

        {/* RESTAURANT */}

        <div className="relative min-w-0 xl:w-64">
          <Building2
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
          />

          <select
            value={selectedRestaurantId}
            onChange={(event) => onRestaurantChange(event.target.value)}
            className="h-11 w-full appearance-none rounded-xl border border-zinc-800 bg-zinc-950/70 pl-10 pr-9 text-sm text-zinc-200 outline-none transition focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
          >
            <option value="ALL">All Restaurants</option>

            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
        </div>

        {/* STATUS */}

        <div className="relative min-w-0 xl:w-48">
          <SlidersHorizontal
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              onStatusChange(event.target.value as WorkforceStatus)
            }
            className="h-11 w-full appearance-none rounded-xl border border-zinc-800 bg-zinc-950/70 pl-10 pr-9 text-sm text-zinc-200 outline-none transition focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
          >
            <option value="ALL">All Status</option>

            <option value="ACTIVE">Active</option>

            <option value="ON_LEAVE">On Leave</option>

            <option value="SUSPENDED">Suspended</option>

            <option value="TERMINATED">Terminated</option>
          </select>
        </div>
      </div>
    </div>
  );
}
