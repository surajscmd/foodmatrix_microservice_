"use client";

import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock3,
  MapPin,
  Pencil,
  Phone,
  ShieldAlert,
  Star,
  User,
} from "lucide-react";

import type { Restaurant } from "@/utils/types/organization";

interface DiagnosticViewProps {
  restaurant: Restaurant;

  canEdit: boolean;
  canDelete: boolean;

  onEdit: () => void;
  onDelete: () => void;

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
  canDelete,
  onEdit,
  onDelete,
  onUpdateStatus,
  onBack,
}: DiagnosticViewProps) {
  return (
    <div className="space-y-6 animate-fade-in p-6 ">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer"
            id="btn-back-to-franchise-grid"
            aria-label="Back to restaurants"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900/50 text-zinc-400">
                {restaurant.id}
              </span>

              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${getStatusClass(
                  restaurant.status,
                )}`}
              >
                {getStatusLabel(restaurant.status)}
              </span>
            </div>

            <h2 className="text-xl font-semibold text-white tracking-tight mt-1">
              {restaurant.name}
            </h2>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white hover:border-emerald-500/30 transition-all"
              id="btn-edit-restaurant"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/5 border border-rose-500/10 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all"
              id="btn-delete-restaurant"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Status Controller */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/80">
        <span className="text-[10px] font-mono text-zinc-400 px-2 uppercase">
          Core Pulse:
        </span>

        <div className="flex gap-1.5">
          {(["ACTIVE", "INACTIVE"] as const).map((status) => {
            const isActive = restaurant.status === status;

            return (
              <button
                key={status}
                type="button"
                onClick={() => void onUpdateStatus(restaurant.id, status)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono uppercase transition-all cursor-pointer ${
                  isActive
                    ? status === "ACTIVE"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                    : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                }`}
                id={`btn-node-status-${status}`}
              >
                {status === "ACTIVE" ? "Operational" : "Inactive"}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold">
              Node Registry
            </span>

            <h4 className="text-lg font-bold text-emerald-400 font-mono mt-1">
              Registered
            </h4>

            <p className="text-[10px] text-zinc-500">Organization Service</p>
          </div>

          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold">
              Workforce
            </span>

            <h4 className="text-lg font-bold text-white mt-1">Pending</h4>

            <p className="text-[10px] text-zinc-500">HR Service integration</p>
          </div>

          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold">
              Service Health
            </span>

            <h4 className="text-lg font-bold text-emerald-400 mt-1">Online</h4>

            <p className="text-[10px] text-zinc-500">
              Organization registry reachable
            </p>
          </div>

          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left */}
        <div className="lg:col-span-7 space-y-6">
          {/* Metadata */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono text-zinc-400 pb-2 border-b border-zinc-800">
              Node Connection Metas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-zinc-500 block">Node Name</span>

                <div className="flex items-center gap-2 text-white">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />

                  <span className="font-semibold">{restaurant.name}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-500 block">Node Location</span>

                <div className="flex items-start gap-2 text-white">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 mt-0.5" />

                  <span>
                    {restaurant.address}, {restaurant.city}
                    {restaurant.state ? `, ${restaurant.state}` : ""},{" "}
                    {restaurant.country}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-500 block">Operating Timezone</span>

                <div className="flex items-center gap-2 text-white font-mono">
                  <Clock3 className="w-3.5 h-3.5 text-emerald-400" />

                  <span>{restaurant.timezone}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-500 block">Franchise Link</span>

                <div className="text-white font-mono text-[10px] break-all">
                  {restaurant.franchiseId}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-500 block">Node Created</span>

                <div className="text-white font-mono text-[10px]">
                  {new Date(restaurant.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-500 block">
                  Last Registry Update
                </span>

                <div className="text-white font-mono text-[10px]">
                  {new Date(restaurant.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* POS */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono text-zinc-400">
              Real-Time POS Receipts Stream
            </h3>

            <div className="py-8 text-center border border-dashed border-zinc-800 rounded-xl">
              <ShieldAlert className="w-6 h-6 mx-auto mb-2 text-zinc-700" />

              <p className="text-zinc-500 font-mono text-[11px]">
                Order Service integration pending.
              </p>

              <p className="text-zinc-600 text-[10px] mt-1">
                Node: {restaurant.id}
              </p>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="lg:col-span-5 space-y-6">
          {/* Alerts */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono text-zinc-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />

              <span>Node Active Alarm Triggers</span>
            </h3>

            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex gap-3 items-center text-xs text-emerald-400">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />

              <div>
                <span className="font-semibold block">
                  Organization Systems OK
                </span>

                <span className="text-[10px] text-zinc-500">
                  Inventory monitoring will appear here after service
                  integration.
                </span>
              </div>
            </div>
          </div>

          {/* Workforce */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono text-zinc-400">
              Active Roster Checkin
            </h3>

            <div className="p-6 text-center border border-dashed border-zinc-800 rounded-xl">
              <User className="w-6 h-6 mx-auto mb-2 text-zinc-700" />

              <p className="text-zinc-500 font-mono text-[11px]">
                HR Service integration pending.
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />

              <span>
                Contact information is not part of the current Organization
                Restaurant model.
              </span>
            </div>
          </div>

          {/* Rating */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Star className="w-3.5 h-3.5 text-zinc-700" />

              <span>Rating data will come from analytics/review services.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
