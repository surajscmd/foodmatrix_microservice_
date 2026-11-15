import { useCallback, useState, type FormEvent } from "react";
import { CalendarPlus } from "lucide-react";
import {
  attendanceError,
  getStaffByRestaurant,
  saveLeave,
  type LeaveRecord,
} from "@/lib/hr-api";
import {
  ErrorNote,
  Field,
  input,
  primary,
  secondary,
  useWorkforceQuery,
} from "./shared";
import WorkforceFormDialog from "./WorkforceFormDialog";

export default function LeaveForm({
  restaurantId,
  today,
  leave,
  onClose,
  onSaved,
}: {
  restaurantId: string;
  today: string;
  leave?: LeaveRecord;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [staffId, setStaffId] = useState(leave?.staffId ?? "");
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const options = { search: search.trim() || undefined, directory: true };
    const { data } = await getStaffByRestaurant(restaurantId, 1, 100, options);
    const rest = await Promise.all(
      Array.from(
        { length: Math.max(0, data.pagination.totalPages - 1) },
        (_, index) =>
          getStaffByRestaurant(restaurantId, index + 2, 100, options),
      ),
    );
    return [...data.data, ...rest.flatMap((page) => page.data.data)]
      .filter(
        (staff) => staff.status !== "TERMINATED" || staff.id === leave?.staffId,
      )
      .sort(
        (a, b) =>
          a.firstName.localeCompare(b.firstName) ||
          a.lastName.localeCompare(b.lastName),
      );
  }, [leave?.staffId, restaurantId, search]);
  const staff = useWorkforceQuery(
    `${restaurantId}/${search}/${revision}`,
    load,
    "Unable to load staff.",
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !staffId) return;
    const form = new FormData(event.currentTarget);
    const startDate = String(form.get("start"));
    const endDate = String(form.get("end"));
    const type = String(form.get("type")).trim();
    const reason = String(form.get("reason")).trim();
    if (!type || !reason || endDate < startDate) {
      setError(
        "Enter a leave type and reason, and choose an end date on or after the start date.",
      );
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { message } = await saveLeave(
        {
          staffId,
          type,
          reason,
          startDate,
          endDate,
          isPaidLeave: form.get("pay") === "paid",
        },
        leave?.id,
      );
      onSaved(message);
    } catch (error) {
      setError(attendanceError(error, "Unable to save the leave request."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkforceFormDialog
      title={leave ? "Edit leave request" : "Apply for leave"}
      icon={CalendarPlus}
      saving={saving}
      onClose={onClose}
      onSubmit={submit}
      actions={
        <button
          type="submit"
          className={primary}
          disabled={
            saving ||
            !staffId ||
            !staff.data?.some((entry) => entry.id === staffId)
          }
        >
          {saving ? "Saving…" : leave ? "Save request" : "Submit request"}
        </button>
      }
    >
      {error && <ErrorNote>{error}</ErrorNote>}
      {staff.error && (
        <div className="flex items-center gap-2">
          <ErrorNote>{staff.error}</ErrorNote>
          <button
            type="button"
            className={secondary}
            onClick={() => setRevision((value) => value + 1)}
          >
            Retry
          </button>
        </div>
      )}
      <fieldset disabled={saving} className="grid gap-3 sm:grid-cols-2">
        <Field label="Find staff member">
          <input
            type="search"
            className={input}
            value={search}
            data-initial-focus
            placeholder="Name or employee code"
            onChange={(event) => {
              setSearch(event.target.value);
              setStaffId("");
            }}
          />
        </Field>
        <Field label="Staff member">
          <select
            className={input}
            value={staffId}
            onChange={(event) => setStaffId(event.target.value)}
            required
            disabled={staff.loading || Boolean(staff.error)}
          >
            <option value="">
              {staff.loading
                ? "Loading staff…"
                : staff.data?.length
                  ? "Select staff member"
                  : "No staff found"}
            </option>
            {staff.data?.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.firstName} {entry.lastName} · {entry.employeeCode}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Leave type">
          <input
            className={input}
            name="type"
            required
            maxLength={80}
            defaultValue={leave?.type}
            placeholder="e.g. Annual or sick leave"
          />
        </Field>
        <Field label="Pay">
          <select
            className={input}
            name="pay"
            defaultValue={leave?.isPaidLeave ? "paid" : "unpaid"}
          >
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
          </select>
        </Field>
        <Field label="Start date">
          <input
            className={input}
            name="start"
            type="date"
            required
            defaultValue={leave?.startDate.slice(0, 10) ?? today}
          />
        </Field>
        <Field label="End date">
          <input
            className={input}
            name="end"
            type="date"
            required
            defaultValue={leave?.endDate.slice(0, 10) ?? today}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Reason">
            <textarea
              className={input}
              name="reason"
              rows={3}
              required
              maxLength={500}
              defaultValue={leave?.reason ?? ""}
            />
          </Field>
        </div>
      </fieldset>
    </WorkforceFormDialog>
  );
}
