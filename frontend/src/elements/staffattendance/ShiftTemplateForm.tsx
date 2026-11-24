import { useState, type FormEvent } from "react";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import {
  attendanceError,
  saveShiftTemplate,
  type ShiftTemplate,
} from "@/lib/hr-api";
import { ErrorNote, Field } from "@/elements/restaurantworkforce/shared";
import {
  attendanceField as input,
  attendancePrimary as primary,
  attendanceButton as secondary,
} from "./attendance-theme";
import WorkforceFormDialog from "@/elements/restaurantworkforce/WorkforceFormDialog";

export default function ShiftTemplateForm({
  restaurantId,
  template,
  onClose,
  onSaved,
}: {
  restaurantId: string;
  template?: ShiftTemplate;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [segments, setSegments] = useState(
    () =>
      template?.segments.map(({ sequence, startTime, endTime }) => ({
        id: sequence,
        startTime,
        endTime,
      })) ?? [{ id: 1, startTime: "09:00", endTime: "17:00" }],
  );
  const [nextId, setNextId] = useState(segments.length + 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name")).trim();
    const type = form.get("type") as ShiftTemplate["type"];
    const status = form.get("status") as ShiftTemplate["status"];
    let previousEnd = "";
    let nextDay = false;
    const times = [];
    for (const [index, segment] of segments.entries()) {
      const { startTime, endTime } = segment;
      const crossesMidnight = endTime < startTime;
      if (
        startTime === endTime ||
        (previousEnd && startTime < previousEnd) ||
        (nextDay && crossesMidnight)
      ) {
        setError(
          "Use ordered, non-overlapping time blocks. A template can cross midnight once.",
        );
        return;
      }
      times.push({ sequence: index + 1, startTime, endTime, crossesMidnight });
      previousEnd = endTime;
      nextDay ||= crossesMidnight;
    }
    if (!name) {
      setError("Enter a template name.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { message } = await saveShiftTemplate(
        restaurantId,
        { name, type, status, segments: times },
        template?.id,
      );
      onSaved(message);
    } catch (error) {
      setError(attendanceError(error, "Unable to save the shift template."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkforceFormDialog
      title={template ? "Edit shift template" : "New shift template"}
      icon={CalendarClock}
      saving={saving}
      onClose={onClose}
      onSubmit={submit}
      actions={
        <button type="submit" className={primary} disabled={saving}>
          {saving ? "Saving…" : "Save template"}
        </button>
      }
    >
      {error && <ErrorNote>{error}</ErrorNote>}
      <fieldset disabled={saving} className="space-y-3">
        <Field label="Template name">
          <input
            className={input}
            name="name"
            defaultValue={template?.name}
            placeholder="e.g. Dinner service"
            data-initial-focus
            required
            maxLength={100}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Shift type">
            <select
              className={input}
              name="type"
              defaultValue={template?.type ?? "MORNING"}
            >
              <option value="MORNING">Morning</option>
              <option value="EVENING">Evening</option>
              <option value="NIGHT">Night</option>
              <option value="SPLIT">Split</option>
            </select>
          </Field>
          <Field label="Availability">
            <select
              className={input}
              name="status"
              defaultValue={template?.status ?? "ACTIVE"}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </Field>
        </div>
        <div className="space-y-2 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3">
          <p className="text-xs font-semibold text-white">Working hours</p>
          <p className="text-[11px] text-zinc-400">
            Add a time block for each part of a split shift. An end time earlier
            than the start continues into the next day.
          </p>
          {segments.map((segment, index) => (
            <div
              key={segment.id}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2"
            >
              {(["startTime", "endTime"] as const).map((key) => (
                <Field
                  key={key}
                  label={`Block ${index + 1} ${key === "startTime" ? "start" : "end"}`}
                >
                  <input
                    className={input}
                    type="time"
                    value={segment[key]}
                    required
                    onChange={(event) =>
                      setSegments((values) =>
                        values.map((value) =>
                          value.id === segment.id
                            ? { ...value, [key]: event.target.value }
                            : value,
                        ),
                      )
                    }
                  />
                </Field>
              ))}
              <button
                type="button"
                className={secondary}
                aria-label={`Remove block ${index + 1}`}
                disabled={segments.length === 1}
                onClick={() =>
                  setSegments((values) =>
                    values.filter(({ id }) => id !== segment.id),
                  )
                }
              >
                <Trash2 size={14} aria-hidden />
              </button>
            </div>
          ))}
          <button
            type="button"
            className={secondary}
            onClick={() => {
              setSegments((values) => [
                ...values,
                { id: nextId, startTime: "", endTime: "" },
              ]);
              setNextId((id) => id + 1);
            }}
          >
            <Plus size={14} aria-hidden /> Add time block
          </button>
        </div>
      </fieldset>
    </WorkforceFormDialog>
  );
}
