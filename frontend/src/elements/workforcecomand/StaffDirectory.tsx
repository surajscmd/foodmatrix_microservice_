"use client";

import {
  ArrowUpRight,
  Check,
  Loader2,
  MapPin,
  Power,
  UsersRound,
} from "lucide-react";

import { useMemo, useState } from "react";

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

  onStatusChange: (
    staff: WorkforceStaff,
  ) => Promise<void>;
}

type StaffStatusFilter = "ACTIVE" | "INACTIVE";

export default function StaffDirectory({
  staff,
  restaurantMap,
  isLoading,
  selectedRestaurantId,
  onViewStaff,
  onStatusChange,
}: StaffDirectoryProps) {
  // ============================================================
  // STATUS FILTER
  // ============================================================

  const [statusFilter, setStatusFilter] =
    useState<StaffStatusFilter>("ACTIVE");

  const [updatingStaffId, setUpdatingStaffId] =
    useState<string | null>(null);

  // ============================================================
  // FILTER STAFF
  // ============================================================

  const filteredStaff = useMemo(() => {
    if (statusFilter === "ACTIVE") {
      return staff.filter(
        (employee) => employee.status === "ACTIVE",
      );
    }

    return staff.filter(
      (employee) => employee.status !== "ACTIVE",
    );
  }, [staff, statusFilter]);

  // ============================================================
  // COUNTS
  // ============================================================

  const activeCount = staff.filter(
    (employee) => employee.status === "ACTIVE",
  ).length;

  const inactiveCount = staff.filter(
    (employee) => employee.status !== "ACTIVE",
  ).length;

  // ============================================================
  // STATUS ACTION
  // ============================================================

  const handleStatusToggle = async (
    event: React.MouseEvent,
    employee: WorkforceStaff,
  ) => {
    // Prevent opening employee details
    // when clicking Activate / Deactivate.
    event.stopPropagation();

    // Only ACTIVE and TERMINATED can be toggled.
    //
    // ACTIVE     -> TERMINATED
    // TERMINATED -> ACTIVE
    //
    // ON_LEAVE remains managed separately.
    if (
      employee.status !== "ACTIVE" &&
      employee.status !== "TERMINATED"
    ) {
      return;
    }

    try {
      setUpdatingStaffId(employee.id);

      await onStatusChange(employee);
    } finally {
      setUpdatingStaffId(null);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80">
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

  // ============================================================
  // EMPTY STATE
  // ============================================================

  if (filteredStaff.length === 0) {
    return (
      <section>
        {/* HEADER */}
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* LEFT */}
          <div>
            <p className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-zinc-400">
              Staff Nodes
            </p>

            <p className="mt-0.5 text-[10px] text-zinc-600">
              Select an employee to inspect operational details
            </p>
          </div>

          {/* RIGHT */}
          <StatusToggle
            value={statusFilter}
            onChange={setStatusFilter}
            activeCount={activeCount}
            inactiveCount={inactiveCount}
          />
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80">
          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-600">
              <UsersRound size={22} />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-zinc-200">
              No staff found
            </h3>

            <p className="mt-1 max-w-md text-xs text-zinc-500">
              {selectedRestaurantId === "ALL"
                ? statusFilter === "ACTIVE"
                  ? "No active workforce records are currently available."
                  : "No inactive workforce records are currently available."
                : statusFilter === "ACTIVE"
                  ? "No active employees match the current filters."
                  : "No inactive employees match the current filters."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  // ============================================================
  // MAIN
  // ============================================================

  return (
    <section>
      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        {/* LEFT SIDE */}
        <div>
          <div className="flex items-center gap-3">
            <p className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-zinc-400">
              Staff Nodes
            </p>

            {/* RECORD COUNT ON LEFT */}
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
              {filteredStaff.length}{" "}
              {filteredStaff.length === 1
                ? "record"
                : "records"}
            </span>
          </div>

          <p className="mt-0.5 text-[10px] text-zinc-600">
            Select an employee to inspect operational details
          </p>
        </div>

        {/* RIGHT SIDE */}
        <StatusToggle
          value={statusFilter}
          onChange={setStatusFilter}
          activeCount={activeCount}
          inactiveCount={inactiveCount}
        />
      </div>

      {/* ========================================================
          DESKTOP
      ======================================================== */}

      <div className="hidden md:block">
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70">
          {/* COLUMN HEADING */}

          <div className="grid grid-cols-[minmax(240px,1.8fr)_minmax(130px,1fr)_minmax(170px,1fr)_110px_135px_40px] items-center border-b border-zinc-800 bg-zinc-950/80 px-5 py-3">
            <span className="text-[9px] font-mono font-bold uppercase tracking-[0.16em] text-zinc-600">
              Employee
            </span>

            <span className="text-[9px] font-mono font-bold uppercase tracking-[0.16em] text-zinc-600">
              Role
            </span>

            <span className="text-[9px] font-mono font-bold uppercase tracking-[0.16em] text-zinc-600">
              Restaurant
            </span>

            <span className="text-[9px] font-mono font-bold uppercase tracking-[0.16em] text-zinc-600">
              Status
            </span>

            <span className="text-[9px] font-mono font-bold uppercase tracking-[0.16em] text-zinc-600">
              Action
            </span>

            <span />
          </div>

          {/* ROWS */}

          <div>
            {filteredStaff.map((employee) => {
              const restaurant = restaurantMap.get(
                employee.restaurantId,
              );

              const isUpdating =
                updatingStaffId === employee.id;

              const canToggleStatus =
                employee.status === "ACTIVE" ||
                employee.status === "TERMINATED";

              const nextAction =
                employee.status === "ACTIVE"
                  ? "Deactivate"
                  : "Activate";

              return (
                <div
                  key={employee.id}
                  className="grid grid-cols-[minmax(240px,1.8fr)_minmax(130px,1fr)_minmax(170px,1fr)_110px_135px_40px] items-center border-b border-zinc-800/70 px-5 py-4 transition-all duration-200 last:border-b-0 hover:bg-zinc-900/80"
                >
                  {/* EMPLOYEE */}

                  <button
                    type="button"
                    onClick={() =>
                      onViewStaff(employee)
                    }
                    aria-label={`Open ${employee.firstName} ${employee.lastName}`}
                    className="group flex min-w-0 items-center gap-3 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/40"
                  >
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-[11px] font-semibold text-emerald-400 transition-all duration-200 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10">
                      {getInitials(
                        employee.firstName,
                        employee.lastName,
                      )}

                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-950 ${getStatusDotClass(
                          employee.status,
                        )}`}
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-100 transition-colors group-hover:text-white">
                        {employee.firstName}{" "}
                        {employee.lastName}
                      </p>

                      <div className="mt-1 flex items-center gap-2">
                        <span className="font-mono text-[10px] text-zinc-600">
                          {employee.employeeCode}
                        </span>

                        <span className="h-1 w-1 rounded-full bg-zinc-700" />

                        <span className="text-[10px] text-zinc-600">
                          Employee
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* ROLE */}

                  <div>
                    <span className="text-xs text-zinc-400">
                      {employee.role}
                    </span>
                  </div>

                  {/* RESTAURANT */}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <MapPin
                        size={12}
                        className="shrink-0 text-zinc-600"
                      />

                      <div className="min-w-0">
                        <p className="truncate text-xs text-zinc-300">
                          {restaurant?.name ??
                            "Unknown restaurant"}
                        </p>

                        {restaurant?.city && (
                          <p className="mt-0.5 truncate text-[10px] text-zinc-600">
                            {restaurant.city}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* STATUS */}

                  <div>
                    <StatusBadge
                      status={employee.status}
                    />
                  </div>

                  {/* STATUS ACTION */}

                  <div>
                    {canToggleStatus ? (
                      <button
                        type="button"
                        onClick={(event) =>
                          handleStatusToggle(
                            event,
                            employee,
                          )
                        }
                        disabled={isUpdating}
                        className={`inline-flex min-w-[108px] items-center justify-center gap-2 rounded-lg border px-3 py-2 text-[9px] font-semibold uppercase tracking-wider transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                          employee.status ===
                          "ACTIVE"
                            ? "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
                            : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/15"
                        }`}
                      >
                        {isUpdating ? (
                          <Loader2
                            size={12}
                            className="animate-spin"
                          />
                        ) : employee.status ===
                          "ACTIVE" ? (
                          <Power size={12} />
                        ) : (
                          <Check size={12} />
                        )}

                        {isUpdating
                          ? "Updating..."
                          : nextAction}
                      </button>
                    ) : (
                      <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-700">
                        Managed status
                      </span>
                    )}
                  </div>

                  {/* ARROW */}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        onViewStaff(employee)
                      }
                      aria-label={`Open ${employee.firstName} ${employee.lastName}`}
                      className="group rounded-lg p-1.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/40"
                    >
                      <ArrowUpRight
                        size={15}
                        className="text-zinc-700 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-400"
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================
          MOBILE
      ======================================================== */}

      <div className="space-y-2 md:hidden">
        {filteredStaff.map((employee) => {
          const restaurant = restaurantMap.get(
            employee.restaurantId,
          );

          const isUpdating =
            updatingStaffId === employee.id;

          const canToggleStatus =
            employee.status === "ACTIVE" ||
            employee.status === "TERMINATED";

          return (
            <div
              key={employee.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/80"
            >
              <div className="flex items-start gap-3">
                {/* AVATAR */}

                <button
                  type="button"
                  onClick={() =>
                    onViewStaff(employee)
                  }
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-[11px] font-semibold text-emerald-400 focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/40"
                  aria-label={`Open ${employee.firstName} ${employee.lastName}`}
                >
                  {getInitials(
                    employee.firstName,
                    employee.lastName,
                  )}

                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-950 ${getStatusDotClass(
                      employee.status,
                    )}`}
                  />
                </button>

                <div className="min-w-0 flex-1">
                  {/* NAME + STATUS */}

                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        onViewStaff(employee)
                      }
                      className="min-w-0 text-left focus:outline-none"
                    >
                      <p className="truncate text-sm font-medium text-zinc-100">
                        {employee.firstName}{" "}
                        {employee.lastName}
                      </p>

                      <p className="mt-1 font-mono text-[10px] text-zinc-600">
                        {employee.employeeCode}
                      </p>
                    </button>

                    <StatusBadge
                      status={employee.status}
                    />
                  </div>

                  {/* DETAILS */}

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="min-w-0">
                      <p className="text-[9px] font-mono uppercase tracking-[0.14em] text-zinc-600">
                        Role
                      </p>

                      <p className="mt-1 truncate text-xs text-zinc-400">
                        {employee.role}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] font-mono uppercase tracking-[0.14em] text-zinc-600">
                        Restaurant
                      </p>

                      <p className="mt-1 truncate text-xs text-zinc-400">
                        {restaurant?.name ??
                          "Unknown restaurant"}
                      </p>
                    </div>
                  </div>

                  {/* ACTION */}

                  <div className="mt-4 flex items-center justify-between border-t border-zinc-800/70 pt-3">
                    <button
                      type="button"
                      onClick={() =>
                        onViewStaff(employee)
                      }
                      className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-zinc-600 transition-colors hover:text-zinc-300"
                    >
                      Open workforce record
                      <ArrowUpRight size={12} />
                    </button>

                    {canToggleStatus && (
                      <button
                        type="button"
                        onClick={(event) =>
                          handleStatusToggle(
                            event,
                            employee,
                          )
                        }
                        disabled={isUpdating}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[9px] font-semibold uppercase tracking-wider transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                          employee.status ===
                          "ACTIVE"
                            ? "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
                            : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:border-emerald-500/40"
                        }`}
                      >
                        {isUpdating ? (
                          <Loader2
                            size={12}
                            className="animate-spin"
                          />
                        ) : employee.status ===
                          "ACTIVE" ? (
                          <Power size={12} />
                        ) : (
                          <Check size={12} />
                        )}

                        {isUpdating
                          ? "Updating..."
                          : employee.status ===
                              "ACTIVE"
                            ? "Deactivate"
                            : "Activate"}
                      </button>
                    )}
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

// ============================================================
// ACTIVE / INACTIVE FILTER
// ============================================================

function StatusToggle({
  value,
  onChange,
  activeCount,
  inactiveCount,
}: {
  value: StaffStatusFilter;
  onChange: (
    value: StaffStatusFilter,
  ) => void;
  activeCount: number;
  inactiveCount: number;
}) {
  return (
    <div className="inline-flex w-fit items-center rounded-xl border border-zinc-800 bg-zinc-950 p-1">
      {/* ACTIVE */}

      <button
        type="button"
        onClick={() => onChange("ACTIVE")}
        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 ${
          value === "ACTIVE"
            ? "bg-emerald-500/10 text-emerald-400 shadow-sm"
            : "text-zinc-600 hover:bg-zinc-900 hover:text-zinc-300"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            value === "ACTIVE"
              ? "bg-emerald-400"
              : "bg-zinc-700"
          }`}
        />

        Active

        <span
          className={`font-mono ${
            value === "ACTIVE"
              ? "text-emerald-500"
              : "text-zinc-700"
          }`}
        >
          {activeCount}
        </span>
      </button>

      {/* INACTIVE */}

      <button
        type="button"
        onClick={() => onChange("INACTIVE")}
        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 ${
          value === "INACTIVE"
            ? "bg-zinc-800 text-zinc-200 shadow-sm"
            : "text-zinc-600 hover:bg-zinc-900 hover:text-zinc-300"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            value === "INACTIVE"
              ? "bg-zinc-400"
              : "bg-zinc-700"
          }`}
        />

        Inactive

        <span
          className={`font-mono ${
            value === "INACTIVE"
              ? "text-zinc-300"
              : "text-zinc-700"
          }`}
        >
          {inactiveCount}
        </span>
      </button>
    </div>
  );
}

// ============================================================
// STATUS BADGE
// ============================================================

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

    TERMINATED:
      "border-red-500/20 bg-red-500/10 text-red-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider ${styles[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />

      {formatStatus(status)}
    </span>
  );
}

// ============================================================
// STATUS HELPERS
// ============================================================

function formatStatus(status: string) {
  // Backend value remains TERMINATED.
  // Operations UI displays it as INACTIVE.
  if (status === "TERMINATED") {
    return "Inactive";
  }

  return status
    .replace(/\_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusDotClass(
  status: WorkforceStaff["status"],
) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-400";

    case "ON_LEAVE":
      return "bg-amber-400";

    case "TERMINATED":
      return "bg-red-400";

    default:
      return "bg-zinc-500";
  }
}

// ============================================================
// INITIALS
// ============================================================

function getInitials(
  firstName: string,
  lastName: string,
) {
  const first =
    firstName?.charAt(0) ?? "";

  const last =
    lastName?.charAt(0) ?? "";

  return (
    `${first}${last}`.toUpperCase() || "?"
  );
}