import { useState, type FormEvent } from "react";
import { CalendarCheck } from "lucide-react";
import { attendanceError, reviewLeave, type LeaveRecord } from "@/lib/hr-api";
import { dayLabel, ErrorNote, primary, secondary, Status } from "./shared";
import WorkforceFormDialog from "./WorkforceFormDialog";

export default function LeaveReviewDialog({
  leave,
  onClose,
  onSaved,
}: {
  leave: LeaveRecord;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [decision, setDecision] = useState<"approve" | "reject">();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!decision || saving) return;
    setSaving(true);
    setError("");
    try {
      const { message } = await reviewLeave(leave.id, decision);
      onSaved(message);
    } catch (error) {
      setError(attendanceError(error, "Unable to save the decision."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkforceFormDialog
      title="Review leave request"
      icon={CalendarCheck}
      saving={saving}
      onClose={onClose}
      onSubmit={submit}
      actions={
        <button
          type="submit"
          disabled={!decision || saving}
          className={
            decision === "reject" ? secondary + " text-rose-200" : primary
          }
        >
          {saving
            ? "Saving…"
            : decision === "approve"
              ? "Approve leave"
              : decision === "reject"
                ? "Reject request"
                : "Save decision"}
        </button>
      }
    >
      <div
        tabIndex={-1}
        data-initial-focus
        className="rounded-xl border border-teal-300/15 bg-teal-950/35 p-3 outline-none"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-white">
              {leave.staff
                ? leave.staff.firstName + " " + leave.staff.lastName
                : "Staff member"}
            </p>
            {leave.staff && (
              <p className="text-xs text-zinc-400">
                {leave.staff.employeeCode} · {leave.staff.role}
              </p>
            )}
          </div>
          <Status value={leave.status} />
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-white/8 pt-3 text-xs">
          <div>
            <dt className="text-zinc-400">Leave type</dt>
            <dd className="mt-0.5 break-words text-zinc-100">{leave.type}</dd>
          </div>
          <div>
            <dt className="text-zinc-400">Pay type</dt>
            <dd className="mt-0.5 text-zinc-100">
              {leave.isPaidLeave ? "Paid leave" : "Unpaid leave"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-400">Starts</dt>
            <dd className="mt-0.5 text-zinc-100">
              {dayLabel(leave.startDate)}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-400">Ends</dt>
            <dd className="mt-0.5 text-zinc-100">{dayLabel(leave.endDate)}</dd>
          </div>
        </dl>
      </div>
      {leave.reason && (
        <div className="text-xs">
          <p className="font-medium text-zinc-300">Reason</p>
          <p className="mt-1 whitespace-pre-wrap break-words text-zinc-200">
            {leave.reason}
          </p>
        </div>
      )}
      {error && <ErrorNote>{error}</ErrorNote>}
      <fieldset disabled={saving} className="grid gap-2 sm:grid-cols-2">
        <legend className="mb-2 text-xs font-semibold text-zinc-200">
          Decision
        </legend>
        {(
          [
            [
              "approve",
              "Approve",
              leave.isPaidLeave
                ? "Counts as approved paid leave for payroll."
                : "Marks these dates as approved unpaid leave.",
            ],
            ["reject", "Reject", "Leaves the request in history as rejected."],
          ] as const
        ).map(([value, label, description]) => (
          <label
            key={value}
            className="flex cursor-pointer items-start gap-2 rounded-lg border border-white/10 bg-zinc-950/50 p-3 text-xs has-checked:border-teal-300/50 has-checked:bg-teal-400/10"
          >
            <input
              type="radio"
              name="decision"
              value={value}
              checked={decision === value}
              onChange={() => setDecision(value)}
              className="mt-0.5 accent-emerald-300"
            />
            <span>
              <span className="block font-semibold text-white">{label}</span>
              <span className="mt-1 block text-zinc-400">{description}</span>
            </span>
          </label>
        ))}
      </fieldset>
    </WorkforceFormDialog>
  );
}
