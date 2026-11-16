import { useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { KeyRound } from "lucide-react";
import { changeOrganizationPassword } from "@/lib/organization-api";
import WorkforceFormDialog from "@/elements/restaurantworkforce/WorkforceFormDialog";
import {
  ErrorNote,
  Field,
  input,
  primary,
  secondary,
} from "@/elements/restaurantworkforce/shared";
import SettingsSection from "./SettingsSection";

export default function AccountSecuritySection() {
  const [open, setOpen] = useState(false);
  const [changed, setChanged] = useState(false);

  return (
    <SettingsSection
      title="Account security"
      description="Manage the password you use to sign in."
      icon={KeyRound}
    >
      <button
        type="button"
        aria-haspopup="dialog"
        className={secondary}
        onClick={() => {
          setChanged(false);
          setOpen(true);
        }}
      >
        Change password
      </button>
      {changed && (
        <p role="status" className="text-xs text-emerald-300">
          Password updated. Other sessions have been signed out.
        </p>
      )}
      {open && (
        <ChangePasswordDialog
          onClose={() => setOpen(false)}
          onSaved={() => {
            setChanged(true);
            setOpen(false);
          }}
        />
      )}
    </SettingsSection>
  );
}

function ChangePasswordDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError("");
    if (password !== confirm) {
      setError("The new passwords must match.");
      return;
    }
    setSaving(true);
    try {
      await changeOrganizationPassword(current, password);
      onSaved();
    } catch (error) {
      const message: unknown = isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      setError(
        typeof message === "string"
          ? message
          : "Unable to change your password.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkforceFormDialog
      title="Change password"
      icon={KeyRound}
      saving={saving}
      onClose={onClose}
      onSubmit={submit}
      actions={
        <button type="submit" className={primary} disabled={saving}>
          {saving ? "Saving…" : "Change password"}
        </button>
      }
    >
      <fieldset disabled={saving} className="space-y-3">
        <Field label="Current password">
          <input
            className={input}
            type="password"
            autoComplete="current-password"
            data-initial-focus
            required
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
          />
        </Field>
        <Field label="New password">
          <input
            className={input}
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <Field label="Confirm new password">
          <input
            className={input}
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </Field>
      </fieldset>
      {error && <ErrorNote>{error}</ErrorNote>}
    </WorkforceFormDialog>
  );
}
