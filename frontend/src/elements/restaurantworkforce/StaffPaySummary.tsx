import { useCallback, useState } from "react";
import { ArrowRight, Banknote, FileText } from "lucide-react";
import { isAxiosError } from "axios";
import { getCurrentWage } from "@/lib/hr-api";
import { dayLabel, money, panel, secondary, useWorkforceQuery } from "./shared";

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
    <section className={panel}>
      <div className="bg-linear-to-br from-emerald-400/10 to-transparent px-4 py-3">
        <h3 className="flex items-center gap-2 text-xs font-medium text-emerald-200">
          <Banknote size={15} aria-hidden /> Current pay
        </h3>
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
            <p className="mt-1.5 break-words text-lg font-semibold tabular-nums text-white">
              {money(salaried ? wage.salaryAmount : wage.hourlyWage, currency)}
              <span className="ml-1.5 text-xs font-normal text-zinc-300">
                {salaried ? "/ month" : "/ hour"}
              </span>
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">
              Effective {dayLabel(wage.effectiveStartDate)}
            </p>
          </>
        )}
        {wage === null && (
          <p className="mt-2 text-xs text-zinc-300">
            No wage is currently effective.
          </p>
        )}
      </div>
      <div className="grid gap-2 border-t border-white/8 px-4 py-3 @sm:grid-cols-2 @4xl:grid-cols-1">
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
    </section>
  );
}
