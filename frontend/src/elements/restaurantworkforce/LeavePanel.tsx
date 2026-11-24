import { useCallback, useState } from "react";
import { CalendarDays, CalendarPlus } from "lucide-react";
import { getLeaves, type LeaveRecord } from "@/lib/hr-api";
import {
  Empty,
  ErrorNote,
  primary,
  secondary,
  useWorkforceQuery,
} from "./shared";
import LeaveForm from "./LeaveForm";
import LeaveRequestRow from "./LeaveRequestRow";
import LeaveReviewDialog from "./LeaveReviewDialog";
import RevokeLeaveDialog from "./RevokeLeaveDialog";

const filters = [
  { id: "PENDING", label: "Pending" },
  { id: "APPROVED", label: "Approved" },
  { id: "REJECTED", label: "Rejected" },
  { id: "REVOKED", label: "Revoked" },
  { id: "", label: "All" },
] as const;

type Dialog =
  { kind: "new" } | { kind: "edit" | "review" | "revoke"; leave: LeaveRecord };

export default function LeavePanel({
  restaurantId,
  today,
}: {
  restaurantId: string;
  today: string;
}) {
  const [status, setStatus] = useState<LeaveRecord["status"] | "">("PENDING");
  const [revision, setRevision] = useState(0);
  const [dialog, setDialog] = useState<Dialog>();
  const [notice, setNotice] = useState("");
  const load = useCallback(
    async () =>
      (await getLeaves({ restaurantId, status: status || undefined })).data,
    [restaurantId, status],
  );
  const result = useWorkforceQuery(
    `${restaurantId}/${status}/${revision}`,
    load,
    "Unable to load leave requests.",
  );

  function closeDecision() {
    setDialog(undefined);
    setRevision((value) => value + 1);
  }

  function refresh(message: string) {
    if (dialog?.kind === "revoke" && status) setStatus("REVOKED");
    if (dialog?.kind === "new") setStatus("PENDING");
    closeDecision();
    setNotice(message);
  }

  return (
    <section
      className="@container min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70"
      aria-label="Leave requests"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-400/15 bg-linear-to-r from-emerald-500/15 via-emerald-500/5 to-zinc-950 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-400">
            <CalendarDays size={17} aria-hidden />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
                Leave requests
              </h2>
              {result.data && (
                <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  {result.data.length}{" "}
                  {result.data.length === 1 ? "record" : "records"}
                </span>
              )}
            </div>
            <p className="mt-1 text-[10px] text-zinc-500">
              Review leave periods, decisions and staff notes
            </p>
          </div>
        </div>
        <button
          type="button"
          className={primary}
          aria-haspopup="dialog"
          onClick={() => setDialog({ kind: "new" })}
        >
          <CalendarPlus size={15} aria-hidden /> Apply for leave
        </button>
      </div>
      <div
        role="group"
        aria-label="Filter leave requests"
        className="flex flex-wrap items-center gap-1 border-b border-zinc-800/80 bg-zinc-950/80 p-2"
      >
        {filters.map(({ id, label }) => (
          <button
            type="button"
            key={id}
            aria-pressed={status === id}
            onClick={() => {
              setStatus(id);
              setNotice("");
            }}
            className={`min-h-8 rounded-md px-2.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-emerald-300 ${status === id ? "bg-emerald-400/15 text-emerald-300" : "text-zinc-300 hover:bg-white/8"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {notice && (
        <p
          role="status"
          className="border-b border-emerald-400/15 bg-emerald-400/5 px-4 py-2 text-xs text-emerald-200"
        >
          {notice}
        </p>
      )}
      {result.error && (
        <div className="flex flex-wrap items-center gap-2 p-4">
          <ErrorNote>{result.error}</ErrorNote>
          <button
            type="button"
            className={secondary}
            onClick={() => setRevision((value) => value + 1)}
          >
            Retry
          </button>
        </div>
      )}
      {result.loading && <Empty>Loading leave requests…</Empty>}
      {result.data?.length === 0 && (
        <Empty>
          {status === "PENDING"
            ? "No pending leave requests."
            : "No leave requests in this view."}
        </Empty>
      )}
      {Boolean(result.data?.length) && (
        <table className="w-full table-fixed text-left">
          <caption className="sr-only">Restaurant leave requests</caption>
          <thead className="border-b border-zinc-800 bg-zinc-950/80 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-600">
            <tr>
              <th
                scope="col"
                className="px-3 py-3 font-bold @xl:w-[21%] @xl:px-4"
              >
                Employee
              </th>
              <th
                scope="col"
                className="hidden w-[20%] px-3 py-3 font-bold @xl:table-cell"
              >
                Leave period
              </th>
              <th
                scope="col"
                className="hidden w-[13%] px-3 py-3 font-bold @xl:table-cell"
              >
                Type &amp; pay
              </th>
              <th
                scope="col"
                className="hidden w-[17%] px-3 py-3 font-bold @xl:table-cell"
              >
                Notes
              </th>
              <th scope="col" className="w-28 px-2 py-3 font-bold @xl:w-22">
                Status<span className="@xl:hidden"> &amp; actions</span>
              </th>
              <th
                scope="col"
                className="hidden px-3 py-3 text-right font-bold @xl:table-cell"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            {result.data?.map((leave) => (
              <LeaveRequestRow
                key={leave.id}
                leave={leave}
                onReview={() => setDialog({ kind: "review", leave })}
                onEdit={() => setDialog({ kind: "edit", leave })}
                onRevoke={() => setDialog({ kind: "revoke", leave })}
              />
            ))}
          </tbody>
        </table>
      )}
      {(dialog?.kind === "new" || dialog?.kind === "edit") && (
        <LeaveForm
          restaurantId={restaurantId}
          today={today}
          leave={dialog.kind === "edit" ? dialog.leave : undefined}
          onClose={() => setDialog(undefined)}
          onSaved={refresh}
        />
      )}
      {dialog?.kind === "review" && (
        <LeaveReviewDialog
          leave={dialog.leave}
          onClose={closeDecision}
          onSaved={refresh}
        />
      )}
      {dialog?.kind === "revoke" && (
        <RevokeLeaveDialog
          leave={dialog.leave}
          onClose={closeDecision}
          onSaved={refresh}
        />
      )}
    </section>
  );
}
