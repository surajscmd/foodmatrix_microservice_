import { useCallback, useState } from "react";
import { Download, FileText } from "lucide-react";
import { downloadPayslip, getPayslips, type Payslip } from "@/lib/hr-api";
import {
  dayLabel,
  Empty,
  ErrorNote,
  money,
  panel,
  secondary,
  Status,
  useWorkforceQuery,
} from "./shared";

export default function PayslipList({
  staffId,
  payrollRunId,
  currency,
  onEditDeductions,
}: {
  staffId?: string;
  payrollRunId?: string;
  currency: string;
  onEditDeductions?: (slip: Payslip) => void;
}) {
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(
    async () => (await getPayslips({ staffId, payrollRunId })).data,
    [staffId, payrollRunId],
  );
  const {
    data,
    loading,
    error: loadError,
  } = useWorkforceQuery(
    `${staffId}/${payrollRunId}/${revision}`,
    load,
    "Unable to load payslips.",
  );
  const [expanded, setExpanded] = useState("");

  async function download(slip: Payslip) {
    setBusy(slip.id);
    setError("");
    try {
      await downloadPayslip(slip.id);
    } catch {
      setError("The PDF could not be downloaded. Try again.");
    } finally {
      setBusy("");
    }
  }

  return (
    <section className={panel} aria-label="Payslips">
      <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
        <FileText size={16} className="text-sky-300" />
        <h3 className="text-sm font-semibold text-white">Payslips</h3>
        {data && <span className="text-xs text-zinc-400">{data.length}</span>}
      </div>
      {(error || loadError) && (
        <div className="flex items-center gap-2 p-3">
          <ErrorNote>{error || loadError}</ErrorNote>
          {loadError && (
            <button
              className={secondary}
              onClick={() => setRevision((value) => value + 1)}
            >
              Retry
            </button>
          )}
        </div>
      )}
      {loading && <Empty>Loading payslips…</Empty>}
      {data?.length === 0 && <Empty>No payslips are available yet.</Empty>}
      <ul className="divide-y divide-white/8">
        {data?.map((slip) => {
          const open = expanded === slip.id;
          const title =
            staffId && slip.payrollRun
              ? `${dayLabel(slip.payrollRun.periodStartDate)} – ${dayLabel(slip.payrollRun.periodEndDate)}`
              : slip.staff
                ? `${slip.staff.firstName} ${slip.staff.lastName}`
                : "Employee payslip";
          return (
            <li key={slip.id} className="space-y-2 px-4 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <button
                    type="button"
                    className="text-left text-xs font-semibold text-white hover:text-emerald-200 hover:underline"
                    aria-expanded={open}
                    onClick={() => setExpanded(open ? "" : slip.id)}
                  >
                    {title}
                  </button>
                  <p className="text-[11px] tabular-nums text-zinc-400">
                    Net pay {money(slip.netPay, currency)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Status value={slip.status} />
                  {onEditDeductions && slip.status === "DRAFT" && (
                    <button
                      type="button"
                      className={secondary}
                      aria-haspopup="dialog"
                      onClick={() => onEditDeductions(slip)}
                    >
                      Edit deductions
                    </button>
                  )}
                  <button
                    className={secondary}
                    title="Download payslip PDF"
                    aria-label={`Download PDF for ${title}`}
                    onClick={() => download(slip)}
                    disabled={Boolean(busy)}
                  >
                    <Download size={14} />
                    {busy === slip.id ? "Downloading…" : "PDF"}
                  </button>
                </div>
              </div>
              {open && (
                <dl className="grid grid-cols-2 gap-2 rounded-lg border border-white/8 bg-zinc-950/60 p-3 text-xs @lg:grid-cols-4">
                  {[
                    ["Regular hours", slip.regularHours],
                    ["Overtime hours", slip.overtimeHours],
                    ["Paid leave hours", slip.paidLeaveHours],
                    ["Regular pay", money(slip.regularPay, currency)],
                    ["Overtime pay", money(slip.overtimePay, currency)],
                    ["Gross pay", money(slip.grossPay, currency)],
                    ["Tax deductions", money(slip.taxDeductions, currency)],
                    ["Other deductions", money(slip.otherDeductions, currency)],
                    ["Net pay", money(slip.netPay, currency)],
                    ...(slip.status === "PAID"
                      ? [
                          [
                            "Payment method",
                            slip.paymentMethod
                              .replaceAll("_", " ")
                              .toLowerCase(),
                          ],
                        ]
                      : []),
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-zinc-400">{label}</dt>
                      <dd className="font-medium tabular-nums text-zinc-100">
                        {value ?? "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
