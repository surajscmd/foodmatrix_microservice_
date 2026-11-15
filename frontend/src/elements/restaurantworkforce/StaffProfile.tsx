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
import StaffShiftSchedule from "./StaffShiftSchedule";
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
  const [dialog, setDialog] = useState<"profile" | "pin" | null>(null);
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
    if (!status || saving) return;
    setSaving(true);
    setError("");
    try {
      const { data } = await updateStaffStatus(employee.id, status);
      onSave(data, "Staff status updated.");
      setStatus(null);
    } catch (error) {
      setError(attendanceError(error, "Unable to update staff status."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="@container space-y-3">
      <button
        type="button"
        className="inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-xs font-medium text-zinc-300 hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-50"
        onClick={onClose}
        disabled={saving}
      >
        <ArrowLeft size={14} aria-hidden /> Back to staff directory
      </button>
      <section className={panel}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-300/15 bg-linear-to-r from-teal-900/85 via-[#172623] to-[#141821] px-4 py-4 @xl:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="grid size-11 shrink-0 place-items-center rounded-xl border border-teal-300/25 bg-teal-300/15 text-sm font-semibold uppercase text-teal-100"
              aria-hidden
            >
              {employee.firstName[0]}
              {employee.lastName[0]}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2 className="break-words text-base font-semibold tracking-tight text-white">
                  {employee.firstName} {employee.lastName}
                </h2>
                <Status value={employee.status} />
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-teal-100/85">
                <span>{employee.role}</span>
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
        <nav
          className="flex flex-wrap gap-1 bg-[#191c22] p-2"
          aria-label="Employee records"
        >
          {views.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              onClick={() => setView(id)}
              className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium focus-visible:outline-2 focus-visible:outline-emerald-300 ${view === id ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-100" : "border-transparent text-zinc-300 hover:bg-white/8"}`}
            >
              <Icon size={15} aria-hidden />
              {label}
            </button>
          ))}
        </nav>
      </section>
      {notice && (
        <p
          role="status"
          className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200"
        >
          {notice}
        </p>
      )}
      {error && <ErrorNote>{error}</ErrorNote>}
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
      {view === "overview" && (
        <div className="grid items-start gap-3 @2xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            <section className={panel}>
              <h3 className="flex items-center gap-2 border-b border-white/8 bg-[#191c22] px-4 py-2.5 text-xs font-semibold text-white">
                <UserRound size={16} className="text-emerald-300" aria-hidden />{" "}
                Employment details
              </h3>
              <dl className="grid grid-cols-2 gap-3 px-4 py-3">
                <div>
                  <dt className="text-xs text-zinc-400">Employee code</dt>
                  <dd className="mt-1 break-words font-mono text-xs font-medium text-white">
                    {employee.employeeCode}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-400">Job role</dt>
                  <dd className="mt-1 break-words text-xs font-medium text-white">
                    {employee.role}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-400">Added to HR</dt>
                  <dd className="mt-1 text-xs font-medium text-white">
                    {dayLabel(employee.createdAt)}
                  </dd>
                </div>
              </dl>
              <div className="flex flex-wrap items-end gap-2 border-t border-white/8 px-4 py-3">
                <Field label="Employment status">
                  <select
                    className={input + " min-w-32"}
                    value={status ?? employee.status}
                    onChange={(event) =>
                      setStatus(event.target.value as EmployeeStatus)
                    }
                    disabled={saving}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="ON_LEAVE">On leave</option>
                    <option value="TERMINATED">Terminated</option>
                  </select>
                </Field>
                {status && status !== employee.status && (
                  <>
                    <button
                      type="button"
                      className={secondary}
                      onClick={() => {
                        setStatus(null);
                        setError("");
                      }}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={primary}
                      onClick={saveStatus}
                      disabled={saving}
                    >
                      {saving ? "Saving…" : "Save status"}
                    </button>
                  </>
                )}
              </div>
            </section>
            <section className={panel}>
              <h3 className="flex items-center gap-2 border-b border-white/8 bg-[#191c22] px-4 py-2.5 text-xs font-semibold text-white">
                <KeyRound size={16} className="text-sky-300" aria-hidden />{" "}
                Staff PIN
              </h3>
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <p className="flex items-center gap-1.5 text-xs text-zinc-300">
                  <BadgeCheck size={14} className="text-sky-300" aria-hidden />{" "}
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
            </section>
          </div>
          <StaffPaySummary
            staffId={employee.id}
            currency={currency}
            onOpen={setView}
          />
        </div>
      )}
      {view === "overview" && employee.status === "TERMINATED" && (
        <section
          className={
            panel +
            " flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          }
        >
          <div>
            <h3 className="text-sm font-semibold text-white">
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
