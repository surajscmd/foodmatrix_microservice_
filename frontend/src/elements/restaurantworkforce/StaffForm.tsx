import { useState, type FormEvent } from "react";
import { UserPlus, UserRoundPen } from "lucide-react";
import {
  attendanceError,
  createStaff,
  updateStaff,
  type PayType,
  type Staff,
} from "@/lib/hr-api";
import { ErrorNote, Field, input, primary } from "./shared";
import WorkforceFormDialog from "./WorkforceFormDialog";
import StaffPinField from "./StaffPinField";

export function PayFields({
  payType,
  onChange,
  currency,
}: {
  payType: PayType;
  onChange: (value: PayType) => void;
  currency: string;
}) {
  return (
    <>
      <Field label="Pay type">
        <select
          className={input}
          value={payType}
          onChange={(event) => onChange(event.target.value as PayType)}
        >
          <option value="HOURLY">Hourly</option>
          <option value="SALARY">Monthly salary</option>
        </select>
      </Field>
      <Field
        label={
          payType === "HOURLY"
            ? `Hourly rate (${currency})`
            : `Monthly salary (${currency})`
        }
      >
        <input
          key={payType}
          name="rate"
          className={input}
          required
          type="number"
          min="0"
          max={payType === "HOURLY" ? "999999.99" : "99999999.99"}
          step="0.01"
        />
      </Field>
      {payType === "HOURLY" && (
        <Field label={`Overtime rate (${currency}, optional)`}>
          <input
            name="overtime"
            className={input}
            type="number"
            min="0"
            max="999999.99"
            step="0.01"
            placeholder="Uses hourly rate if blank"
          />
        </Field>
      )}
    </>
  );
}

export function getPay(form: FormData, payType: PayType) {
  const rate = Number(form.get("rate"));
  const overtime = form.get("overtime");
  return payType === "HOURLY"
    ? {
        payType,
        hourlyWage: rate,
        overtimeRate: overtime ? Number(overtime) : undefined,
      }
    : { payType, salaryAmount: rate };
}

export default function StaffForm({
  employee,
  restaurantId,
  currency,
  onClose,
  onSave,
}: {
  employee?: Staff;
  restaurantId: string;
  currency: string;
  onClose: () => void;
  onSave: (staff: Staff, message: string) => void;
}) {
  const [payType, setPayType] = useState<PayType>("HOURLY");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const form = new FormData(event.currentTarget);
    const read = (key: string) => String(form.get(key) ?? "").trim();
    const fields = {
      firstName: read("firstName"),
      lastName: read("lastName"),
      employeeCode: read("employeeCode"),
      role: read("role"),
    };
    if (Object.values(fields).some((value) => !value)) {
      setError("Enter a name, employee code, and job role.");
      return;
    }
    const pin = read("pin");
    setSaving(true);
    setError("");
    try {
      const response = employee
        ? await updateStaff(employee.id, fields)
        : await createStaff({
            ...fields,
            restaurantId,
            pin,
            ...getPay(form, payType),
          });
      onSave(
        response.data,
        employee ? "Staff profile saved." : "Staff added with a starting wage.",
      );
    } catch (error) {
      setError(attendanceError(error, "Could not save the staff record."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkforceFormDialog
      title={employee ? "Edit staff profile" : "Add staff"}
      icon={employee ? UserRoundPen : UserPlus}
      saving={saving}
      onClose={onClose}
      onSubmit={submit}
      actions={
        <button type="submit" className={primary} disabled={saving}>
          {saving ? "Saving…" : employee ? "Save profile" : "Add staff"}
        </button>
      }
    >
      {error && <ErrorNote>{error}</ErrorNote>}
      <fieldset disabled={saving} className="grid gap-3 sm:grid-cols-2">
        <Field label="First name">
          <input
            className={input}
            name="firstName"
            data-initial-focus
            defaultValue={employee?.firstName}
            maxLength={100}
            required
          />
        </Field>
        <Field label="Last name">
          <input
            className={input}
            name="lastName"
            defaultValue={employee?.lastName}
            maxLength={100}
            required
          />
        </Field>
        <Field label="Employee code">
          <input
            className={input}
            name="employeeCode"
            defaultValue={employee?.employeeCode}
            maxLength={50}
            required
          />
        </Field>
        <Field label="Job role">
          <input
            className={input}
            name="role"
            defaultValue={employee?.role}
            placeholder="e.g. Line cook"
            maxLength={100}
            required
          />
        </Field>
        {!employee && <StaffPinField label="Staff PIN" />}
      </fieldset>
      {!employee && (
        <p className="text-xs text-zinc-400">
          Staff records and FoodMatrix login accounts are managed separately.
        </p>
      )}
      {!employee && (
        <fieldset
          disabled={saving}
          className="grid gap-3 border-t border-white/8 pt-3 sm:grid-cols-2"
        >
          <legend className="pr-2 text-xs font-semibold text-emerald-200">
            Starting wage
          </legend>
          <PayFields
            payType={payType}
            onChange={setPayType}
            currency={currency}
          />
        </fieldset>
      )}
    </WorkforceFormDialog>
  );
}
