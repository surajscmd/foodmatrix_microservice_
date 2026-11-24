import { useState } from "react";
import {
  ArrowLeft,
  Banknote,
  BadgeCheck,
  CalendarClock,
  FileText,
  KeyRound,
  Pencil,
  UserRound,
} from "lucide-react";
import {
  attendanceError,
  deleteStaff,
  updateStaffStatus,
  type EmployeeStatus,
  type Staff,
} from "@/lib/hr-api";
import StaffForm from "./StaffForm";
import WagePanel from "./WagePanel";
import PayslipList from "./PayslipList";
import StaffPinDialog from "./StaffPinDialog";
import StaffPaySummary from "./StaffPaySummary";
import StaffDetailSection from "./StaffDetailSection";
import StaffActivityOverview from "./StaffActivityOverview";
import StaffShiftSchedule from "./StaffShiftSchedule";
import WorkforceFormDialog from "./WorkforceFormDialog";
import {
  dayLabel,
  ErrorNote,
  Field,
  input,
  panel,
  primary,
  secondary,
  Status,
} from "./shared";

const views = [
  { id: "overview", label: "Overview", Icon: UserRound },
  { id: "shifts", label: "Shift schedule", Icon: CalendarClock },
  { id: "wages", label: "Wages", Icon: Banknote },
  { id: "payslips", label: "Payslips", Icon: FileText },
] as const;

