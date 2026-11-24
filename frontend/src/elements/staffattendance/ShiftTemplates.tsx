import { useCallback, useState } from "react";
import { CalendarClock, Plus } from "lucide-react";
import {
  attendanceError,
  deleteShiftTemplate,
  getShiftTemplates,
  type ShiftTemplate,
} from "@/lib/hr-api";
import {
  Empty,
  ErrorNote,
  useWorkforceQuery,
} from "@/elements/restaurantworkforce/shared";
import {
  attendancePrimary as primary,
  attendanceButton as secondary,
} from "./attendance-theme";
import WorkforceTableStatus from "@/elements/restaurantworkforce/WorkforceTableStatus";
import ShiftTemplateForm from "./ShiftTemplateForm";

export default function ShiftTemplates({
  restaurantId,
  onUseTemplate,
}: {
  restaurantId: string;
  onUseTemplate: () => void;
}) {
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState<ShiftTemplate | "new">();
  const [remove, setRemove] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(
    () => getShiftTemplates(restaurantId),
    [restaurantId],
  );
  const result = useWorkforceQuery(
    `${restaurantId}/${revision}`,
    load,
    "Unable to load shift templates.",
  );

  function refresh(message: string) {
    setEditing(undefined);
    setRemove(undefined);
    setError("");
    setNotice(message);
    setRevision((value) => value + 1);
  }

  async function confirmRemove(id: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const { message } = await deleteShiftTemplate(id);
      refresh(message);
    } catch (error) {
      setError(
        attendanceError(
          error,
          "Could not delete the template. You can deactivate a template that is already in use.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="@container min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-400/15 bg-linear-to-r from-emerald-500/15 via-emerald-500/5 to-zinc-950 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-400">
            <CalendarClock size={17} aria-hidden />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
                Shift templates
              </h2>
              {result.data && (
                <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  {result.data.length}{" "}
                  {result.data.length === 1 ? "record" : "records"}
                </span>
              )}
            </div>
            <p className="mt-1 text-[10px] text-zinc-500">
              Reusable working hours for staff assignments
            </p>
          </div>
        </div>
        <button
          className={primary}
          type="button"
          aria-haspopup="dialog"
          disabled={busy}
          onClick={() => setEditing("new")}
        >
          <Plus size={15} aria-hidden /> New template
        </button>
      </div>
      {notice && (
        <p role="status" className="px-4 pt-3 text-xs text-emerald-200">
          {notice}
        </p>
      )}
      {(error || result.error) && (
        <div className="flex items-center gap-2 p-4">
          <ErrorNote>{error || result.error}</ErrorNote>
          {result.error && (
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
      {result.loading && <Empty>Loading shift templates…</Empty>}
      {result.data?.length === 0 && (
        <Empty>Create a shift template before assigning a shift.</Empty>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <caption className="sr-only">Restaurant shift templates</caption>
          <thead className="border-b border-zinc-800 bg-zinc-950/80 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-600">
            <tr>
              <th scope="col" className="px-5 py-3">
                Template
              </th>
              <th scope="col" className="px-3 py-3">
                Working hours
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
            {result.data?.map((template) => (
              <tr
                key={template.id}
                className="group transition-colors duration-200 hover:bg-zinc-900/80 focus-within:bg-zinc-900/80"
              >
                <th scope="row" className="px-5 py-4 font-normal">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-emerald-400 transition-colors group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10">
                      <CalendarClock size={17} aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h3 className="break-words text-sm font-medium leading-5 text-zinc-100">
                        {template.name}
                      </h3>
                      <p className="mt-1 text-[10px] capitalize text-zinc-500">
                        {template.type.toLowerCase().replaceAll("_", " ")}
                      </p>
                    </div>
                  </div>
                </th>
                <td className="px-3 py-4">
                  <ul className="flex flex-wrap gap-1.5">
                    {template.segments.map((segment) => (
                      <li
                        key={segment.sequence}
                        className="rounded-md border border-zinc-800 bg-zinc-900/70 px-2 py-1 font-mono text-[11px] tabular-nums text-zinc-300"
                      >
                        {segment.startTime} – {segment.endTime}
                        {segment.crossesMidnight && (
                          <span className="ml-1 text-[10px] text-amber-300">
                            +1 day
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="px-3 py-4">
                  <WorkforceTableStatus value={template.status} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap justify-end">
                    {remove === template.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-amber-200">
                          Delete this template?
                        </span>
                        <button
                          type="button"
                          className={secondary}
                          disabled={busy}
                          onClick={() => setRemove(undefined)}
                        >
                          Keep
                        </button>
                        <button
                          type="button"
                          className={secondary + " text-rose-200"}
                          disabled={busy}
                          onClick={() => confirmRemove(template.id)}
                        >
                          {busy ? "Deleting…" : "Confirm delete"}
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className={secondary}
                          aria-haspopup="dialog"
                          disabled={busy}
                          onClick={() => {
                            setError("");
                            setEditing(template);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={secondary}
                          disabled={busy}
                          onClick={() => {
                            setError("");
                            setRemove(template.id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {result.data?.some((template) => template.status === "ACTIVE") && (
        <div className="flex justify-end border-t border-zinc-800/80 px-4 py-3">
          <button
            type="button"
            className={secondary}
            disabled={busy}
            onClick={onUseTemplate}
          >
            Go to Add shifts
          </button>
        </div>
      )}
      {editing && (
        <ShiftTemplateForm
          restaurantId={restaurantId}
          template={editing === "new" ? undefined : editing}
          onClose={() => setEditing(undefined)}
          onSaved={refresh}
        />
      )}
    </section>
  );
}
