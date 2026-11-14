import { isAxiosError } from "axios";
import { Building2, Save } from "lucide-react";
import { useState, type FormEvent } from "react";

import { updateRestaurant } from "@/lib/organization-api";
import { useOrganizationStore } from "@/store/organization-store";
import type { Restaurant, UpdateRestaurantData } from "@/utils/types/organization";

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

export default function RestaurantProfileForm({ restaurant, canEdit }: {
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
      if (session.currentUser?.systemUser.managedRestaurantId === restaurant.id) {
        updateStore(next);
      }
      setDraft(editableFields(next));
      setSaved(true);
    } catch (cause) {
      const message: unknown = isAxiosError(cause) ? cause.response?.data?.message : undefined;
      setError(typeof message === "string" ? message : Array.isArray(message) ? message.join(" ") : "Unable to save restaurant details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="restaurant-profile" className="overflow-hidden rounded-2xl border border-zinc-700/75 bg-zinc-950">
      <div className="flex items-center gap-3 border-b border-zinc-800 bg-linear-to-r from-emerald-950 to-zinc-900 px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-300/15 text-emerald-200"><Building2 size={17} aria-hidden /></span>
        <div>
          <h2 id="restaurant-profile" className="text-sm font-semibold text-white">Restaurant profile</h2>
          <p className="text-xs text-zinc-300">{canEdit ? "Shared across your restaurant" : "Only the restaurant admin can edit these details."}</p>
        </div>
      </div>
      <form onSubmit={(event) => void save(event)}>
        <fieldset disabled={saving} className="grid min-w-0 gap-3 p-4 @lg:grid-cols-2 @5xl:grid-cols-3">
          {fields.map(({ key, label, min, max }) => (
            <label key={key} className="grid min-w-0 gap-1.5 text-xs font-medium text-zinc-300">
              {label}
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
                className="h-10 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-white focus:border-emerald-400 focus:outline-none read-only:text-zinc-300"
              />
            </label>
          ))}
        </fieldset>
        {canEdit && (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-zinc-800 bg-[#18191d] px-4 py-3">
            {error && <p role="alert" className="mr-auto text-xs text-rose-200">{error}</p>}
            {saved && <p role="status" className="mr-auto text-xs text-emerald-200">Restaurant details saved.</p>}
            <button
              type="button"
              disabled={saving || !dirty}
              onClick={() => { setDraft(current); setError(""); setSaved(false); }}
              className="min-h-9 rounded-lg px-3 text-xs font-medium text-zinc-300 enabled:hover:bg-white/8 disabled:opacity-50"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving || !dirty}
              className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-emerald-300 px-3 text-xs font-semibold text-emerald-950 enabled:hover:bg-emerald-200 disabled:opacity-50"
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
