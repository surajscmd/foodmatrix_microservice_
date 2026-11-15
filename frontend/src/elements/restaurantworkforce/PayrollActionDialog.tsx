import { useState, type FormEvent } from "react";
import { Banknote, RotateCcw } from "lucide-react";
import {
  attendanceError,
  recordPayrollPayment,
  reopenPayroll,
  savePayrollDeductions,
  type PayrollPaymentMethod,
  type PayrollRun,
  type PayrollRunResponse,
  type Payslip,
} from "@/lib/hr-api";
import WorkforceFormDialog from "./WorkforceFormDialog";
import { ErrorNote, Field, input, money, primary } from "./shared";

export type PayrollDialog =
  { kind: "pay" } | { kind: "reopen" } | { kind: "deductions"; slip: Payslip };

export default function PayrollActionDialog({
  run,
  dialog,
  currency,
  onClose,
  onSaved,
}: {
  run: PayrollRun;
  dialog: PayrollDialog;
  currency: string;
  onClose: () => void;
  onSaved: (response: PayrollRunResponse) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const title =
    dialog.kind === "pay"
      ? "Record external payment"
      : dialog.kind === "reopen"
        ? "Reopen payroll"
        : "Edit deductions";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const form = new FormData(event.currentTarget);
    const read = (key: string) => String(form.get(key) ?? "").trim();
    const requiredText =
      dialog.kind === "pay"
        ? read("reference")
        : dialog.kind === "reopen"
          ? read("reason")
          : null;
    if (requiredText === "") {
      setError(
        dialog.kind === "pay"
          ? "Enter the payment reference."
          : "Enter a correction reason.",
      );
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response =
        dialog.kind === "pay"
          ? await recordPayrollPayment(
              run,
              read("method") as PayrollPaymentMethod,
              read("reference"),
            )
          : dialog.kind === "reopen"
            ? await reopenPayroll(run, read("reason"))
            : await savePayrollDeductions(
                run,
                dialog.slip.id,
                Number(read("tax")),
                Number(read("other")),
              );
      onSaved(response);
    } catch (error) {
      setError(attendanceError(error, "Could not save the payroll change."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkforceFormDialog
      title={title}
      icon={dialog.kind === "reopen" ? RotateCcw : Banknote}
      saving={saving}
      onClose={onClose}
      onSubmit={submit}
      actions={
        <button type="submit" className={primary} disabled={saving}>
          {saving
            ? "Saving…"
            : dialog.kind === "deductions"
              ? "Save deductions"
              : title}
        </button>
      }
    >
      {error && <ErrorNote>{error}</ErrorNote>}
      <fieldset disabled={saving} className="space-y-3">
        {dialog.kind === "pay" && (
          <>
            <p className="text-xs text-zinc-300">
              Confirm the full net amount of {money(run.totalNetPay, currency)}{" "}
              has already been paid. This records one payment method for the
              run.
            </p>
            <Field label="Payment method">
              <select
                name="method"
                className={input}
                data-initial-focus
                required
              >
                <option value="DIRECT_DEPOSIT">Bank transfer</option>
                <option value="CASH">Cash</option>
                <option value="CHECK">Cheque</option>
              </select>
            </Field>
            <Field label="Payment or receipt reference">
              <input
                name="reference"
                className={input}
                maxLength={150}
                required
              />
            </Field>
            <label className="flex items-center gap-2 text-xs text-zinc-200">
              <input type="checkbox" required className="accent-emerald-300" />{" "}
              Staff have been paid in full.
            </label>
          </>
        )}
        {dialog.kind === "reopen" && (
          <>
            <p className="text-xs text-zinc-300">
              Reopening clears calculated payslips and their deductions. Correct
              the source records, then calculate and review payroll again.
            </p>
            <Field label="Reason for reopening">
              <textarea
                name="reason"
                rows={3}
                className={input}
                maxLength={500}
                required
                data-initial-focus
              />
            </Field>
          </>
        )}
        {dialog.kind === "deductions" && (
          <>
            <p className="text-xs text-zinc-300">
              {dialog.slip.staff &&
                `${dialog.slip.staff.firstName} ${dialog.slip.staff.lastName} · `}
              Gross pay {money(dialog.slip.grossPay, currency)}. Enter the
              amounts from your payroll calculation.
            </p>
            <Field label={`Tax deductions (${currency})`}>
              <input
                name="tax"
                type="number"
                min={0}
                step="0.01"
                className={input}
                defaultValue={dialog.slip.taxDeductions ?? 0}
                required
                data-initial-focus
              />
            </Field>
            <Field label={`Other deductions (${currency})`}>
              <input
                name="other"
                type="number"
                min={0}
                step="0.01"
                className={input}
                defaultValue={dialog.slip.otherDeductions ?? 0}
                required
              />
            </Field>
          </>
        )}
      </fieldset>
    </WorkforceFormDialog>
  );
}
