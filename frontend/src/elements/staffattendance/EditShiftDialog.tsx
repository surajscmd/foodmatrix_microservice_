import { useState, type FormEvent } from "react";
import { CalendarClock } from "lucide-react";
import {
  attendanceError,
  deleteShiftSchedule,
  updateShiftSchedule,
  type ShiftSchedule,
} from "@/lib/hr-api";
import WorkforceFormDialog from "@/elements/restaurantworkforce/WorkforceFormDialog";
import {
  ErrorNote,
  Field,
  input,
  primary,
  secondary,
} from "@/elements/restaurantworkforce/shared";
import { restaurantDateTime } from "./report-dates";

export default function EditShiftDialog({
  shift,
  timeZone,
  onClose,
  onSaved,
}: {
  shift: ShiftSchedule;
  timeZone: string;
  onClose: () => void;
  onSaved: (message: string, date?: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const local = (value: string) =>
    formatter.format(new Date(value)).replace(" ", "T");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const start = String(data.get("start"));
    const end = String(data.get("end"));
    const scheduledStart = removing
      ? null
      : restaurantDateTime(start, timeZone);
    const scheduledEnd = removing ? null : restaurantDateTime(end, timeZone);
    if (
      !removing &&
      (!scheduledStart || !scheduledEnd || scheduledEnd <= scheduledStart)
    ) {
      setError("Choose valid local times with the end after the start.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (removing) {
        const { message } = await deleteShiftSchedule(shift.id);
        onSaved(message);
      } else if (scheduledStart && scheduledEnd) {
        const { message } = await updateShiftSchedule(shift.id, {
          scheduledStart,
          scheduledEnd,
        });
        onSaved(message, start.slice(0, 10));
      }
    } catch (error) {
      setError(attendanceError(error, "Unable to save the shift change."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <WorkforceFormDialog
      title={removing ? "Remove scheduled shift" : "Edit scheduled shift"}
      icon={CalendarClock}
      saving={busy}
      onClose={onClose}
      onSubmit={submit}
      actions={
        <>
          <button
            type="button"
            className={secondary}
            disabled={busy}
            onClick={() => {
              setRemoving(!removing);
              setError("");
            }}
          >
            {removing ? "Keep shift" : "Remove shift"}
          </button>
          <button type="submit" className={primary} disabled={busy}>
            {busy ? "Saving…" : removing ? "Confirm removal" : "Save shift"}
          </button>
        </>
      }
    >
      <p className="text-xs text-zinc-300">
        {shift.staff.firstName} {shift.staff.lastName} ·{" "}
        {shift.shiftTemplate?.name ?? shift.staff.role}
      </p>
      {error && <ErrorNote>{error}</ErrorNote>}
      <fieldset
        hidden={removing}
        disabled={busy || removing}
        className={removing ? "hidden" : "grid gap-3 sm:grid-cols-2"}
      >
        <Field label="Starts">
          <input
            name="start"
            type="datetime-local"
            className={input}
            defaultValue={local(shift.scheduledStart)}
            required
            data-initial-focus
          />
        </Field>
        <Field label="Ends">
          <input
            name="end"
            type="datetime-local"
            className={input}
            defaultValue={local(shift.scheduledEnd)}
            required
          />
        </Field>
      </fieldset>
      {removing && (
        <p className="text-xs text-amber-200">
          Remove this assignment from the roster?
        </p>
      )}
    </WorkforceFormDialog>
  );
}
