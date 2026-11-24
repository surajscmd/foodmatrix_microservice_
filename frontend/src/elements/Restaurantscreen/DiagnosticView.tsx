"use client";

import { ArrowLeft, Building2, MapPin, Pencil } from "lucide-react";
import { useOrganizationStore } from "@/store/organization-store";
import type { Restaurant } from "@/utils/types/organization";
import RestaurantRecordDetails from "./RestaurantRecordDetails";
import RestaurantOperationalOverview from "./RestaurantOperationalOverview";

interface DiagnosticViewProps {
  restaurant: Restaurant;

  canEdit: boolean;
  canChangeStatus: boolean;
  updatingStatus?: boolean;

  onEdit: () => void;

  onUpdateStatus: (id: string, status: Restaurant["status"]) => Promise<void>;

  onBack: () => void;
}

function getStatusLabel(status: Restaurant["status"]) {
  return status === "ACTIVE" ? "Operational" : "Inactive";
}

function getStatusClass(status: Restaurant["status"]) {
  return status === "ACTIVE"
    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
    : "bg-zinc-800 text-zinc-400 border border-zinc-700/50";
}

export default function DiagnosticView({
  restaurant,
  canEdit,
  canChangeStatus,
  updatingStatus = false,
  onEdit,
  onUpdateStatus,
  onBack,
}: DiagnosticViewProps) {
  const franchise = useOrganizationStore((state) => state.franchise);
  const linkedFranchise =
    franchise?.id === restaurant.franchiseId ? franchise : null;
  const currency =
    restaurant.defaultCurrency ?? linkedFranchise?.defaultCurrency;
  return (
    <div className="@container space-y-6 p-6 motion-safe:animate-fade-in">
      <button
        type="button"
        onClick={onBack}
        disabled={updatingStatus}
        id="btn-back-to-franchise-grid"
        className="inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-xs font-medium text-zinc-300 hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-300"
      >
        <ArrowLeft size={14} aria-hidden /> Back to restaurants
      </button>
      <section
        aria-labelledby="restaurant-detail-title"
        className="relative overflow-hidden rounded-3xl border border-zinc-800/90 bg-gradient-to-br from-[#0d1117] via-[#090b0f] to-[#07090c] shadow-[0_12px_40px_rgba(0,0,0,0.15)]"
      >
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-cyan-400/40"
        />
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-6 @xl:px-6">
          <div className="flex min-w-0 flex-1 basis-64 items-center gap-3">
            <span
              aria-hidden
              className="grid size-14 shrink-0 place-items-center rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-400/15 via-cyan-400/10 to-violet-400/10 text-emerald-300 shadow-[0_0_24px_rgba(52,211,153,0.06)]"
            >
              <Building2 size={24} strokeWidth={1.7} />
            </span>
            <div className="min-w-0">
              <p className="mb-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Restaurant profile
              </p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2
                  id="restaurant-detail-title"
                  className="break-words text-xl font-semibold tracking-tight text-white"
                >
                  {restaurant.name}
                </h2>
                <span
                  className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusClass(restaurant.status)}`}
                >
                  {getStatusLabel(restaurant.status)}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                <span className="inline-flex min-w-0 items-center gap-1">
                  <MapPin size={12} className="shrink-0" aria-hidden />
                  <span className="break-words">{restaurant.city}</span>
                </span>
                <span className="break-all rounded border border-white/10 bg-black/15 px-1.5 py-0.5 font-mono text-[11px] text-zinc-200">
                  {restaurant.id}
                </span>
              </div>
            </div>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={onEdit}
              disabled={updatingStatus}
              id="btn-edit-restaurant"
              className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 text-xs font-semibold text-zinc-300 transition-colors hover:border-emerald-500/30 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-300"
            >
              <Pencil size={13} aria-hidden /> Edit restaurant
            </button>
          )}
        </div>
      </section>

      {canChangeStatus && (
        <section
          aria-label="Restaurant status"
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2"
        >
          <div>
            <h3 className="px-2 font-mono text-[10px] uppercase text-zinc-400">
              Core Pulse:
            </h3>
          </div>
          <div
            role="group"
            aria-label="Change restaurant status"
            className="flex gap-1.5"
          >
            {(["ACTIVE", "INACTIVE"] as const).map((status) => (
              <button
                key={status}
                type="button"
                aria-pressed={restaurant.status === status}
                disabled={updatingStatus || restaurant.status === status}
                onClick={() => void onUpdateStatus(restaurant.id, status)}
                id={`btn-node-status-${status}`}
                className={`min-h-9 rounded-lg border px-3 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:cursor-default ${restaurant.status === status ? getStatusClass(status) : "border-zinc-800 bg-zinc-950 text-zinc-500 enabled:hover:border-zinc-700 enabled:hover:text-zinc-200"} ${updatingStatus ? "opacity-50" : ""}`}
              >
                {getStatusLabel(status)}
              </button>
            ))}
          </div>
        </section>
      )}
      <RestaurantOperationalOverview
        key={restaurant.id}
        restaurant={restaurant}
        currency={currency}
        recordDetails={
          <RestaurantRecordDetails
            restaurant={restaurant}
            franchise={linkedFranchise}
          />
        }
      />
    </div>
  );
}
