import { useCallback, useState, type FormEvent } from "react";
import { Banknote, CalendarClock, Plus } from "lucide-react";
import { isAxiosError } from "axios";
import {
  attendanceError,
  cancelWageChange,
  getCurrentWage,
  getWages,
  scheduleWageChange,
  type PayType,
  type Staff,
  type WageHistory,
} from "@/lib/hr-api";
import { getPay, PayFields } from "./StaffForm";
import WorkforceFormDialog from "./WorkforceFormDialog";
import {
  dayLabel,
  dayOffset,
  Empty,
  ErrorNote,
  Field,
  input,
  money,
  Pagination,
  primary,
  secondary,
  Status,
  useWorkforceQuery,
} from "./shared";

function wageLabel(wage: WageHistory, currency: string) {
  return wage.payType === "SALARY"
    ? `${money(wage.salaryAmount, currency)} / month`
    : `${money(wage.hourlyWage, currency)} / hour`;
}

export default function WagePanel({
  employee,
  currency,
  today,
}: {
  employee: Staff;
  currency: string;
  today: string;
}) {
  const [revision, setRevision] = useState(0);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [payType, setPayType] = useState<PayType>("HOURLY");
  const [saving, setSaving] = useState(false);
  const [cancelId, setCancelId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    const [history, current] = await Promise.all([
      getWages(employee.id, page, 10),
      getCurrentWage(employee.id)
        .then(({ data }) => data)
        .catch((error: unknown) => {
          if (isAxiosError(error) && error.response?.status === 404)
            return null;
          throw error;
        }),
    ]);
    return { ...history.data, current };
  }, [employee.id, page]);
  const {
    data,
    loading,
    error: loadError,
  } = useWorkforceQuery(
    `${employee.id}/${revision}/${page}`,
    load,
    "Unable to load wages.",
  );
  const tomorrow = dayOffset(today, 1);

  function closeForm() {
    setOpen(false);
    setError("");
  }

  async function schedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const form = new FormData(event.currentTarget);
    setError("");
    setNotice("");
    setSaving(true);
    try {
      await scheduleWageChange({
        staffId: employee.id,
        ...getPay(form, payType),
        effectiveStartDate: String(form.get("effective")),
      });
      setOpen(false);
      setNotice("Wage change scheduled.");
      setPage(1);
      setRevision((value) => value + 1);
    } catch (error) {
      setError(attendanceError(error, "Unable to schedule the wage change."));
    } finally {
      setSaving(false);
    }
  }

  async function cancel() {
    const id = cancelId;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await cancelWageChange(id);
      setCancelId("");
      setNotice("Scheduled change cancelled.");
      setRevision((value) => value + 1);
    } catch (error) {
      setError(attendanceError(error, "Unable to cancel the wage change."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-400/15 bg-linear-to-r from-emerald-500/15 via-emerald-500/5 to-zinc-950 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-400">
            <Banknote size={17} aria-hidden />
          </span>
          <div>
            <h2 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
              Wage history
            </h2>
            <p className="mt-1 text-[10px] text-zinc-500">
              {data?.current
                ? `Current pay · ${wageLabel(data.current, currency)}`
                : "Current and scheduled rates"}
            </p>
          </div>
        </div>
        {employee.status !== "TERMINATED" && (
          <button
            className={primary}
            aria-haspopup="dialog"
            onClick={() => {
              setPayType(data?.current?.payType ?? "HOURLY");
              setOpen(true);
              setCancelId("");
              setError("");
            }}
            disabled={saving}
          >
            <Plus size={14} /> Change wage
          </button>
        )}
      </div>
      {notice && (
        <p role="status" className="px-4 pt-3 text-xs text-emerald-200">
          {notice}
        </p>
      )}
      {((!open && error) || loadError) && (
        <div className="flex items-center gap-2 px-4 pt-3">
          <ErrorNote>{(!open && error) || loadError}</ErrorNote>
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
      {open && (
        <WorkforceFormDialog
          title="Change wage"
          icon={CalendarClock}
          saving={saving}
          onClose={closeForm}
          onSubmit={schedule}
          actions={
            <button type="submit" className={primary} disabled={saving}>
              {saving ? "Saving…" : "Schedule change"}
            </button>
          }
        >
          <p className="text-xs text-zinc-300">
            {employee.firstName} {employee.lastName} · {employee.employeeCode}
          </p>
          {error && <ErrorNote>{error}</ErrorNote>}
          <fieldset disabled={saving} className="grid gap-3 sm:grid-cols-2">
            <Field label="Effective date">
              <input
                className={input}
                type="date"
                name="effective"
                data-initial-focus
                min={tomorrow}
                defaultValue={tomorrow}
                required
              />
            </Field>
            <PayFields
              payType={payType}
              onChange={setPayType}
              currency={currency}
            />
          </fieldset>
          <p className="text-xs text-zinc-400">
            The new rate starts on the selected date. The previous rate stays in
            the history.
          </p>
        </WorkforceFormDialog>
      )}
      {loading && <Empty>Loading wages…</Empty>}
      {data?.data.length === 0 && <Empty>No wage records yet.</Empty>}
      <ul className="divide-y divide-zinc-800/80">
        {data?.data.map((wage, index) => {
          const start = wage.effectiveStartDate.slice(0, 10);
          const upcoming = start > today;
          const value = upcoming
            ? "UPCOMING"
            : wage.id === data.current?.id
              ? "CURRENT"
              : "HISTORICAL";
          const canCancel =
            upcoming && page === 1 && index === 0 && !wage.effectiveEndDate;
          return (
            <li
              key={wage.id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
            >
              <div>
                <p className="text-xs font-semibold tabular-nums text-white">
                  {wageLabel(wage, currency)}
                  {wage.overtimeRate != null && (
                    <span className="ml-2 font-normal text-zinc-400">
                      Overtime {money(wage.overtimeRate, currency)}/hr
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-400">
                  {dayLabel(start)}{" "}
                  {wage.effectiveEndDate
                    ? `– ${dayLabel(wage.effectiveEndDate)}`
                    : "onward"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Status value={value} />
                {canCancel &&
                  !open &&
                  (cancelId === wage.id ? (
                    <>
                      <button
                        className={secondary}
                        onClick={() => setCancelId("")}
                        disabled={saving}
                      >
                        Keep rate
                      </button>
                      <button
                        className={secondary + " text-rose-200"}
                        onClick={cancel}
                        disabled={saving}
                      >
                        Confirm cancellation
                      </button>
                    </>
                  ) : (
                    <button
                      className={secondary}
                      onClick={() => setCancelId(wage.id)}
                    >
                      Cancel change
                    </button>
                  ))}
              </div>
            </li>
          );
        })}
      </ul>
      {data && (
        <Pagination
          page={page}
          pages={data.pagination.totalPages}
          onChange={setPage}
        />
      )}
    </section>
  );
}
