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
  panel,
  primary,
  secondary,
  Status,
  useWorkforceQuery,
} from "@/elements/restaurantworkforce/shared";
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
    <section className={panel}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 bg-linear-to-r from-teal-900/50 to-transparent px-4 py-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <CalendarClock size={17} className="text-teal-200" aria-hidden />{" "}
            Shift templates
          </h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            Set the hours managers can reuse when assigning shifts.
          </p>
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
      <ul className="divide-y divide-white/8">
        {result.data?.map((template) => (
          <li
            key={template.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-white">
                  {template.name}
                </h3>
                <Status value={template.status} />
              </div>
              <p className="mt-0.5 text-xs capitalize text-zinc-400">
                {template.type.toLowerCase()}
              </p>
              <ul className="mt-2 flex flex-wrap gap-1.5 text-xs tabular-nums text-teal-100">
                {template.segments.map((segment) => (
                  <li
                    key={segment.sequence}
                    className="rounded-md border border-teal-400/15 bg-teal-400/8 px-2 py-1"
                  >
                    {segment.startTime} – {segment.endTime}
                    {segment.crossesMidnight && " (+1 day)"}
                  </li>
                ))}
              </ul>
            </div>
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
          </li>
        ))}
      </ul>
      {result.data?.some((template) => template.status === "ACTIVE") && (
        <div className="flex justify-end border-t border-white/8 px-4 py-3">
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
