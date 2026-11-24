import { useCallback, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  ChevronRight,
  Plus,
} from "lucide-react";
import {
  attendanceError,
  createPayrollRun,
  discardPayrollDraft,
  getPayrollRuns,
  savePayrollStep,
  type PayrollRun,
  type PayrollRunResponse,
} from "@/lib/hr-api";
import PayslipList from "./PayslipList";
import PayrollActionDialog, { type PayrollDialog } from "./PayrollActionDialog";
import {
  dayLabel,
  dayOffset,
  Empty,
  ErrorNote,
  Field,
  input,
  money,
  panel,
  primary,
  secondary,
  Status,
  useWorkforceQuery,
} from "./shared";

function runStatus(run: PayrollRun) {
  return run.status === "DRAFT" && run.payslips?.length
    ? "READY FOR REVIEW"
    : run.status;
}

export default function PayrollPanel({
  restaurantId,
  currency,
  today,
}: {
  restaurantId: string;
  currency: string;
  today: string;
}) {
  const [revision, setRevision] = useState(0);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<PayrollRun>();
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<PayrollDialog>();
  const [confirm, setConfirm] = useState<"approve" | "discard" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(
    async () => (await getPayrollRuns({ restaurantId })).data,
    [restaurantId],
  );
  const {
    data,
    loading,
    error: loadError,
  } = useWorkforceQuery(
    `${restaurantId}/${revision}`,
    load,
    "Unable to load payroll runs.",
  );

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const form = new FormData(event.currentTarget);
    const periodStartDate = String(form.get("start"));
    const periodEndDate = String(form.get("end"));
    if (periodStartDate > periodEndDate) {
      setError("Start date must be on or before the end date.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { data } = await createPayrollRun({
        restaurantId,
        periodStartDate,
        periodEndDate,
      });
      setCreating(false);
      setSelected(data);
      setRevision((value) => value + 1);
      setNotice("Payroll draft created.");
    } catch (error) {
      setError(attendanceError(error, "Unable to create the payroll run."));
    } finally {
      setSaving(false);
    }
  }

  function applyResult({ data, message }: PayrollRunResponse) {
    setSelected(data);
    setNotice(message);
    setError("");
    setDialog(undefined);
    setRevision((value) => value + 1);
  }

  async function advance(action: "process" | "approve" | "discard") {
    if (!selected || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (action === "discard") {
        const { message } = await discardPayrollDraft(selected.id);
        setSelected(undefined);
        setNotice(message);
      } else {
        applyResult(
          await savePayrollStep(selected.id, action, selected.updatedAt),
        );
      }
      setConfirm(null);
      if (action === "discard") setRevision((value) => value + 1);
    } catch (error) {
      setError(
        attendanceError(
          error,
          "Unable to update payroll. Reopen the run to refresh its status.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  if (selected) {
    const hasPayslips = Boolean(selected.payslips?.length);
    return (
      <div className="space-y-3">
        <button
          className={secondary}
          disabled={saving}
          onClick={() => {
            setSelected(undefined);
            setConfirm(null);
            setError("");
            setNotice("");
            setRevision((n) => n + 1);
          }}
        >
          <ArrowLeft size={14} /> Payroll runs
        </button>
        <section className={panel}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 bg-linear-to-r from-sky-500/12 to-transparent px-4 py-3">
            <div>
              <p className="flex items-center gap-1.5 text-xs text-sky-200">
                <CalendarDays size={14} /> Pay period
              </p>
              <h2 className="mt-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
                {dayLabel(selected.periodStartDate)} –{" "}
                {dayLabel(selected.periodEndDate)}
              </h2>
            </div>
            <Status value={runStatus(selected)} />
          </div>
          <div className="grid grid-cols-2 gap-2 p-4 @lg:grid-cols-4">
            {[
              ["Payslips", selected.payslips?.length ?? 0, "text-zinc-100"],
              [
                "Gross pay",
                money(selected.totalGrossPay, currency),
                "text-sky-200",
              ],
              [
                "Deductions",
                money(
                  Number(selected.totalGrossPay) - Number(selected.totalNetPay),
                  currency,
                ),
                "text-zinc-100",
              ],
              [
                "Net pay",
                money(selected.totalNetPay, currency),
                "text-emerald-200",
              ],
            ].map(([label, value, color]) => (
              <div
                key={label}
                className="rounded-xl border border-zinc-800/80 bg-black/20 px-3 py-2"
              >
                <p className="text-[11px] text-zinc-400">{label}</p>
                <p
                  className={`mt-1 break-words text-sm font-semibold tabular-nums ${color}`}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
          {selected.status !== "PAID" && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/80 px-4 py-3">
              <p className="text-xs text-zinc-400">
                {confirm === "approve"
                  ? "Confirm that you reviewed the payslips for this run."
                  : confirm === "discard"
                    ? "Discard this draft and free up its pay period?"
                    : selected.status === "APPROVED"
                      ? "Record payment once staff have been paid."
                      : hasPayslips
                        ? "Review each payslip before approving."
                        : "Calculate pay from wages, closed shifts, and approved paid leave."}
              </p>
              {confirm ? (
                <div className="flex gap-2">
                  <button
                    className={secondary}
                    disabled={saving}
                    onClick={() => setConfirm(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className={primary}
                    disabled={saving}
                    onClick={() => advance(confirm)}
                  >
                    {saving
                      ? "Saving…"
                      : confirm === "discard"
                        ? "Confirm discard"
                        : "Confirm approval"}
                  </button>
                </div>
              ) : selected.status === "APPROVED" ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={secondary}
                    aria-haspopup="dialog"
                    onClick={() => setDialog({ kind: "reopen" })}
                  >
                    Reopen payroll
                  </button>
                  <button
                    type="button"
                    className={primary}
                    aria-haspopup="dialog"
                    onClick={() => setDialog({ kind: "pay" })}
                  >
                    Record payment
                  </button>
                </div>
              ) : hasPayslips ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={secondary}
                    aria-haspopup="dialog"
                    onClick={() => setDialog({ kind: "reopen" })}
                  >
                    Reopen payroll
                  </button>
                  <button
                    className={primary}
                    onClick={() => setConfirm("approve")}
                  >
                    Approve payroll
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    className={secondary}
                    disabled={saving}
                    onClick={() => setConfirm("discard")}
                  >
                    Discard draft
                  </button>
                  <button
                    className={primary}
                    disabled={saving}
                    onClick={() => advance("process")}
                  >
                    {saving ? "Calculating…" : "Calculate payroll"}
                  </button>
                </div>
              )}
            </div>
          )}
          {selected.paidAt && (
            <p className="border-t border-zinc-800/80 px-4 py-3 text-xs text-zinc-300">
              Recorded {dayLabel(selected.paidAt)} · Reference{" "}
              <span className="break-all">{selected.paymentReference}</span>
            </p>
          )}
          {selected.reopenReason && (
            <p className="border-t border-zinc-800/80 px-4 py-3 text-xs text-zinc-300">
              Last correction: {selected.reopenReason}
            </p>
          )}
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
        {hasPayslips && (
          <PayslipList
            key={`${selected.id}/${selected.updatedAt}`}
            payrollRunId={selected.id}
            currency={currency}
            onEditDeductions={
              selected.status === "DRAFT" && !saving && !confirm
                ? (slip) => setDialog({ kind: "deductions", slip })
                : undefined
            }
          />
        )}
        {dialog && (
          <PayrollActionDialog
            run={selected}
            dialog={dialog}
            currency={currency}
            onClose={() => setDialog(undefined)}
            onSaved={applyResult}
          />
        )}
      </div>
    );
  }

  return (
    <section className={panel} aria-label="Payroll runs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-sky-400/12 text-sky-300">
            <Banknote size={17} />
          </span>
          <div>
            <h2 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
              Payroll runs
            </h2>
            <p className="text-xs text-zinc-400">
              {data
                ? `${data.length} recorded runs`
                : "Payroll for this restaurant"}
            </p>
          </div>
        </div>
        {!creating && (
          <button
            className={primary}
            onClick={() => {
              setCreating(true);
              setError("");
            }}
          >
            <Plus size={14} /> New payroll run
          </button>
        )}
      </div>
      {creating && (
        <form
          className="space-y-3 border-b border-sky-400/15 bg-sky-400/5 p-4"
          onSubmit={create}
        >
          <h3 className="text-xs font-semibold text-sky-100">
            Choose a completed pay period
          </h3>
          {error && <ErrorNote>{error}</ErrorNote>}
          <fieldset disabled={saving} className="grid gap-2 @lg:grid-cols-2">
            <Field label="Start date">
              <input
                type="date"
                className={input}
                max={dayOffset(today, -1)}
                name="start"
                required
              />
            </Field>
            <Field label="End date">
              <input
                type="date"
                className={input}
                max={dayOffset(today, -1)}
                name="end"
                required
              />
            </Field>
          </fieldset>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={secondary}
              disabled={saving}
              onClick={() => setCreating(false)}
            >
              Cancel
            </button>
            <button className={primary} disabled={saving}>
              {saving ? "Creating…" : "Create draft"}
            </button>
          </div>
        </form>
      )}
      {loading && <Empty>Loading payroll runs…</Empty>}
      {notice && (
        <p role="status" className="px-4 pt-3 text-xs text-emerald-200">
          {notice}
        </p>
      )}
      {loadError && (
        <div className="flex items-center gap-2 p-4">
          <ErrorNote>{loadError}</ErrorNote>
          <button
            className={secondary}
            onClick={() => setRevision((n) => n + 1)}
          >
            Retry
          </button>
        </div>
      )}
      {data?.length === 0 && <Empty>No payroll runs yet.</Empty>}
      <ul className="divide-y divide-zinc-800/80">
        {data?.map((run) => (
          <li key={run.id}>
            <button
              className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left enabled:hover:bg-sky-300/5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-300 disabled:opacity-60"
              disabled={creating}
              onClick={() => {
                setSelected(run);
                setNotice("");
                setError("");
              }}
            >
              <span>
                <span className="block text-xs font-semibold text-white">
                  {dayLabel(run.periodStartDate)} –{" "}
                  {dayLabel(run.periodEndDate)}
                </span>
                <span className="text-[11px] tabular-nums text-zinc-400">
                  {run.payslips?.length ?? 0} payslips ·{" "}
                  {money(run.totalNetPay, currency)} net
                </span>
              </span>
              <span className="flex items-center gap-2">
                <Status value={runStatus(run)} />
                <ChevronRight size={15} className="text-zinc-500" aria-hidden />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
