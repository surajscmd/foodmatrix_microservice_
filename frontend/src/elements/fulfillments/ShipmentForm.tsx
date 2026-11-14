"use client";

import { useState } from "react";
import { Loader2, Truck } from "lucide-react";

import {
  inventoryInputClass,
  inventoryLabelClass,
} from "@/elements/rawmaterial/InventoryShared";

import type { CreateShipmentInput } from "@/utils/types/inventory";

interface Props {
  saving: boolean;
  disabled: boolean;
  onSubmit: (input: CreateShipmentInput) => Promise<void>;
}

const fields = [
  { key: "carrierName", label: "Carrier", max: 150 },
  { key: "trackingNumber", label: "Tracking Number", max: 150 },
  { key: "dispatcherName", label: "Dispatcher", max: 150 },
  { key: "dispatcherPhone", label: "Dispatcher Phone", max: 30 },
  { key: "driverName", label: "Driver", max: 150 },
  { key: "driverPhone", label: "Driver Phone", max: 30 },
  { key: "vehicleNumber", label: "Vehicle Number", max: 50 },
  { key: "vehicleType", label: "Vehicle Type", max: 100 },
  { key: "dispatchLocation", label: "Dispatch Location", max: 255 },
  { key: "deliveryLocation", label: "Delivery Location", max: 255 },
] as const;

export default function ShipmentForm({
  saving,
  disabled,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<CreateShipmentInput>({});
  const [arrival, setArrival] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();

        const input: CreateShipmentInput = {};

        for (const field of fields) {
          const value = values[field.key]?.trim();
          if (value) input[field.key] = value;
        }

        if (arrival) {
          input.estimatedArrival = new Date(arrival).toISOString();
        }

        if (notes.trim()) input.notes = notes.trim();

        void onSubmit(input);
      }}
      className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4"
    >
      <p className={inventoryLabelClass}>Register Shipment</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <label htmlFor={field.key} className={inventoryLabelClass}>
              {field.label}
            </label>
            <input
              id={field.key}
              value={values[field.key] ?? ""}
              maxLength={field.max}
              disabled={saving || disabled}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  [field.key]: event.target.value,
                }))
              }
              className={inventoryInputClass}
            />
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="shipment-arrival" className={inventoryLabelClass}>
          Estimated Arrival
        </label>
        <input
          id="shipment-arrival"
          type="datetime-local"
          value={arrival}
          disabled={saving || disabled}
          onChange={(event) => setArrival(event.target.value)}
          className={inventoryInputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="shipment-notes" className={inventoryLabelClass}>
          Notes
        </label>
        <textarea
          id="shipment-notes"
          rows={3}
          maxLength={500}
          value={notes}
          disabled={saving || disabled}
          onChange={(event) => setNotes(event.target.value)}
          className={`${inventoryInputClass} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={saving || disabled}
        className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Truck className="h-4 w-4" />
        )}
        Create Shipment
      </button>
    </form>
  );
}