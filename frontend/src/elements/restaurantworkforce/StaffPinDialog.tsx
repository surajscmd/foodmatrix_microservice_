import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { attendanceError, updateStaff, type Staff } from "@/lib/hr-api";
import { ErrorNote, primary } from "./shared";
import StaffPinField from "./StaffPinField";
import WorkforceFormDialog from "./WorkforceFormDialog";

export default function StaffPinDialog({
  employee,
  onClose,
  onSave,
}: {
  employee: Staff;
  onClose: () => void;
  onSave: (staff: Staff) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const pin = String(new FormData(event.currentTarget).get("pin") ?? "");
    setSaving(true);
    setError("");
    try {
      const { data } = await updateStaff(employee.id, { pin });
      onSave(data);
    } catch (error) {
      setError(attendanceError(error, "Could not reset the staff PIN."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkforceFormDialog
      title="Reset staff PIN"
      icon={KeyRound}
      saving={saving}
      onClose={onClose}
      onSubmit={submit}
      actions={
        <button type="submit" className={primary} disabled={saving}>
          {saving ? "Saving…" : "Save new PIN"}
        </button>
      }
    >
      <p className="text-xs text-zinc-300">
        Set a new PIN for {employee.firstName} {employee.lastName}. Saving
        replaces their current PIN.
      </p>
      {error && <ErrorNote>{error}</ErrorNote>}
      <fieldset disabled={saving}>
        <StaffPinField label="New PIN" initialFocus />
      </fieldset>
    </WorkforceFormDialog>
  );
}
