import { useCallback, useState, type FormEvent } from "react";
import axios from "axios";
import { ArrowRight, KeyRound, Search } from "lucide-react";
import {
  getManageableSystemUsers,
  setSystemUserActive,
  updateSystemUserAssignment,
} from "@/lib/organization-api";
import { useOrganizationStore } from "@/store/organization-store";
import type { SystemUser, UpdateSystemUserAssignmentData } from "@/utils/types/organization";
import {
  Empty,
  ErrorNote,
  input,
  primary,
  secondary,
  useWorkforceQuery,
} from "@/elements/restaurantworkforce/shared";
import WorkforceFormDialog from "@/elements/restaurantworkforce/WorkforceFormDialog";
import SystemLoginAssignmentFields from "./SystemLoginAssignmentFields";

export default function ManageSystemLogins() {
  const user = useOrganizationStore((state) => state.currentUser?.systemUser);
  const [open, setOpen] = useState(false);
  if (!user || !["SUPER_ADMIN", "FRANCHISE_ADMIN"].includes(user.role))
    return null;
  return (
    <div className="w-full">
      <button
        type="button"
        className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-4 py-3.5 text-left transition-colors hover:border-emerald-400/30 hover:bg-zinc-900/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-400">
            <KeyRound className="size-3.5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-300 transition-colors group-hover:text-white">
              Manage system logins
            </span>
            <span className="mt-1 block text-[11px] text-zinc-500">
              Manage roles, restaurant assignments, and sign-in access
            </span>
          </span>
        </span>
        <span className="grid size-7 shrink-0 place-items-center rounded-md border border-zinc-800 text-zinc-500 transition-colors group-hover:border-emerald-400/20 group-hover:text-emerald-400">
          <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </button>
      {open && <ManageLoginsDialog actor={user} onClose={() => setOpen(false)} />}
    </div>
  );
}

function ManageLoginsDialog({
  actor,
  onClose,
}: {
  actor: SystemUser;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [revision, setRevision] = useState(0);
  const [target, setTarget] = useState<SystemUser>();
  const [assignment, setAssignment] = useState<UpdateSystemUserAssignmentData>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(() => getManageableSystemUsers(term), [term]);
  const result = useWorkforceQuery(
    `${term}/${revision}`,
    load,
    "Unable to load system logins.",
  );
  const statusAction = target?.isActive ? "Deactivate login" : "Activate login";
  const assignmentChanged = assignment && target && (
    assignment.role !== target.role ||
    assignment.franchiseId !== target.franchiseId ||
    assignment.managedRestaurantId !== target.managedRestaurantId
  );
  const canSubmit = !saving && (!assignment || assignmentChanged);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    if (!target) {
      setTerm(search.trim());
      setRevision((value) => value + 1);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const data = assignment
        ? await updateSystemUserAssignment(target.id, assignment)
        : await setSystemUserActive(target.id, !target.isActive);
      setNotice(
        assignment
          ? `Assignment saved for ${data.email}.`
          : `${data.email} was ${data.isActive ? "activated" : "deactivated"}.`,
      );
      setTarget(undefined);
      setAssignment(undefined);
      setRevision((value) => value + 1);
    } catch (error) {
      const message: unknown = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      setError(
        typeof message === "string" ? message : "Unable to update this login.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkforceFormDialog
      title={
        target ? (assignment ? "Edit login assignment" : statusAction) : "Manage system logins"
      }
      icon={KeyRound}
      saving={saving}
      onClose={onClose}
      onSubmit={submit}
      actions={
        target && (
          <>
            <button
              type="button"
              className={secondary}
              disabled={saving}
              onClick={() => {
                setTarget(undefined);
                setAssignment(undefined);
                setError("");
              }}
            >
              Back
            </button>
            <button type="submit" className={primary} disabled={!canSubmit}>
              {saving ? "Saving…" : assignment ? "Save assignment" : statusAction}
            </button>
          </>
        )
      }
    >
      {error && <ErrorNote>{error}</ErrorNote>}
      {target ? (
        <div className="space-y-2 text-xs text-zinc-300">
          <p className="break-all font-medium text-white">{target.email}</p>
          {assignment ? (
            <SystemLoginAssignmentFields
              actor={actor}
              assignment={assignment}
              onChange={setAssignment}
              saving={saving}
            />
          ) : (
            <p>
              {target.isActive
                ? "Deactivation ends active sessions and blocks new sign-ins."
                : "Activation allows this user to sign in when their assignment is active."}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              className={input}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search by name or email"
              placeholder="Search by name or email"
              data-initial-focus
            />
            <button type="submit" className={secondary}>
              <Search size={14} aria-hidden /> Search
            </button>
          </div>
          {notice && (
            <p role="status" className="text-xs text-emerald-200">
              {notice}
            </p>
          )}
          {result.error && <ErrorNote>{result.error}</ErrorNote>}
          {result.loading && <Empty>Loading logins…</Empty>}
          {result.data?.length === 0 && <Empty>No matching logins.</Empty>}
          {result.data?.length === 25 && (
            <p className="text-xs text-zinc-400">
              Showing the first 25 matches. Search by email to find a specific
              login.
            </p>
          )}
          <ul className="divide-y divide-white/8">
            {result.data?.map((account) => (
              <li
                key={account.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-white">
                    {account.firstName} {account.lastName}
                  </p>
                  <p className="break-all text-zinc-400">
                    {account.email} · {account.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={secondary}
                    onClick={() => {
                      if (account.role === "SUPER_ADMIN") return;
                      setTarget(account);
                      setAssignment({
                        role: account.role,
                        franchiseId: account.franchiseId ?? actor.franchiseId ?? "",
                        managedRestaurantId: account.managedRestaurantId,
                      });
                      setNotice("");
                    }}
                  >
                    Edit assignment
                  </button>
                  <button
                    type="button"
                    className={secondary}
                    onClick={() => {
                      setTarget(account);
                      setNotice("");
                    }}
                  >
                    {account.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </WorkforceFormDialog>
  );
}
