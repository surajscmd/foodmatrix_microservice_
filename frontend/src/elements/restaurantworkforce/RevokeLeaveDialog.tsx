import { useState, type FormEvent } from "react";
import { CalendarX } from "lucide-react";
import { attendanceError, revokeLeave, type LeaveRecord } from "@/lib/hr-api";
import { dayLabel, ErrorNote, Field, input } from "./shared";
import WorkforceFormDialog from "./WorkforceFormDialog";

export default function RevokeLeaveDialog({
  leave,
  onClose,
  onSaved,
}: {
  leave: LeaveRecord;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const reason = String(
      new FormData(event.currentTarget).get("reason") ?? "",
    ).trim();
    if (!reason) {
      setError("Enter a reason for revoking this leave.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { message } = await revokeLeave(leave, reason);
      onSaved(message);
    } catch (error) {
      setError(attendanceError(error, "Could not revoke the leave request."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkforceFormDialog
      title={
        leave.status === "APPROVED"
          ? "Revoke approved leave"
          : "Revoke pending request"
      }
      icon={CalendarX}
      saving={saving}
      onClose={onClose}
      onSubmit={submit}
      actions={
        <button
          type="submit"
          disabled={saving}
          className="min-h-9 rounded-lg bg-rose-300 px-3 text-xs font-semibold text-rose-950 hover:bg-rose-200 focus-visible:outline-2 focus-visible:outline-rose-200 disabled:opacity-50"
        >
          {saving ? "Revoking…" : "Confirm revoke"}
        </button>
      }
    >
      <div className="rounded-lg border border-white/8 bg-zinc-950/60 p-3 text-xs text-zinc-300">
        {leave.staff && (
          <p className="font-semibold text-white">
            {leave.staff.firstName} {leave.staff.lastName}
          </p>
        )}
        <p>
          {leave.type} · {dayLabel(leave.startDate)} – {dayLabel(leave.endDate)}
        </p>
      </div>
      {leave.status === "APPROVED" && (
        <p className="text-xs text-zinc-300">
          Revoking removes these dates from approved leave.{" "}
          {leave.isPaidLeave &&
            "Paid leave already included in a payroll calculation is locked."}
        </p>
      )}
      {error && <ErrorNote>{error}</ErrorNote>}
      <fieldset disabled={saving}>
        <Field label="Reason for revoking">
          <textarea
            name="reason"
            className={input}
            rows={3}
            maxLength={500}
            required
            data-initial-focus
          />
        </Field>
      </fieldset>
    </WorkforceFormDialog>
  );
}
