"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Store, X } from "lucide-react";

import { updateRestaurantMenuItem } from "@/lib/catalog-api";

interface Restaurant {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  name: string;
}

interface RestaurantConfig {
  restaurantMenuItemId: string;
}

interface Props {
  menuItem: MenuItem;
  restaurant: Restaurant;
  config: RestaurantConfig;
  initialPrice: number;
  initialIsAvailable: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

export default function RestaurantMenuEditDrawer({
  menuItem,
  restaurant,
  config,
  initialPrice,
  initialIsAvailable,
  onClose,
  onSaved,
}: Props) {
  const [price, setPrice] = useState(String(initialPrice));

  const [isAvailable, setIsAvailable] = useState(initialIsAvailable);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const parsedPrice = Number(price);

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError("Enter a valid price.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await updateRestaurantMenuItem(config.restaurantMenuItemId, {
        price: parsedPrice,
        isAvailable,
      });

      await onSaved();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update restaurant menu.",
      );
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          if (!saving) onClose();
        }}
      />

      <aside className="absolute right-0 top-0 h-full w-full max-w-md border-l border-zinc-800 bg-[#09090b] shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <Store className="h-4 w-4 text-emerald-400" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-white">
                Restaurant Configuration
              </h2>

              <p className="mt-1 font-mono text-[10px] text-zinc-600">
                {restaurant.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-white disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="font-mono text-[9px] text-zinc-600">MENU ITEM</p>

            <p className="mt-1 text-sm font-semibold text-white">
              {menuItem.name}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-mono font-bold text-zinc-500">
              SELLING PRICE
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              disabled={saving}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div>
              <p className="text-xs font-semibold text-white">
                Available for Sale
              </p>

              <p className="mt-1 text-[10px] text-zinc-600">
                Applies only to {restaurant.name}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAvailable((current) => !current)}
              disabled={saving}
              className={`relative h-6 w-11 rounded-full transition ${
                isAvailable ? "bg-emerald-500" : "bg-zinc-700"
              } disabled:opacity-50`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                  isAvailable ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-400">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl bg-emerald-500 py-3 text-xs font-bold text-black transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {saving ? "SAVING..." : "SAVE CONFIGURATION"}
          </button>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
