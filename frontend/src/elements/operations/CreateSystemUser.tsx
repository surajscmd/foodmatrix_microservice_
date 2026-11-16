"use client";

import { useOrganizationStore } from "@/store/organization-store";

import {
  ArrowRight,
  CircleAlert,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  Store,
  UserPlus,
  X,
} from "lucide-react";

import { useState } from "react";

type SystemUserRole =
  | "SUPER_ADMIN"
  | "FRANCHISE_ADMIN"
  | "RESTAURANT_ADMIN"
  | "STAFF"
  | "OPERATIONS";

const roleLabels: Record<SystemUserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  FRANCHISE_ADMIN: "Franchise Admin",
  RESTAURANT_ADMIN: "Restaurant Admin",
  STAFF: "Staff",
  OPERATIONS: "Operations",
};

export default function CreateSystemUser() {
  // ============================================================
  // ZUSTAND
  // ============================================================

  const franchise = useOrganizationStore((state) => state.franchise);

  const allRestaurants = useOrganizationStore((state) => state.restaurants);
  const creatorRole = useOrganizationStore((state) => state.currentUser?.systemUser.role);
  const restaurants = allRestaurants.filter((item) => item.franchiseId === franchise?.id);

  // ============================================================
  // UI STATE
  // ============================================================

  const [isOpen, setIsOpen] = useState(false);

  // ============================================================
  // FORM STATE
  // ============================================================

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");

  const [userRole, setUserRole] = useState<SystemUserRole>("RESTAURANT_ADMIN");

  const [managedRestaurantId, setManagedRestaurantId] = useState("");

  const [isCreating, setIsCreating] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);

  // ============================================================
  // ROLE LOGIC
  // ============================================================

  if (creatorRole !== "SUPER_ADMIN" && creatorRole !== "FRANCHISE_ADMIN") return null;

  const restaurantRequired = [
    "RESTAURANT_ADMIN",
    "STAFF",
    "OPERATIONS",
  ].includes(userRole);

  const activeRestaurants = restaurants.filter(
    (restaurant) =>
      restaurant.status === "ACTIVE" && restaurant.franchiseId === franchise?.id,
  );
  const selectedRestaurant = activeRestaurants.find(
    (restaurant) => restaurant.id === managedRestaurantId,
  );

  // ============================================================
  // FORM RESET
  // ============================================================

  const resetForm = () => {
    setUserName("");
    setUserEmail("");
    setUserPassword("");
    setUserRole("RESTAURANT_ADMIN");
    setManagedRestaurantId("");
    setCreateUserError(null);
  };

  // ============================================================
  // OPEN
  // ============================================================

  const handleOpen = () => {
    if (isCreating) return;

    resetForm();
    setIsOpen(true);
  };

  // ============================================================
  // CLOSE
  // ============================================================

  const handleClose = () => {
    if (isCreating) return;

    resetForm();
    setIsOpen(false);
  };

  // ============================================================
  // CREATE USER
  // ============================================================

  const handleCreateUser = async () => {
    if (!franchise?.id) {
      setCreateUserError("Franchise information is not available.");
      return;
    }

    if (!userName.trim()) {
      setCreateUserError("Name is required.");
      return;
    }

    if (!userEmail.trim()) {
      setCreateUserError("Email is required.");
      return;
    }

    if (!userPassword.trim()) {
      setCreateUserError("Password is required.");
      return;
    }

    if (restaurantRequired && !selectedRestaurant) {
      setCreateUserError("Restaurant is required for this role.");
      return;
    }

    try {
      setIsCreating(true);
      setCreateUserError(null);

      const response = await fetch("/api/organization/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: userName.trim(),
          email: userEmail.trim(),
          password: userPassword,
          role: userRole,
          franchiseId: franchise.id,
          managedRestaurantId: managedRestaurantId.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Unable to create system user.");
      }

      resetForm();
      setIsOpen(false);
    } catch (err) {
      console.error("Failed to create system user:", err);

      setCreateUserError(
        err instanceof Error ? err.message : "Unable to create system user.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  // ============================================================
  // CLOSED STATE
  // ============================================================

  if (!isOpen) {
    return (
      <div className=" w-full">
        <button
          type="button"
          onClick={handleOpen}
          disabled={!franchise}
          className="group flex w-full items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-4 py-3.5 text-left transition-all duration-200 hover:border-emerald-400/30 hover:bg-zinc-900/50"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-400/15 bg-emerald-400/[0.06]">
              <UserPlus className="h-3.5 w-3.5 text-emerald-400" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-zinc-300 transition-colors group-hover:text-white">
                  Create system user
                </p>

                <span className="h-1 w-1 rounded-full bg-zinc-700" />

                <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-600">
                  Access management
                </span>
              </div>

              <p className="mt-1 text-[11px] text-zinc-600">
                Add a user and configure organization access
              </p>
            </div>
          </div>

          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-800 text-zinc-600 transition-all group-hover:border-emerald-400/20 group-hover:text-emerald-400">
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </div>
        </button>
      </div>
    );
  }
//   if (!isOpen) {
//     return (
//       <div className="w-full w-full border border-zinc-800/80 ">
//         <button
//           type="button"
//           onClick={handleOpen}
//           className="group flex w-full items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-4 py-3.5 text-left transition-all duration-200 hover:border-emerald-400/30 hover:bg-zinc-900/50"
//         >
//           <div className="flex min-w-0 items-center gap-3">
//             <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06]">
//               <UserPlus className="h-3.5 w-3.5 text-emerald-400" />
//             </div>

//             <div className="min-w-0">
//               <div className="flex items-center gap-2">
//                 <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-zinc-300 group-hover:text-white">
//                   Create system user
//                 </p>

//                 <span className="h-1 w-1 rounded-full bg-zinc-700" />

//                 <span className="text-[8px] font-mono uppercase tracking-wider text-zinc-600">
//                   Access management
//                 </span>
//               </div>

//               <p className="mt-1 text-[11px] text-zinc-600">
//                 Add a user and configure organization access
//               </p>
//             </div>
//           </div>

//           <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-800 text-zinc-600 transition-all group-hover:border-emerald-400/30 group-hover:text-emerald-400">
//             <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
//           </div>
//         </button>
//       </div>
//     );
//   }

  // ============================================================
  // OPEN STATE
  // ============================================================

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/30">
      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="flex items-center justify-between border-b border-zinc-900/80 px-5 py-5 sm:px-7 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/[0.07]">
            <UserPlus className="h-4 w-4 text-emerald-400" />

            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-emerald-400">
                New system user
              </p>

              <span className="rounded border border-emerald-400/15 bg-emerald-400/[0.05] px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider text-emerald-400/70">
                Draft
              </span>
            </div>

            <p className="mt-1 text-xs text-zinc-500">
              Configure identity and organization access
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClose}
          disabled={isCreating}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-600 transition-all hover:border-zinc-700 hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Close create user"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ========================================================
          FORM
      ======================================================== */}

      <div className="px-5 py-6 sm:px-7 sm:py-7 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          {/* ====================================================
              IDENTITY
          ==================================================== */}

          <section>
            <div className="mb-5 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />

              <p className="text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-zinc-500">
                Identity
              </p>

              <div className="h-px flex-1 bg-zinc-900" />
            </div>

            <div className="space-y-4">
              {/* NAME */}
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 transition-colors focus-within:border-zinc-700">
                <div className="mb-2 flex items-center gap-2">
                  <UserPlus className="h-3 w-3 text-zinc-600" />

                  <label
                    htmlFor="system-user-name"
                    className="text-[8px] font-mono font-semibold uppercase tracking-[0.16em] text-zinc-600"
                  >
                    Full name
                  </label>
                </div>

                <input
                  id="system-user-name"
                  value={userName}
                  onChange={(event) => setUserName(event.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-zinc-700"
                  placeholder="Enter user's full name"
                  autoComplete="name"
                />
              </div>

              {/* EMAIL */}
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 transition-colors focus-within:border-zinc-700">
                <div className="mb-2 flex items-center gap-2">
                  <Mail className="h-3 w-3 text-zinc-600" />

                  <label
                    htmlFor="system-user-email"
                    className="text-[8px] font-mono font-semibold uppercase tracking-[0.16em] text-zinc-600"
                  >
                    Email address
                  </label>
                </div>

                <input
                  id="system-user-email"
                  type="email"
                  value={userEmail}
                  onChange={(event) => setUserEmail(event.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-700"
                  placeholder="user@foodmatrix.local"
                  autoComplete="email"
                />
              </div>

              {/* PASSWORD */}
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 transition-colors focus-within:border-zinc-700">
                <div className="mb-2 flex items-center gap-2">
                  <KeyRound className="h-3 w-3 text-zinc-600" />

                  <label
                    htmlFor="system-user-password"
                    className="text-[8px] font-mono font-semibold uppercase tracking-[0.16em] text-zinc-600"
                  >
                    Initial password
                  </label>
                </div>

                <input
                  id="system-user-password"
                  type="password"
                  value={userPassword}
                  onChange={(event) => setUserPassword(event.target.value)}
                  className="w-full bg-transparent text-sm font-mono text-white outline-none placeholder:text-zinc-700"
                  placeholder="Enter temporary password"
                  autoComplete="new-password"
                />
              </div>
            </div>
          </section>

          {/* ====================================================
              ACCESS
          ==================================================== */}

          <section>
            <div className="mb-5 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

              <p className="text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-zinc-500">
                Access
              </p>

              <div className="h-px flex-1 bg-zinc-900" />
            </div>

            <div className="space-y-4">
              {/* ROLE */}
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3 text-zinc-600" />

                    <label
                      htmlFor="system-user-role"
                      className="text-[8px] font-mono font-semibold uppercase tracking-[0.16em] text-zinc-600"
                    >
                      System role
                    </label>
                  </div>

                  <span className="text-[8px] font-mono uppercase tracking-wider text-emerald-400/60">
                    Required
                  </span>
                </div>

                <select
                  id="system-user-role"
                  value={userRole}
                  onChange={(event) => {
                    const role = event.target.value as SystemUserRole;

                    setUserRole(role);

                    if (
                      !["RESTAURANT_ADMIN", "STAFF", "OPERATIONS"].includes(
                        role,
                      )
                    ) {
                      setManagedRestaurantId("");
                    }
                  }}
                  className="w-full appearance-none rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2.5 text-xs font-medium text-zinc-200 outline-none transition-colors focus:border-emerald-400/40"
                >
                  <option
                    value="RESTAURANT_ADMIN"
                    className="bg-zinc-950 text-white"
                  >
                    Restaurant Admin
                  </option>

                  <option value="STAFF" className="bg-zinc-950 text-white">
                    Staff
                  </option>

                  <option value="OPERATIONS" className="bg-zinc-950 text-white">
                    Operations
                  </option>
                  {creatorRole === "SUPER_ADMIN" && (
                    <>
                      <option value="FRANCHISE_ADMIN">Franchise Admin</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                    </>
                  )}
                </select>

                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[9px] text-zinc-700">
                    Assigned role
                  </span>

                  <span className="text-[9px] font-mono text-zinc-500">
                    {roleLabels[userRole]}
                  </span>
                </div>
              </div>

              {/* RESTAURANT */}
              <div
                className={`rounded-xl border bg-zinc-950/60 p-4 transition-colors ${
                  restaurantRequired
                    ? "border-zinc-800/80"
                    : "border-zinc-900/60 opacity-50"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="h-3 w-3 text-zinc-600" />

                    <label
                      htmlFor="system-user-restaurant"
                      className="text-[8px] font-mono font-semibold uppercase tracking-[0.16em] text-zinc-600"
                    >
                      Restaurant scope
                    </label>
                  </div>

                  <span className="text-[8px] font-mono uppercase tracking-wider text-zinc-600">
                    {restaurantRequired ? "Required" : "Not required"}
                  </span>
                </div>

                <select
                  id="system-user-restaurant"
                  value={managedRestaurantId}
                  onChange={(event) =>
                    setManagedRestaurantId(event.target.value)
                  }
                  disabled={!restaurantRequired}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2.5 text-xs font-medium text-zinc-200 outline-none transition-colors focus:border-emerald-400/40 disabled:cursor-not-allowed"
                >
                  <option value="" className="bg-zinc-950 text-white">
                    {restaurantRequired
                      ? "Select restaurant"
                      : "Not required for this role"}
                  </option>

                  {activeRestaurants.map((restaurant) => (
                    <option
                      key={restaurant.id}
                      value={restaurant.id}
                      className="bg-zinc-950 text-white"
                    >
                      {restaurant.name}
                    </option>
                  ))}
                </select>

                {restaurantRequired && selectedRestaurant && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                    <span className="text-[9px] text-zinc-600">Scope:</span>

                    <span className="text-[9px] font-mono text-zinc-400">
                      {selectedRestaurant.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* ======================================================
            ERROR
        ====================================================== */}

        {createUserError && (
          <div className="mt-7 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.04] px-4 py-3">
            <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />

            <div>
              <p className="text-[9px] font-mono font-semibold uppercase tracking-wider text-red-400">
                Unable to create user
              </p>

              <p className="mt-1 text-xs text-red-400/70">{createUserError}</p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          ACTION BAR
      ======================================================== */}

      <div className="flex flex-col gap-4 border-t border-zinc-900/80 bg-zinc-950/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 lg:px-8">
        <div className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isCreating ? "animate-pulse bg-amber-400" : "bg-emerald-400"
            }`}
          />

          <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-zinc-600">
            {isCreating ? "Creating user" : "Ready to create"}
          </span>

          {!isCreating && (
            <>
              <span className="text-zinc-800">/</span>

              <span className="text-[9px] font-mono text-zinc-700">
                {roleLabels[userRole]}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isCreating}
            className="rounded-lg px-4 py-2.5 text-[9px] font-mono font-semibold uppercase tracking-wider text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => void handleCreateUser()}
            disabled={isCreating}
            className="group inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2.5 text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-950 transition-all hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Creating
              </>
            ) : (
              <>
                Create user
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