export default function StaffProfile({
  employee,
  currency,
  today,
  timeZone,
  notice,
  onClose,
  onSave,
  onArchive,
}: {
  employee: Staff;
  currency: string;
  today: string;
  timeZone: string;
  notice: string;
  onClose: () => void;
  onSave: (staff: Staff, message: string) => void;
  onArchive: (message: string) => void;
}) {
  const [view, setView] = useState<(typeof views)[number]["id"]>("overview");
  const [dialog, setDialog] = useState<"profile" | "pin" | "status" | null>(
    null,
  );
  const [status, setStatus] = useState<EmployeeStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmArchive, setConfirmArchive] = useState(false);

  async function archive() {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await deleteStaff(employee.id);
      onArchive("Staff member archived.");
    } catch (error) {
      setError(attendanceError(error, "Unable to archive the staff member."));
    } finally {
      setSaving(false);
    }
  }

  async function saveStatus() {
    if (!status || status === employee.status || saving) return;
    setSaving(true);
    setError("");
    try {
      const { data } = await updateStaffStatus(employee.id, status);
      onSave(data, "Staff status updated.");
      setStatus(null);
      setDialog(null);
    } catch (error) {
      setError(attendanceError(error, "Unable to update staff status."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="@container space-y-5 motion-safe:animate-fade-in">
      <button
        type="button"
        className="inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-xs font-medium text-zinc-300 hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-50"
        onClick={onClose}
        disabled={saving}
      >
        <ArrowLeft size={14} aria-hidden /> Back to staff directory
      </button>
      <section className="relative overflow-hidden rounded-3xl border border-zinc-800/90 bg-gradient-to-br from-[#0d1117] via-[#090b0f] to-[#07090c] shadow-[0_12px_40px_rgba(0,0,0,0.15)]">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-cyan-400/40"
        />
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-6 @xl:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="grid size-14 shrink-0 place-items-center rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-400/15 via-cyan-400/10 to-violet-400/10 text-lg font-semibold uppercase text-emerald-300 shadow-[0_0_24px_rgba(52,211,153,0.06)]"
              aria-hidden
            >
              {employee.firstName[0]}
              {employee.lastName[0]}
            </span>
            <div className="min-w-0">
              <p className="mb-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Employee profile
              </p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2 className="break-words text-xl font-semibold tracking-tight text-white">
                  {employee.firstName} {employee.lastName}
                </h2>
                <Status value={employee.status} />
              </div>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                <span>{employee.role.replaceAll("_", " ")}</span>
                <span className="break-all rounded border border-white/10 bg-black/15 px-1.5 py-0.5 font-mono text-[11px] text-zinc-200">
                  {employee.employeeCode}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            className={secondary}
            aria-haspopup="dialog"
            onClick={() => setDialog("profile")}
            disabled={saving}
          >
            <Pencil size={13} /> Edit profile
          </button>
        </div>
      </section>
      <nav
        className="grid grid-cols-2 gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950/80 p-2 sm:flex sm:flex-wrap"
        aria-label="Employee records"
      >
        {views.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={view === id}
            disabled={saving}
            onClick={() => setView(id)}
            className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border px-3 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:opacity-50 ${view === id ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-transparent text-zinc-500 hover:border-zinc-800 hover:bg-zinc-900 hover:text-zinc-200"}`}
          >
            <Icon size={15} aria-hidden />
            {label}
          </button>
        ))}
      </nav>
      {notice && (
        <p
          role="status"
          className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200"
        >
          {notice}
        </p>
      )}
      {error && dialog !== "status" && <ErrorNote>{error}</ErrorNote>}
      {dialog === "profile" && (
        <StaffForm
          employee={employee}
          restaurantId={employee.restaurantId}
          currency={currency}
          onClose={() => setDialog(null)}
          onSave={(staff, message) => {
            onSave(staff, message);
            setDialog(null);
          }}
        />
      )}
      {dialog === "pin" && (
        <StaffPinDialog
          employee={employee}
          onClose={() => setDialog(null)}
          onSave={(staff) => {
            onSave(staff, "Staff PIN reset.");
            setDialog(null);
          }}
        />
      )}
      {dialog === "status" && (
        <WorkforceFormDialog
          title="Change employment status"
          icon={UserRound}
          saving={saving}
          onClose={() => {
            setDialog(null);
            setStatus(null);
            setError("");
          }}
          onSubmit={(event) => {
            event.preventDefault();
            void saveStatus();
          }}
          actions={
            <button
              type="submit"
              className={primary}
              disabled={saving || !status || status === employee.status}
            >
              {saving ? "Saving…" : "Save status"}
            </button>
          }
        >
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
            <p className="text-sm font-semibold text-white">
              {employee.firstName} {employee.lastName}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {employee.employeeCode}
            </p>
          </div>
          <Field label="Employment status">
            <select
              className={input}
              value={status ?? employee.status}
              disabled={saving}
              onChange={(event) =>
                setStatus(event.target.value as EmployeeStatus)
              }
            >
              <option value="ACTIVE">Active</option>
              <option value="ON_LEAVE">On leave</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </Field>
          {error && <ErrorNote>{error}</ErrorNote>}
        </WorkforceFormDialog>
      )}
      {view === "overview" && (
        <StaffActivityOverview
          staffId={employee.id}
          currency={currency}
          today={today}
          timeZone={timeZone}
        >
          <StaffDetailSection title="Employee information" icon={UserRound}>
            <dl className="grid grid-cols-1 gap-5 text-xs sm:grid-cols-2">
              {[
                ["Employee name", `${employee.firstName} ${employee.lastName}`],
                ["Employee code", employee.employeeCode],
                ["Job role", employee.role.replaceAll("_", " ")],
                [
                  "Employment status",
                  <Status key="status" value={employee.status} />,
                ],
                ["Joined", dayLabel(employee.createdAt)],
                ["Last updated", dayLabel(employee.updatedAt)],
                [
                  "Record state",
                  employee.deletedAt ? "Archived" : "Active record",
                ],
                ["Restaurant time zone", timeZone],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    {label}
                  </dt>
                  <dd className="mt-2 break-words text-xs font-medium text-zinc-200">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-4">
              <p className="text-[10px] text-zinc-500">
                Manage active, on-leave or terminated status.
              </p>
              <button
                type="button"
                className={secondary}
                aria-haspopup="dialog"
                disabled={saving}
                onClick={() => {
                  setStatus(employee.status);
                  setError("");
                  setDialog("status");
                }}
              >
                Change status
              </button>
            </div>
          </StaffDetailSection>
          <StaffPaySummary
            staffId={employee.id}
            currency={currency}
            onOpen={setView}
          />
          <StaffDetailSection title="Staff PIN" icon={KeyRound}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-xs text-zinc-400">
                <BadgeCheck
                  size={14}
                  className="text-emerald-400"
                  aria-hidden
                />
                Saved PIN is protected
              </p>
              <button
                type="button"
                className={secondary}
                aria-haspopup="dialog"
                onClick={() => setDialog("pin")}
                disabled={saving}
              >
                Reset PIN
              </button>
            </div>
          </StaffDetailSection>
        </StaffActivityOverview>
      )}
      {view === "overview" && employee.status === "TERMINATED" && (
        <section
          className={
            panel +
            " flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          }
        >
          <div>
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
              Archive employee
            </h3>
            <p className="mt-0.5 text-xs text-zinc-400">
              Remove this employee from the directory. HR keeps their historical
              records.
            </p>
          </div>
          {confirmArchive ? (
            <div className="flex gap-2">
              <button
                type="button"
                className={secondary}
                disabled={saving}
                onClick={() => setConfirmArchive(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={secondary + " text-rose-200"}
                disabled={saving}
                onClick={archive}
              >
                {saving ? "Archiving…" : "Confirm archive"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={secondary}
              disabled={saving}
              onClick={() => setConfirmArchive(true)}
            >
              Archive
            </button>
          )}
        </section>
      )}
      {view === "wages" && (
        <WagePanel employee={employee} currency={currency} today={today} />
      )}
      {view === "shifts" && (
        <StaffShiftSchedule
          staffId={employee.id}
          restaurantId={employee.restaurantId}
          today={today}
          timeZone={timeZone}
        />
      )}
      {view === "payslips" && (
        <PayslipList staffId={employee.id} currency={currency} />
      )}
    </div>
  );
}
