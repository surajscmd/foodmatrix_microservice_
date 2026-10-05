"use client";

import { useEffect, useState } from "react";
import {
  Banknote,
  CalendarDays,
  Clock3,
  FileText,
  Loader2,
  UserRound,
  X,
} from "lucide-react";

import {
  getStaffById,
  getCurrentWage,
  type Staff,
  type WageHistory,
} from "@/lib/hr-api";

interface StaffDetailDrawerProps {
  staffId: string;
  onClose: () => void;
}

export default function StaffDetailDrawer({
  staffId,
  onClose,
}: StaffDetailDrawerProps) {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [wage, setWage] = useState<WageHistory | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStaffDetails() {
      try {
        setIsLoading(true);
        setError(null);

        const [staffResponse, wageResponse] =
          await Promise.all([
            getStaffById(staffId),
            getCurrentWage(staffId),
          ]);

        if (cancelled) return;

        setStaff(staffResponse.data);
        setWage(wageResponse.data);
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to load staff details:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load staff details",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadStaffDetails();

    return () => {
      cancelled = true;
    };
  }, [staffId]);

  if (isLoading) {
    return (
      <DrawerShell onClose={onClose}>
        <div className="flex h-full items-center justify-center">
          <Loader2
            size={24}
            className="animate-spin text-emerald-400"
          />
        </div>
      </DrawerShell>
    );
  }

  if (error || !staff) {
    return (
      <DrawerShell onClose={onClose}>
        <div className="p-6">
          <p className="text-sm font-medium text-red-400">
            {error ?? "Staff not found"}
          </p>
        </div>
      </DrawerShell>
    );
  }

  const fullName = `${staff.firstName} ${staff.lastName}`;

  const compensation =
    wage?.payType === "HOURLY"
      ? `₹${Number(wage.hourlyWage ?? 0).toLocaleString(
          "en-IN",
        )}/hr`
      : wage?.payType === "SALARY"
        ? `₹${Number(wage.salaryAmount ?? 0).toLocaleString(
            "en-IN",
          )}/mo`
        : "Not configured";

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl">
        {/* Header */}
        <div className="border-b border-zinc-800 px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <UserRound size={22} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-white">
                  {fullName}
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  {staff.employeeCode} · {staff.role}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-5">
            {/* Employee */}
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <SectionTitle
                icon={<UserRound size={16} />}
                title="Employee"
              />

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Info
                  label="Employee Code"
                  value={staff.employeeCode}
                />

                <Info
                  label="Role"
                  value={staff.role}
                />

                <Info
                  label="Status"
                  value={formatStatus(staff.status)}
                />

                <Info
                  label="Restaurant"
                  value={staff.restaurantId}
                />
              </div>
            </section>

            {/* Compensation */}
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <SectionTitle
                icon={<Banknote size={16} />}
                title="Current Compensation"
              />

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Info
                  label="Pay Type"
                  value={wage?.payType ?? "—"}
                />

                <Info
                  label="Current Wage"
                  value={compensation}
                />

                <Info
                  label="Overtime Rate"
                  value={
                    wage?.overtimeRate != null
                      ? `₹${Number(
                          wage.overtimeRate,
                        ).toLocaleString("en-IN")}/hr`
                      : "—"
                  }
                />
              </div>

              {wage?.effectiveStartDate && (
                <p className="mt-4 text-xs text-zinc-500">
                  Effective from{" "}
                  {formatDate(wage.effectiveStartDate)}
                </p>
              )}
            </section>

            {/* Operational sections */}
            <div className="grid gap-3 sm:grid-cols-2">
              <ActionCard
                icon={<Clock3 size={17} />}
                title="Attendance"
                description="Clock-ins and worked hours"
              />

              <ActionCard
                icon={<CalendarDays size={17} />}
                title="Schedule"
                description="Assigned and upcoming shifts"
              />

              <ActionCard
                icon={<FileText size={17} />}
                title="Leave"
                description="Requests and approvals"
              />

              <ActionCard
                icon={<Banknote size={17} />}
                title="Payroll"
                description="Payroll and payment records"
              />
            </div>

            {/* Payslips */}
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <SectionTitle
                icon={<FileText size={16} />}
                title="Payslips"
              />

              <div className="mt-4 rounded-lg border border-dashed border-zinc-800 p-6 text-center">
                <p className="text-sm text-zinc-500">
                  Payslips will appear here.
                </p>
              </div>
            </section>
          </div>
        </div>
      </aside>
    </>
  );
}

function DrawerShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
      />

      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-xl border-l border-zinc-800 bg-zinc-950 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 text-zinc-400 hover:text-white"
        >
          <X size={20} />
        </button>

        {children}
      </aside>
    </>
  );
}

function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-emerald-400">{icon}</span>
      <h3 className="text-sm font-semibold text-white">
        {title}
      </h3>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
      <p className="text-[10px] uppercase tracking-wide text-zinc-600">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-medium text-zinc-200">
        {value}
      </p>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-left transition hover:border-emerald-500/30 hover:bg-zinc-900"
    >
      <span className="text-emerald-400">
        {icon}
      </span>

      <p className="mt-3 text-sm font-medium text-zinc-200">
        {title}
      </p>

      <p className="mt-1 text-xs text-zinc-500">
        {description}
      </p>
    </button>
  );
}

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}