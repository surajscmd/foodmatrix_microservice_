"use client";

import { Eye, Loader2, UsersRound } from "lucide-react";

import type { WorkforceStaff } from "@/components/centraloperations/EmployeeScreen";

interface StaffDirectoryProps {
  staff: WorkforceStaff[];
  restaurantMap: Map<
    string,
    {
      id: string;
      name: string;
      city?: string | null;
    }
  >;
  isLoading: boolean;
  selectedRestaurantId: string;
  onViewStaff: (staff: WorkforceStaff) => void;
}

export default function StaffDirectory({
  staff,
  restaurantMap,
  isLoading,
  selectedRestaurantId,
  onViewStaff,
}: StaffDirectoryProps) {
  if (isLoading) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70">
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <Loader2
              size={18}
              className="animate-spin text-emerald-400"
            />
            Loading workforce...
          </div>
        </div>
      </section>
    );
  }

  if (staff.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70">
        <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-600">
            <UsersRound size={22} />
          </div>

          <h3 className="mt-4 text-sm font-semibold text-zinc-200">
            No staff found
          </h3>

          <p className="mt-1 max-w-md text-sm text-zinc-500">
            {selectedRestaurantId === "ALL"
              ? "Select a restaurant to view its workforce."
              : "No employees match the current filters."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-white">
            Staff Directory
          </h2>

          <p className="mt-1 text-xs text-zinc-500">
            {staff.length} employee
            {staff.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 text-left">
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
                Employee
              </th>

              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
                Role
              </th>

              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
                Restaurant
              </th>

              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
                Status
              </th>

              <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {staff.map((employee) => {
              const restaurant = restaurantMap.get(
                employee.restaurantId,
              );

              return (
                <tr
                  key={employee.id}
                  className="border-b border-zinc-800/70 last:border-b-0 hover:bg-zinc-800/20"
                >
                  {/* Employee */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-xs font-semibold text-emerald-400">
                        {getInitials(
                          employee.firstName,
                          employee.lastName,
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-100">
                          {employee.firstName}{" "}
                          {employee.lastName}
                        </p>

                        <p className="mt-0.5 text-xs text-zinc-600">
                          {employee.employeeCode}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-5 py-4">
                    <span className="text-sm text-zinc-400">
                      {employee.role}
                    </span>
                  </td>

                  {/* Restaurant */}
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm text-zinc-300">
                        {restaurant?.name ??
                          employee.restaurantId}
                      </p>

                      {restaurant?.city && (
                        <p className="mt-0.5 text-xs text-zinc-600">
                          {restaurant.city}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <StatusBadge
                      status={employee.status}
                    />
                  </td>

                  {/* Action */}
                  <td className="px-5 py-4 text-right">
                    <ViewButton
                      onClick={() =>
                        onViewStaff(employee)
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="divide-y divide-zinc-800 md:hidden">
        {staff.map((employee) => {
          const restaurant = restaurantMap.get(
            employee.restaurantId,
          );

          return (
            <div
              key={employee.id}
              className="p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-xs font-semibold text-emerald-400">
                  {getInitials(
                    employee.firstName,
                    employee.lastName,
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-100">
                        {employee.firstName}{" "}
                        {employee.lastName}
                      </p>

                      <p className="mt-0.5 text-xs text-zinc-600">
                        {employee.employeeCode}
                      </p>
                    </div>

                    <StatusBadge
                      status={employee.status}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-zinc-600">
                        Role
                      </p>

                      <p className="mt-1 text-xs text-zinc-400">
                        {employee.role}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-zinc-600">
                        Restaurant
                      </p>

                      <p className="mt-1 truncate text-xs text-zinc-400">
                        {restaurant?.name ??
                          employee.restaurantId}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <ViewButton
                      fullWidth
                      onClick={() =>
                        onViewStaff(employee)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ViewButton({
  onClick,
  fullWidth = false,
}: {
  onClick: () => void;
  fullWidth?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400 ${
        fullWidth ? "w-full" : ""
      }`}
    >
      <Eye size={14} />
      View
    </button>
  );
}

function StatusBadge({
  status,
}: {
  status: WorkforceStaff["status"];
}) {
  const styles: Record<
    WorkforceStaff["status"],
    string
  > = {
    ACTIVE:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",

    ON_LEAVE:
      "border-amber-500/20 bg-amber-500/10 text-amber-400",

    SUSPENDED:
      "border-orange-500/20 bg-orange-500/10 text-orange-400",

    TERMINATED:
      "border-red-500/20 bg-red-500/10 text-red-400",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${styles[status]}`}
    >
      {formatStatus(status)}
    </span>
  );
}

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    );
}

function getInitials(
  firstName: string,
  lastName: string,
) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}