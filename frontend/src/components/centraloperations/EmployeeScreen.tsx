"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

import { getAllStaff, getStaffByRestaurant } from "@/lib/hr-api";

import { useOrganizationStore } from "@/store/organization-store";

import WorkforceHeader from "@/elements/workforcecomand/WorkforceHeader";
import WorkforceMetrics from "@/elements/workforcecomand/WorkforceMetrics";
import WorkforceFilters from "@/elements/workforcecomand/WorkforceFilters";
import StaffDirectory from "@/elements/workforcecomand/StaffDirectory";
import StaffInformationView from "@/elements/workforcecomand/StaffInformationView";

export type WorkforceStatus =
  | "ALL"
  | "ACTIVE"
  | "ON_LEAVE"
  | "SUSPENDED"
  | "TERMINATED";

export interface WorkforceStaff {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  role: string;
  status: Exclude<WorkforceStatus, "ALL">;
  restaurantId: string;

  currentWage?: {
    id: string;
    payType: "HOURLY" | "SALARY";
    hourlyWage?: string | number | null;
    overtimeRate?: string | number | null;
    salaryAmount?: string | number | null;
    effectiveFrom: string;
  } | null;
}

export default function EmployeeScreen() {
  const restaurants = useOrganizationStore((state) => state.restaurants);

  const [selectedRestaurantId, setSelectedRestaurantId] = useState("ALL");

  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState<WorkforceStatus>("ALL");

  const [staff, setStaff] = useState<WorkforceStaff[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  /*
   * IMPORTANT:
   * This is NOT a route.
   *
   * selectedStaffId simply switches the current page
   * from the list to the full employee information view.
   */
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  const restaurantMap = useMemo(() => {
    return new Map(
      restaurants.map((restaurant) => [restaurant.id, restaurant]),
    );
  }, [restaurants]);

  /*
   * ---------------------------------------------------------
   * LOAD STAFF
   * ---------------------------------------------------------
   */

  const loadStaff = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response =
        selectedRestaurantId === "ALL"
          ? await getAllStaff(1, 20)
          : await getStaffByRestaurant(selectedRestaurantId, 1, 20);

      const staffData = response?.data?.data ?? [];

      setStaff(staffData as WorkforceStaff[]);

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load workforce:", err);

      setError(
        err instanceof Error ? err.message : "Unable to load workforce data.",
      );

      setStaff([]);
    } finally {
      setIsLoading(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * LOAD STAFF WHEN RESTAURANT CHANGES
   * ---------------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    const fetchStaff = async () => {
      try {
        if (!cancelled) {
          setIsLoading(true);
          setError(null);
        }

        const response =
          selectedRestaurantId === "ALL"
            ? await getAllStaff(1, 20)
            : await getStaffByRestaurant(selectedRestaurantId, 1, 20);

        if (cancelled) return;

        const staffData = response?.data?.data ?? [];

        setStaff(staffData as WorkforceStaff[]);

        setLastUpdated(new Date());
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to load staff:", err);

        setError(err instanceof Error ? err.message : "Failed to load staff");

        setStaff([]);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchStaff();

    return () => {
      cancelled = true;
    };
  }, [selectedRestaurantId]);

  /*
   * ---------------------------------------------------------
   * FILTER
   * ---------------------------------------------------------
   */

  const filteredStaff = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return staff.filter((employee) => {
      const matchesRestaurant =
        selectedRestaurantId === "ALL" ||
        employee.restaurantId === selectedRestaurantId;

      const matchesStatus =
        statusFilter === "ALL" || employee.status === statusFilter;

      const fullName = `${employee.firstName} ${employee.lastName}`;

      const matchesSearch =
        !query ||
        fullName.toLowerCase().includes(query) ||
        employee.employeeCode.toLowerCase().includes(query) ||
        employee.role.toLowerCase().includes(query);

      return matchesRestaurant && matchesStatus && matchesSearch;
    });
  }, [staff, selectedRestaurantId, statusFilter, searchTerm]);

  /*
   * ---------------------------------------------------------
   * METRICS
   * ---------------------------------------------------------
   */

  const metrics = useMemo(() => {
    const active = staff.filter(
      (employee) => employee.status === "ACTIVE",
    ).length;

    const onLeave = staff.filter(
      (employee) => employee.status === "ON_LEAVE",
    ).length;

    const suspended = staff.filter(
      (employee) => employee.status === "SUSPENDED",
    ).length;

    return {
      total: staff.length,
      active,
      onLeave,
      suspended,
    };
  }, [staff]);

  /*
   * ---------------------------------------------------------
   * FULL EMPLOYEE INFORMATION VIEW
   *
   * Same route.
   * No modal.
   * No drawer.
   * No new URL.
   * ---------------------------------------------------------
   */

  if (selectedStaffId) {
    const selectedEmployee = staff.find(
      (employee) => employee.id === selectedStaffId,
    );

    const restaurantName = selectedEmployee
      ? restaurantMap.get(selectedEmployee.restaurantId)?.name
      : undefined;

    return (
      <main className="min-h-full bg-[#070a0f] text-white">
        <StaffInformationView
          key={selectedStaffId}
          staffId={selectedStaffId}
          restaurantName={restaurantName}
          onBack={() => setSelectedStaffId(null)}
        />
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * WORKFORCE LIST
   * ---------------------------------------------------------
   */

  return (
    <main className="min-h-full bg-[#070a0f] text-white">
      <div className="mx-auto w-full max-w-[1800px] px-4 py-5 sm:px-6 lg:px-8">
        <WorkforceHeader
          lastUpdated={lastUpdated}
          onRefresh={loadStaff}
          isRefreshing={isLoading}
        />

        <section className="mt-6">
          <WorkforceMetrics
            total={metrics.total}
            active={metrics.active}
            onLeave={metrics.onLeave}
            suspended={metrics.suspended}
          />
        </section>

        <section className="mt-6">
          <WorkforceFilters
            restaurants={restaurants}
            selectedRestaurantId={selectedRestaurantId}
            onRestaurantChange={setSelectedRestaurantId}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
          />
        </section>

        {error && (
          <section className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-4">
            <div className="flex items-center gap-3">
              <AlertCircle size={18} className="shrink-0 text-red-400" />

              <p className="text-sm text-red-300">{error}</p>

              <button
                type="button"
                onClick={() => void loadStaff()}
                disabled={isLoading}
                className="ml-auto inline-flex items-center gap-2 rounded-lg border border-red-500/20 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={isLoading ? "animate-spin" : ""}
                />
                Retry
              </button>
            </div>
          </section>
        )}

        <section className="mt-6">
          <StaffDirectory
            staff={filteredStaff}
            restaurantMap={restaurantMap}
            isLoading={isLoading}
            selectedRestaurantId={selectedRestaurantId}
            onViewStaff={(employee) => setSelectedStaffId(employee.id)}
          />
        </section>
      </div>
    </main>
  );
}
