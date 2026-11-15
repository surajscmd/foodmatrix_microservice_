"use client";

import {
  BadgeCheck,
  Building2,
  CircleAlert,
  Coins,
  Edit3,
  FileText,
  Fingerprint,
  Loader2,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import { useEffect, useState } from "react";

import { getFranchise, getFranchiseOptions, updateFranchise } from "@/lib/organization-api";
import { useOrganizationStore } from "@/store/organization-store";
import type { UpdateFranchiseData } from "@/utils/types/organization";

export default function FranchiseOverview() {
  // ============================================================
  // ZUSTAND
  // ============================================================

  const currentUser = useOrganizationStore((state) => state.currentUser);

  const franchise = useOrganizationStore((state) => state.franchise);

  const setFranchise = useOrganizationStore((state) => state.setFranchise);

  const loading = useOrganizationStore((state) => state.isLoading);

  // ============================================================
  // LOCAL UI STATE
  // ============================================================

  const [isEditing, setIsEditing] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("INR");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const roleId = currentUser?.systemUser.role;
  const canSelect = roleId === "SUPER_ADMIN";
  const canEdit = canSelect || roleId === "FRANCHISE_ADMIN";
  const [options, setOptions] = useState<Awaited<ReturnType<typeof getFranchiseOptions>>>([]);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    if (!canSelect) return;

    let active = true;
    void getFranchiseOptions().then(
      (items) => { if (active) setOptions(items); },
      () => { if (active) setSelectionError("Unable to load franchises."); },
    );
    return () => { active = false; };
  }, [canSelect]);

  const selectFranchise = async (id: string) => {
    if (!id || isSwitching) return;
    setIsSwitching(true);
    setSelectionError(null);
    try {
      setFranchise(await getFranchise(id));
      setError(null);
      setSuccess(false);
    } catch {
      setSelectionError("Unable to open that franchise.");
    } finally {
      setIsSwitching(false);
    }
  };

  // ============================================================
  // EDIT FRANCHISE
  // ============================================================

  const handleEdit = () => {
    if (!franchise) {
      return;
    }

    setName(franchise.name);
    setTaxId(franchise.taxId ?? "");
    setDefaultCurrency(franchise.defaultCurrency);

    setError(null);
    setSuccess(false);

    setIsEditing(true);
  };

  const handleCancel = () => {
    if (!franchise) {
      return;
    }

    setName(franchise.name);
    setTaxId(franchise.taxId ?? "");
    setDefaultCurrency(franchise.defaultCurrency);

    setError(null);
    setSuccess(false);

    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!franchise) {
      return;
    }

    const trimmedName = name.trim();
    const trimmedTaxId = taxId.trim();
    const trimmedCurrency = defaultCurrency.trim().toUpperCase();

    if (!trimmedName) {
      setError("Franchise name is required.");
      return;
    }

    if (!trimmedCurrency) {
      setError("Currency is required.");
      return;
    }

    const payload: UpdateFranchiseData = {
      name: trimmedName,
      taxId: trimmedTaxId || undefined,
      defaultCurrency: trimmedCurrency,
    };

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(false);

      const updated = await updateFranchise(payload, franchise.id);

      setFranchise(updated);
      setOptions((items) => items.map((item) => item.id === updated.id ? { id: updated.id, name: updated.name } : item));

      setName(updated.name);
      setTaxId(updated.taxId ?? "");
      setDefaultCurrency(updated.defaultCurrency);

      setIsEditing(false);
      setSuccess(true);

      window.setTimeout(() => {
        setSuccess(false);
      }, 2500);
    } catch (err) {
      console.error("Failed to update franchise:", err);

      setError("Unable to update franchise information.");
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================

  const formatDate = (value: string | null) => {
    if (!value) {
      return "—";
    }

    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const user = currentUser?.user;
  const systemUser = currentUser?.systemUser;

  const role = systemUser?.role?.replaceAll("_", " ") ?? "—";

  const accountActive = systemUser?.isActive ?? false;
  const emailVerified = user?.emailVerified ?? false;

  // ============================================================
  // UI
  // ============================================================

  return (
    <section className="group relative overflow-hidden rounded-3xl border border-zinc-800/90 bg-gradient-to-br from-[#0d1117] via-[#090b0f] to-[#07090c] shadow-[0_20px_55px_rgba(0,0,0,0.18)]">
      {/* BACKGROUND */}

      <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:36px_36px]" />

      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/[0.07] blur-3xl" />

      <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-cyan-500/[0.035] blur-3xl" />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />

      {/* HEADER */}

      <div className="relative flex items-center justify-between border-b border-zinc-800/80 px-5 py-3.5 sm:px-7">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-400/15 via-emerald-500/5 to-cyan-400/10 shadow-[0_0_24px_rgba(52,211,153,0.08)]">
            <div className="absolute inset-0 rounded-2xl bg-emerald-400/5 blur-md" />

            <Building2 className="relative h-5 w-5 text-emerald-300" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500">
              Franchise
            </span>

            <span className="text-zinc-800">/</span>

            <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-zinc-700">
              Overview
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {systemUser && (
            <div className="hidden items-center gap-2 sm:flex">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  accountActive
                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                    : "bg-red-400"
                }`}
              />

              <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-zinc-600">
                {accountActive ? "Account active" : "Account inactive"}
              </span>
            </div>
          )}

          {!loading && canEdit && franchise && !isEditing && !isSwitching && (
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700/80 bg-zinc-900/80 px-3 py-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-300 transition-all duration-200 hover:border-emerald-400/40 hover:bg-emerald-500/10 hover:text-emerald-300"
            >
              <Edit3 className="h-3 w-3" />
              Edit
            </button>
          )}
        </div>
      </div>

      {canSelect && !loading && (
        <div className="relative flex flex-wrap items-center gap-3 border-b border-zinc-800/80 px-5 py-3 sm:px-7">
          <label htmlFor="operations-franchise" className="text-xs font-semibold text-zinc-300">Franchise workspace</label>
          <select
            id="operations-franchise"
            value={franchise?.id ?? ""}
            disabled={isEditing || isSaving || isSwitching}
            onChange={(event) => void selectFranchise(event.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus-visible:outline-emerald-400 disabled:opacity-60"
          >
            <option value="" disabled>Select franchise</option>
            {franchise && !options.some((item) => item.id === franchise.id) && <option value={franchise.id}>{franchise.name}</option>}
            {options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          {isSwitching && <span role="status" className="text-xs text-zinc-400">Opening franchise…</span>}
          {selectionError && <span role="alert" className="text-xs text-red-400">{selectionError}</span>}
        </div>
      )}

      {/* LOADING */}

      {loading && (
        <div className="relative flex min-h-[300px] items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
            Loading workspace...
          </div>
        </div>
      )}

      {/* ERROR */}

      {!loading && error && !franchise && (
        <div className="relative p-6">
          <div className="flex items-center gap-3 border-l-2 border-red-500/50 bg-gradient-to-r from-red-500/10 to-transparent px-4 py-3">
            <CircleAlert className="h-4 w-4 text-red-400" />

            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* ==================================================
          EDIT MODE
      ================================================== */}

      {!loading && franchise && isEditing && (
        <div className="relative px-5 py-7 sm:px-7 lg:px-8">
          <div className="w-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-emerald-400">
                  Edit franchise
                </p>

                <p className="mt-1 text-sm text-zinc-600">
                  Update the organization profile
                </p>
              </div>

              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-900 hover:text-white disabled:opacity-50"
                aria-label="Close edit"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-7 space-y-7">
              {/* NAME */}

              <div>
                <label
                  htmlFor="franchise-name"
                  className="mb-2 block text-[11px] font-mono uppercase tracking-[0.14em] text-zinc-600"
                >
                  Franchise Name
                </label>

                <input
                  id="franchise-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full border-b border-zinc-800 bg-transparent px-0 py-3 text-xl font-semibold tracking-tight text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-emerald-400"
                  placeholder="Franchise name"
                />
              </div>

              {/* TAX + CURRENCY */}

              <div className="grid gap-7 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="franchise-tax-id"
                    className="mb-2 block text-[11px] font-mono uppercase tracking-[0.14em] text-zinc-600"
                  >
                    Tax ID
                  </label>

                  <input
                    id="franchise-tax-id"
                    value={taxId}
                    onChange={(event) => setTaxId(event.target.value)}
                    className="w-full border-b border-zinc-800 bg-transparent px-0 py-3 text-sm font-mono text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-emerald-400"
                    placeholder="Tax ID"
                  />
                </div>

                <div>
                  <label
                    htmlFor="franchise-currency"
                    className="mb-2 block text-[11px] font-mono uppercase tracking-[0.14em] text-zinc-600"
                  >
                    Currency
                  </label>

                  <select
                    id="franchise-currency"
                    value={defaultCurrency}
                    onChange={(event) => setDefaultCurrency(event.target.value)}
                    className="w-full border-b border-zinc-800 bg-transparent px-0 py-3 text-sm text-white outline-none transition-colors focus:border-emerald-400"
                  >
                    <option value="INR" className="text-black">
                      INR — Indian Rupee
                    </option>

                    <option value="USD" className="text-black">
                      USD — US Dollar
                    </option>

                    <option value="EUR" className="text-black">
                      EUR — Euro
                    </option>

                    <option value="GBP" className="text-black">
                      GBP — British Pound
                    </option>
                  </select>
                </div>
              </div>

              {/* ERROR */}

              {error && (
                <div className="flex items-center gap-3 border-l-2 border-red-500/50 bg-red-500/5 px-4 py-3">
                  <CircleAlert className="h-4 w-4 shrink-0 text-red-400" />

                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* ACTIONS */}

              <div className="flex items-center gap-4 border-t border-zinc-800 pt-5">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-500 transition-colors hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-2.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-950 shadow-[0_0_20px_rgba(52,211,153,0.1)] transition-all hover:from-emerald-300 hover:to-emerald-400 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving
                    </>
                  ) : (
                    <>
                      <Save className="h-3 w-3" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          DISPLAY MODE
      ================================================== */}

      {!loading && franchise && !isEditing && (
        <div className="relative">
          {/* PRIMARY IDENTITY */}

          <div className="px-5 pb-7 pt-7 sm:px-7 sm:pb-8 sm:pt-8 lg:px-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-600">
                      Organization
                    </span>

                    <span className="h-1 w-1 rounded-full bg-zinc-700" />

                    <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-zinc-700">
                      Franchise
                    </span>
                  </div>

                  <h1 className="mt-1.5 bg-gradient-to-r from-white via-zinc-100 to-emerald-300 bg-clip-text text-3xl font-semibold tracking-[-0.02em] text-transparent drop-shadow-[0_0_18px_rgba(52,211,153,0.08)] sm:text-4xl">
                    {franchise.name}
                  </h1>
                </div>
              </div>

              {/* USER IDENTITY */}

              {user && (
                <div className="sm:text-right">
                  <div className="flex items-center gap-2 sm:justify-end">
                    <UserRound className="h-3.5 w-3.5 text-zinc-600" />

                    <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-600">
                      Signed in as
                    </span>
                  </div>

                  <p className="mt-1 text-sm font-medium text-zinc-200">
                    {user.name}
                  </p>

                  <p className="mt-0.5 text-xs text-zinc-600">{user.email}</p>

                  {systemUser && (
                    <p className="mt-1 text-xs text-emerald-400/70">
                      {systemUser.firstName} {systemUser.lastName}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* PRIMARY DETAILS */}

          <div className="relative border-y border-zinc-800/80">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4">
              {/* CURRENCY */}

              <div className="group/item relative px-5 py-5 sm:border-r sm:border-zinc-800/80 sm:px-7 lg:px-8">
                <div className="absolute bottom-0 left-0 h-px w-0 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent transition-all duration-300 group-hover/item:w-full" />

                <div className="flex items-center gap-2">
                  <Coins className="h-3.5 w-3.5 text-amber-400" />

                  <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-zinc-600">
                    Currency
                  </span>
                </div>

                <p className="mt-3 text-lg font-semibold text-white">
                  {franchise.defaultCurrency}
                </p>
              </div>

              {/* TAX ID */}

              <div className="group/item relative border-t border-zinc-800/80 px-5 py-5 sm:border-t-0 sm:border-r sm:px-7 lg:px-8">
                <div className="absolute bottom-0 left-0 h-px w-0 bg-gradient-to-r from-transparent via-sky-400/60 to-transparent transition-all duration-300 group-hover/item:w-full" />

                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-sky-400" />

                  <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-zinc-600">
                    Tax ID
                  </span>
                </div>

                <p className="mt-3 truncate text-sm font-mono text-zinc-300">
                  {franchise.taxId ?? "Not configured"}
                </p>
              </div>

              {/* ESTABLISHED */}

              <div className="group/item relative border-t border-zinc-800/80 px-5 py-5 sm:border-t-0 sm:border-r sm:px-7 lg:px-8">
                <div className="absolute bottom-0 left-0 h-px w-0 bg-gradient-to-r from-transparent via-violet-400/60 to-transparent transition-all duration-300 group-hover/item:w-full" />

                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-violet-400" />

                  <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-zinc-600">
                    Established
                  </span>
                </div>

                <p className="mt-3 text-sm font-mono text-zinc-300">
                  {formatDate(franchise.createdAt)}
                </p>
              </div>

              {/* LAST UPDATED */}

              <div className="group/item relative border-t border-zinc-800/80 px-5 py-5 sm:col-span-2 lg:col-span-1 sm:border-t-0 sm:px-7 lg:px-8">
                <div className="absolute bottom-0 left-0 h-px w-0 bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent transition-all duration-300 group-hover/item:w-full" />

                <div className="flex items-center gap-2">
                  <Fingerprint className="h-3.5 w-3.5 text-emerald-400" />

                  <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-zinc-600">
                    Last Updated
                  </span>
                </div>

                <p className="mt-3 text-sm font-mono text-zinc-300">
                  {formatDate(franchise.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* ACCOUNT / AUTH */}

          {systemUser && (
            <div className="px-5 py-5 sm:px-7 lg:px-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />

                    <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-zinc-600">
                      Account
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                    {/* ROLE */}

                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-700">
                        Role
                      </span>

                      <p className="mt-1 text-sm font-semibold uppercase text-zinc-300">
                        {role}
                      </p>
                    </div>

                    <span className="hidden h-6 w-px bg-zinc-800 sm:block" />

                    {/* EMAIL */}

                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-700">
                        Email
                      </span>

                      <p className="mt-1 text-sm text-zinc-400">
                        {user?.email ?? "—"}
                      </p>
                    </div>

                    <span className="hidden h-6 w-px bg-zinc-800 sm:block" />

                    {/* VERIFICATION */}

                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-700">
                        Verification
                      </span>

                      <p
                        className={`mt-1 flex items-center gap-1.5 text-sm font-semibold uppercase ${
                          emailVerified ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {emailVerified ? (
                          <BadgeCheck className="h-3 w-3" />
                        ) : (
                          <Mail className="h-3 w-3" />
                        )}

                        {emailVerified ? "Verified" : "Unverified"}
                      </p>
                    </div>

                    <span className="hidden h-6 w-px bg-zinc-800 sm:block" />

                    {/* STATUS */}

                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-700">
                        Status
                      </span>

                      <p
                        className={`mt-1 flex items-center gap-1.5 text-sm font-semibold uppercase ${
                          accountActive ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            accountActive
                              ? "bg-emerald-400 shadow-[0_0_7px_rgba(52,211,153,0.7)]"
                              : "bg-red-400"
                          }`}
                        />

                        {accountActive ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* SYSTEM USER METADATA */}

                <div className="border-t border-zinc-800 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="h-3 w-3 text-zinc-700" />

                    <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-700">
                      System User
                    </span>
                  </div>

                  <p className="mt-1 text-[11px] font-mono text-zinc-600">
                    {systemUser.id}
                  </p>

                  <p className="mt-2 text-[10px] font-mono text-zinc-700">
                    Last login: {formatDate(systemUser.lastLoginAt)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* FOOTER */}

          <div className="flex flex-col gap-2 border-t border-zinc-800/80 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-7 lg:px-8">
            <div className="flex min-w-0 items-center gap-2">
              <Fingerprint className="h-3 w-3 shrink-0 text-zinc-700" />

              <span className="truncate text-[10px] font-mono tracking-[0.06em] text-zinc-700">
                {franchise.id}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-700">
                Organization Service
              </span>

              <span className="h-1 w-1 rounded-full bg-zinc-700" />

              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-emerald-400">
                Connected
              </span>

              {success && (
                <>
                  <span className="h-1 w-1 rounded-full bg-zinc-700" />

                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                    Saved
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
