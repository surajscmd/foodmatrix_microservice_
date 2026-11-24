import { Fragment, useCallback, useId, useState } from "react";
import { ChevronDown, Download, FileText, Loader2 } from "lucide-react";
import { downloadPayslip, getPayslips, type Payslip } from "@/lib/hr-api";
import { dayLabel, Empty, ErrorNote, money, useWorkforceQuery } from "./shared";

import WorkforceTableStatus from "./WorkforceTableStatus";

const secondary =
  "inline-flex min-h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 text-[11px] font-medium text-zinc-400 transition-colors hover:border-emerald-500/30 hover:bg-zinc-900 hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-50";

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
  const detailsPrefix = useId();

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
    <section
      className="@container min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70"
      aria-label="Payslips"
    >
      <div className="flex items-center gap-3 border-b border-emerald-400/15 bg-linear-to-r from-emerald-500/15 via-emerald-500/5 to-zinc-950 px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-400">
          <FileText size={17} aria-hidden />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
              Payslips
            </h3>
            {data && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                {data.length} {data.length === 1 ? "record" : "records"}
              </span>
            )}
          </div>
          <p className="mt-1 text-[10px] text-zinc-500">
            View pay breakdowns and download payslip PDFs
          </p>
        </div>
      </div>
      {(error || loadError) && (
        <div className="flex flex-wrap items-center gap-2 p-3">
          <ErrorNote>{error || loadError}</ErrorNote>
          {loadError && (
            <button
              type="button"
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
      {Boolean(data?.length) && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <caption className="sr-only">
              Employee payslips and pay breakdowns
            </caption>
            <thead className="border-b border-zinc-800 bg-zinc-950/80 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-600">
              <tr>
                <th scope="col" className="px-5 py-3">
                  {staffId ? "Pay period" : "Employee"}
                </th>
                <th scope="col" className="px-3 py-3 text-right">
                  Net pay
                </th>
                <th scope="col" className="px-3 py-3">
                  Status
                </th>
                <th scope="col" className="px-5 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {data?.map((slip) => {
                const open = expanded === slip.id;
                const title =
                  staffId && slip.payrollRun
                    ? `${dayLabel(slip.payrollRun.periodStartDate)} – ${dayLabel(slip.payrollRun.periodEndDate)}`
                    : slip.staff
                      ? `${slip.staff.firstName} ${slip.staff.lastName}`
                      : "Employee payslip";
                const detailsId = `${detailsPrefix}-${slip.id}`;
                return (
                  <Fragment key={slip.id}>
                    <tr className="group transition-colors duration-200 hover:bg-zinc-900/80 focus-within:bg-zinc-900/80">
                      <th scope="row" className="px-5 py-4 font-normal">
                        <div className="flex min-w-44 items-center gap-3">
                          <span
                            aria-hidden
                            className="grid size-10 shrink-0 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-[11px] font-semibold uppercase text-emerald-400 transition-colors group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10"
                          >
                            {!staffId && slip.staff ? (
                              <>
                                {slip.staff.firstName[0]}
                                {slip.staff.lastName[0]}
                              </>
                            ) : (
                              <FileText size={17} />
                            )}
                          </span>
                          <div className="min-w-0">
                            <button
                              type="button"
                              className="flex items-center gap-1.5 rounded text-left text-sm font-medium leading-5 text-zinc-100 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-300"
                              aria-expanded={open}
                              aria-controls={detailsId}
                              onClick={() => setExpanded(open ? "" : slip.id)}
                            >
                              {title}
                              <ChevronDown
                                size={13}
                                aria-hidden
                                className={`shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
                              />
                            </button>
                            <p className="mt-1 text-[10px] text-zinc-500">
                              {open
                                ? "Hide pay breakdown"
                                : "View pay breakdown"}
                            </p>
                          </div>
                        </div>
                      </th>
                      <td className="whitespace-nowrap px-3 py-4 text-right font-mono text-[13px] font-semibold tabular-nums text-zinc-200">
                        {money(slip.netPay, currency)}
                      </td>
                      <td className="px-3 py-4">
                        <WorkforceTableStatus value={slip.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center justify-end gap-2">
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
                            type="button"
                            className={secondary}
                            title="Download payslip PDF"
                            aria-label={`Download PDF for ${title}`}
                            onClick={() => void download(slip)}
                            disabled={Boolean(busy)}
                          >
                            {busy === slip.id ? (
                              <Loader2
                                size={14}
                                aria-hidden
                                className="motion-safe:animate-spin"
                              />
                            ) : (
                              <Download size={14} aria-hidden />
                            )}
                            {busy === slip.id ? "Downloading…" : "PDF"}
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr id={detailsId} hidden={!open}>
                      <td colSpan={4} className="bg-zinc-950/60 px-5 py-4">
                        {open && (
                          <dl className="grid grid-cols-2 gap-x-5 gap-y-4 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 @lg:grid-cols-3 @3xl:grid-cols-4">
                            {[
                              ["Regular hours", slip.regularHours],
                              ["Overtime hours", slip.overtimeHours],
                              ["Paid leave hours", slip.paidLeaveHours],
                              ["Regular pay", money(slip.regularPay, currency)],
                              [
                                "Overtime pay",
                                money(slip.overtimePay, currency),
                              ],
                              ["Gross pay", money(slip.grossPay, currency)],
                              [
                                "Tax deductions",
                                money(slip.taxDeductions, currency),
                              ],
                              [
                                "Other deductions",
                                money(slip.otherDeductions, currency),
                              ],
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
                                <dt className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                                  {label}
                                </dt>
                                <dd className="mt-1.5 text-xs font-medium tabular-nums text-zinc-200">
                                  {value ?? "—"}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        )}
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
