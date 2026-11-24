import { useCallback, useState } from "react";
import { ArrowRight, Banknote, FileText } from "lucide-react";
import { isAxiosError } from "axios";
import { getCurrentWage } from "@/lib/hr-api";
import { dayLabel, money, secondary, useWorkforceQuery } from "./shared";
import StaffDetailSection from "./StaffDetailSection";

export default function StaffPaySummary({
  staffId,
  currency,
  onOpen,
}: {
  staffId: string;
  currency: string;
  onOpen: (view: "wages" | "payslips") => void;
}) {
  const [revision, setRevision] = useState(0);
  const load = useCallback(async () => {
    try {
      return (await getCurrentWage(staffId)).data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) return null;
      throw error;
    }
  }, [staffId]);
  const {
    data: wage,
    loading,
    error,
  } = useWorkforceQuery(
    `${staffId}/${revision}`,
    load,
    "Could not load current pay.",
  );
  const salaried = wage?.payType === "SALARY";

  return (
    <StaffDetailSection title="Compensation & wages" icon={Banknote}>
      <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04] p-4">
        {loading && (
          <p role="status" className="mt-2 text-xs text-zinc-300">
            Loading pay…
          </p>
        )}
        {error && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p role="alert" className="text-xs text-rose-200">
              {error}
            </p>
            <button
              type="button"
              className={secondary}
              onClick={() => setRevision((value) => value + 1)}
            >
              Retry
            </button>
          </div>
        )}
        {wage && (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              {salaried ? "Current salary" : "Current hourly wage"}
            </p>
            <p className="mt-2 break-words font-mono text-xl font-semibold tracking-tight tabular-nums text-white">
              {money(salaried ? wage.salaryAmount : wage.hourlyWage, currency)}
              <span className="ml-1.5 text-xs font-normal text-zinc-300">
                {salaried ? "/ month" : "/ hour"}
              </span>
            </p>
            <p className="mt-3 text-[11px] text-zinc-500">
              Effective {dayLabel(wage.effectiveStartDate)}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-zinc-800 pt-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                  Pay type
                </p>
                <p className="mt-1 text-xs text-zinc-200">
                  {wage.payType.replaceAll("_", " ")}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                  Overtime rate
                </p>
                <p className="mt-1 text-xs text-zinc-200">
                  {money(wage.overtimeRate, currency)}
                </p>
              </div>
            </div>
          </>
        )}
        {wage === null && (
          <p className="mt-2 text-xs text-zinc-300">
            No wage is currently effective.
          </p>
        )}
      </div>
      <div className="mt-4 grid gap-2 @sm:grid-cols-2">
        <button
          type="button"
          className={secondary + " justify-between"}
          onClick={() => onOpen("wages")}
        >
          Wage history <ArrowRight size={14} aria-hidden />
        </button>
        <button
          type="button"
          className={secondary + " justify-between"}
          onClick={() => onOpen("payslips")}
        >
          View payslips <FileText size={14} aria-hidden />
        </button>
      </div>
    </StaffDetailSection>
  );
}
