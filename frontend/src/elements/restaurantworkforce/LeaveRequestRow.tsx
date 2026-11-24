import { ArrowUpRight, CalendarDays, ChevronDown } from "lucide-react";
import type { LeaveRecord } from "@/lib/hr-api";
import { dayLabel } from "./shared";
import WorkforceTableStatus from "./WorkforceTableStatus";

const secondary =
  "inline-flex min-h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 text-[11px] font-medium text-zinc-400 transition-colors hover:border-emerald-500/30 hover:bg-zinc-900 hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-emerald-300";
const primary =
  "inline-flex min-h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 text-[11px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 focus-visible:outline-2 focus-visible:outline-emerald-300";

export default function LeaveRequestRow({
  leave,
  onReview,
  onEdit,
  onRevoke,
}: {
  leave: LeaveRecord;
  onReview: () => void;
  onEdit: () => void;
  onRevoke: () => void;
}) {
  const pending = leave.status === "PENDING";
  const name = leave.staff
    ? `${leave.staff.firstName} ${leave.staff.lastName}`
    : "Staff member";
  const dates =
    leave.startDate.slice(0, 10) === leave.endDate.slice(0, 10)
      ? dayLabel(leave.startDate)
      : `${dayLabel(leave.startDate)} – ${dayLabel(leave.endDate)}`;
  const duration =
    leave.totalDays != null
      ? `${leave.totalDays} ${Number(leave.totalDays) === 1 ? "day" : "days"}`
      : undefined;
  const pay = leave.isPaidLeave ? "Paid" : "Unpaid";

  return (
    <tr className="group align-top transition-colors duration-200 hover:bg-zinc-900/80 focus-within:bg-zinc-900/80">
      <th scope="row" className="px-3 py-4 font-normal @xl:px-5">
        <div className="flex min-w-0 items-start gap-3">
          {leave.staff && (
            <span
              aria-hidden
              className="hidden size-10 shrink-0 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-[11px] font-semibold uppercase text-emerald-400 transition-colors group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 @md:grid"
            >
              {leave.staff.firstName[0]}
              {leave.staff.lastName[0]}
            </span>
          )}
          <div className="min-w-0">
            <p className="break-words text-sm font-medium leading-5 text-zinc-100">
              {name}
            </p>
            {leave.staff && (
              <p className="mt-0.5 break-all font-mono text-[10px] text-zinc-500">
                {leave.staff.employeeCode}
              </p>
            )}
            <div className="mt-1 space-y-0.5 text-[11px] text-zinc-300 @xl:hidden">
              <p>
                {dates}
                {duration && ` · ${duration}`}
              </p>
              <p className="break-words">
                {leave.type} ·{" "}
                <span
                  className={
                    leave.isPaidLeave ? "text-teal-200" : "text-zinc-400"
                  }
                >
                  {pay}
                </span>
              </p>
            </div>
            <div className="mt-1 @xl:hidden">
              <LeaveNotes leave={leave} />
            </div>
          </div>
        </div>
      </th>
      <td className="hidden px-3 py-4 text-xs text-zinc-200 @xl:table-cell">
        <div className="flex items-start gap-1.5">
          <CalendarDays
            size={13}
            className="mt-0.5 shrink-0 text-teal-300"
            aria-hidden
          />
          <span>{dates}</span>
        </div>
        {duration && (
          <p className="mt-0.5 pl-5 text-[11px] text-zinc-400">{duration}</p>
        )}
      </td>
      <td className="hidden break-words px-3 py-4 text-xs text-zinc-200 @xl:table-cell">
        {leave.type}
        <p
          className={
            "mt-0.5 text-[11px] " +
            (leave.isPaidLeave ? "text-teal-200" : "text-zinc-400")
          }
        >
          {pay}
        </p>
      </td>
      <td className="hidden px-3 py-4 @xl:table-cell">
        <LeaveNotes leave={leave} emptyMarker />
      </td>
      <td className="px-2 py-4">
        <WorkforceTableStatus value={leave.status} />
        <div className="mt-2 flex flex-col items-start gap-1 @xl:hidden">
          {pending && (
            <>
              <button
                type="button"
                className={primary}
                aria-label={`Review leave for ${name}`}
                aria-haspopup="dialog"
                onClick={onReview}
              >
                Review
              </button>
              <button
                type="button"
                className="min-h-8 rounded px-1 text-xs text-zinc-300 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-300"
                aria-label={`Edit leave for ${name}`}
                aria-haspopup="dialog"
                onClick={onEdit}
              >
                Edit
              </button>
            </>
          )}
          {(pending || leave.status === "APPROVED") && (
            <button
              type="button"
              className="min-h-8 rounded px-1 text-xs text-zinc-300 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-300"
              aria-label={`Revoke leave for ${name}`}
              aria-haspopup="dialog"
              onClick={onRevoke}
            >
              Revoke
            </button>
          )}
        </div>
      </td>
      <td className="hidden px-3 py-4 @xl:table-cell">
        <div className="flex flex-wrap justify-end gap-1.5">
          {pending && (
            <>
              <button
                type="button"
                className={primary}
                aria-label={`Review leave for ${name}`}
                aria-haspopup="dialog"
                onClick={onReview}
              >
                Review <ArrowUpRight size={13} aria-hidden />
              </button>
              <button
                type="button"
                className={secondary}
                aria-label={`Edit leave for ${name}`}
                aria-haspopup="dialog"
                onClick={onEdit}
              >
                Edit
              </button>
            </>
          )}
          {(pending || leave.status === "APPROVED") && (
            <button
              type="button"
              className={secondary}
              aria-label={`Revoke leave for ${name}`}
              aria-haspopup="dialog"
              onClick={onRevoke}
            >
              Revoke
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function LeaveNotes({
  leave,
  emptyMarker = false,
}: {
  leave: LeaveRecord;
  emptyMarker?: boolean;
}) {
  if (!leave.reason && !leave.revokeReason) {
    return emptyMarker ? (
      <span className="text-xs text-zinc-500" aria-label="No notes">
        —
      </span>
    ) : null;
  }

  return (
    <details className="group/notes">
      <summary className="inline-flex min-h-6 cursor-pointer list-none items-center gap-1 rounded text-[11px] font-medium text-teal-200 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-300 [&::-webkit-details-marker]:hidden">
        <ChevronDown
          size={12}
          className="shrink-0 group-open/notes:rotate-180"
          aria-hidden
        />
        View notes
      </summary>
      <div className="mt-1 space-y-2 border-l border-teal-400/25 pl-2 text-[11px] text-zinc-300">
        {leave.reason && (
          <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">
            <span className="block font-semibold text-zinc-100">
              Request reason
            </span>
            {leave.reason}
          </p>
        )}
        {leave.revokeReason && (
          <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">
            <span className="block font-semibold text-zinc-100">
              {leave.revokedAt
                ? "Revoked " + dayLabel(leave.revokedAt)
                : "Revocation reason"}
            </span>
            {leave.revokeReason}
          </p>
        )}
      </div>
    </details>
  );
}
