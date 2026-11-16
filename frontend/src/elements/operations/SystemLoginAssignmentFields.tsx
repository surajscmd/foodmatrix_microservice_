import { useCallback } from "react";
import { getFranchiseOptions, getRestaurants } from "@/lib/organization-api";
import {
  Empty,
  ErrorNote,
  input,
  useWorkforceQuery,
} from "@/elements/restaurantworkforce/shared";
import type {
  SystemUser,
  UpdateSystemUserAssignmentData,
} from "@/utils/types/organization";

type AssignmentRole = UpdateSystemUserAssignmentData["role"];

const roles: { value: AssignmentRole; label: string }[] = [
  { value: "RESTAURANT_ADMIN", label: "Restaurant admin" },
  { value: "STAFF", label: "Staff" },
  { value: "OPERATIONS", label: "Operations" },
  { value: "FRANCHISE_ADMIN", label: "Franchise admin" },
];

export default function SystemLoginAssignmentFields({
  actor,
  assignment,
  onChange,
  saving,
}: {
  actor: SystemUser;
  assignment: UpdateSystemUserAssignmentData;
  onChange: (value: UpdateSystemUserAssignmentData) => void;
  saving: boolean;
}) {
  const isSuperAdmin = actor.role === "SUPER_ADMIN";
  const load = useCallback(async () => {
    const [franchises, restaurants] = await Promise.all([
      isSuperAdmin ? getFranchiseOptions() : Promise.resolve([]),
      getRestaurants(),
    ]);
    return { franchises, restaurants };
  }, [isSuperAdmin]);
  const { data, error, loading } = useWorkforceQuery(
    actor.id,
    load,
    "Unable to load restaurant assignments.",
  );
  const restaurants = data?.restaurants.filter(
    ({ franchiseId, status }) =>
      franchiseId === assignment.franchiseId && status === "ACTIVE",
  );
  const assignedRestaurant = restaurants?.find(
    ({ id }) => id === assignment.managedRestaurantId,
  );

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (loading || !data) return <Empty>Loading assignments…</Empty>;

  return (
    <fieldset disabled={saving} className="space-y-3">
      <label className="block space-y-1.5 text-xs font-medium text-zinc-300">
        <span>Role</span>
        <select
          className={input}
          value={assignment.role}
          onChange={(event) => {
            const selected = roles.find(
              ({ value }) => value === event.target.value,
            );
            if (!selected) return;
            onChange({
              ...assignment,
              role: selected.value,
              managedRestaurantId:
                selected.value === "FRANCHISE_ADMIN"
                  ? null
                  : assignment.managedRestaurantId,
            });
          }}
        >
          {roles
            .filter(({ value }) => isSuperAdmin || value !== "FRANCHISE_ADMIN")
            .map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
        </select>
      </label>
      {isSuperAdmin && (
        <label className="block space-y-1.5 text-xs font-medium text-zinc-300">
          <span>Franchise</span>
          <select
            className={input}
            value={assignment.franchiseId}
            required
            onChange={(event) =>
              onChange({
                ...assignment,
                franchiseId: event.target.value,
                managedRestaurantId: null,
              })
            }
          >
            <option value="">Select a franchise</option>
            {data.franchises.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
      )}
      {assignment.role !== "FRANCHISE_ADMIN" && (
        <label className="block space-y-1.5 text-xs font-medium text-zinc-300">
          <span>Restaurant</span>
          <select
            className={input}
            value={assignedRestaurant?.id ?? ""}
            required
            onChange={(event) =>
              onChange({
                ...assignment,
                managedRestaurantId: event.target.value || null,
              })
            }
          >
            <option value="">Select an active restaurant</option>
            {restaurants?.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
      )}
      <p className="text-xs leading-relaxed text-zinc-400">
        Saving a new assignment signs this user out of existing sessions.
      </p>
    </fieldset>
  );
}
