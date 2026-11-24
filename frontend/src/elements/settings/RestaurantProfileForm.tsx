import { isAxiosError } from "axios";
import { Building2, Save } from "lucide-react";
import { useState, type FormEvent } from "react";

import { updateRestaurant } from "@/lib/organization-api";
import { useOrganizationStore } from "@/store/organization-store";
import type {
  Restaurant,
  UpdateRestaurantData,
} from "@/utils/types/organization";

const fields = [
  { key: "name", label: "Restaurant name", min: 2, max: 100 },
  { key: "city", label: "City", min: 2, max: 100 },
  { key: "address", label: "Street address", min: 2, max: 255 },
  { key: "state", label: "State or region", min: 2, max: 100 },
  { key: "country", label: "Country", min: 2, max: 100 },
  { key: "timezone", label: "Restaurant time zone", min: 1, max: 100 },
] as const;

type FieldKey = (typeof fields)[number]["key"];

function editableFields(restaurant: Restaurant): Record<FieldKey, string> {
  return {
    name: restaurant.name,
    address: restaurant.address,
    city: restaurant.city,
    state: restaurant.state ?? "",
    country: restaurant.country,
    timezone: restaurant.timezone,
  };
}

export default function RestaurantProfileForm({
  restaurant,
  canEdit,
}: {
  restaurant: Restaurant;
  canEdit: boolean;
}) {
  const updateStore = useOrganizationStore((state) => state.updateRestaurant);
  const [draft, setDraft] = useState(() => editableFields(restaurant));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const current = editableFields(restaurant);
  const dirty = fields.some(({ key }) => draft[key].trim() !== current[key]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !canEdit || !dirty) return;
    setError("");
    setSaved(false);

    const updates: UpdateRestaurantData = {};
    for (const { key, label, min } of fields) {
      const value = draft[key].trim();
      if (value === current[key]) continue;
      if (key === "state" && !value) {
        updates.state = null;
      } else if (value.length < min) {
        setError(`${label} must have at least ${min} characters.`);
        return;
      } else {
        updates[key] = value;
      }
    }

    if (updates.timezone) {
      try {
        new Intl.DateTimeFormat("en", { timeZone: updates.timezone });
      } catch {
        setError("Enter a valid time zone, such as Asia/Kolkata.");
        return;
      }
    }

    setSaving(true);
    try {
      const updated = await updateRestaurant(restaurant.id, updates);
      const next = { ...restaurant, ...updated };
      const session = useOrganizationStore.getState();
      if (
        session.currentUser?.systemUser.managedRestaurantId === restaurant.id
      ) {
        updateStore(next);
      }
      setDraft(editableFields(next));
      setSaved(true);
    } catch (cause) {
      const message: unknown = isAxiosError(cause)
        ? cause.response?.data?.message
        : undefined;
      setError(
        typeof message === "string"
          ? message
          : Array.isArray(message)
            ? message.join(" ")
            : "Unable to save restaurant details.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      aria-labelledby="restaurant-profile"
      className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80"
    >
      <div className="flex items-start gap-3 border-b border-zinc-800 px-5 py-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-emerald-500/15 bg-emerald-500/10 text-emerald-400">
          <Building2 size={16} aria-hidden />
        </span>
        <div>
          <h2
            id="restaurant-profile"
            className="text-xs font-semibold text-zinc-200"
          >
            Restaurant profile
          </h2>
          <p className="mt-1 text-[10px] leading-relaxed text-zinc-600">
            {canEdit
              ? "Update your restaurant's name, address and time zone details."
              : "Only the restaurant admin can edit these details."}
          </p>
        </div>
      </div>
      <form onSubmit={(event) => void save(event)}>
        <fieldset
          disabled={saving}
          className="grid min-w-0 gap-5 p-5 @lg:grid-cols-2 @5xl:grid-cols-3"
        >
          {fields.map(({ key, label, min, max }) => (
            <label key={key} className="grid min-w-0 gap-2">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                {label}
              </span>
              <input
                value={canEdit ? draft[key] : current[key]}
                readOnly={!canEdit}
                required={canEdit && key !== "state"}
                minLength={min}
                maxLength={max}
                placeholder={key === "timezone" ? "Asia/Kolkata" : undefined}
                onChange={(event) => {
                  const value = event.target.value;
                  setDraft((previous) => ({ ...previous, [key]: value }));
                  setError("");
                  setSaved(false);
                }}
                className="w-full min-w-0 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-xs text-zinc-200 outline-none transition-colors focus:border-emerald-500/50 read-only:text-zinc-400"
              />
            </label>
          ))}
        </fieldset>
        {canEdit && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 px-5 py-4">
            <div className="min-w-0 flex-1 basis-48 space-y-1">
              <p className="font-mono text-[10px] text-zinc-500">
                {dirty
                  ? "Unsaved changes"
                  : "Restaurant details are up to date"}
              </p>
              {error && (
                <p role="alert" className="text-xs text-rose-300">
                  {error}
                </p>
              )}
              {saved && (
                <p role="status" className="text-xs text-emerald-300">
                  Restaurant details saved.
                </p>
              )}
            </div>
            <button
              type="button"
              disabled={saving || !dirty}
              onClick={() => {
                setDraft(current);
                setError("");
                setSaved(false);
              }}
              className="inline-flex min-h-9 items-center rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-400 transition-colors enabled:hover:bg-zinc-800 enabled:hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-50"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving || !dirty}
              className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 transition-colors enabled:hover:bg-emerald-500/20 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-40"
            >
              <Save size={15} aria-hidden />
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        )}
      </form>
    </section>
  );
}
