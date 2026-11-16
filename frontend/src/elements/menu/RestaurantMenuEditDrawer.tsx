"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Store, X } from "lucide-react";

import {
  catalogError,
  createRestaurantMenuItem,
  updateRestaurantMenuItem,
} from "@/lib/catalog-api";

interface Restaurant {
  id: string;
  name: string;
  defaultCurrency?: string | null;
}

interface MenuItem {
  id: string;
  name: string;
}

interface RestaurantConfig {
  restaurantMenuItemId: string | null;
}

interface Props {
  menuItem: MenuItem;
  restaurant: Restaurant;
  config: RestaurantConfig;
  initialPrice: number;
  initialIsAvailable: boolean;
  presentation?: "drawer" | "modal";
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}

export default function RestaurantMenuEditDrawer({
  menuItem,
  restaurant,
  config,
  initialPrice,
  initialIsAvailable,
  presentation = "drawer",
  onClose,
  onSaved,
}: Props) {
  const [price, setPrice] = useState(String(initialPrice));

  const [isAvailable, setIsAvailable] = useState(initialIsAvailable);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const priceId = useId();
  const parsedPrice = Number(price);
  const priceChanged = parsedPrice !== initialPrice;
  const availabilityChanged = isAvailable !== initialIsAvailable;
  const changed = priceChanged || availabilityChanged;
  const centered = presentation === "modal";

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !changed) return;
    if (!price.trim() || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError("Enter a valid price.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const changes = {
        ...(priceChanged && { price: parsedPrice }),
        ...(availabilityChanged && { isAvailable }),
      };
      if (config.restaurantMenuItemId) {
        await updateRestaurantMenuItem(config.restaurantMenuItemId, changes);
      } else {
        await createRestaurantMenuItem({
          restaurantId: restaurant.id,
          menuItemId: menuItem.id,
          ...changes,
        });
      }
    } catch (error) {
      setError(catalogError(error, "Unable to save the restaurant menu item."));
      return;
    } finally {
      setSaving(false);
    }
    try {
      await onSaved();
    } catch {
      setError("Changes were saved. Refresh the menu to see the latest values.");
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!saving) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
      className={`fixed max-w-md overflow-hidden border-zinc-700 bg-[#111217] p-0 text-zinc-100 shadow-2xl shadow-black/50 backdrop:bg-black/65 backdrop:backdrop-blur-sm ${
        centered
          ? "inset-0 m-auto w-[calc(100%-2rem)] rounded-2xl border"
          : "inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full border-l"
      }`}
    >
      <form onSubmit={handleSave} className={`flex flex-col ${centered ? "max-h-[calc(100dvh-2rem)]" : "h-full"}`}>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-emerald-400/20 bg-linear-to-r from-[#213d34] to-[#232429] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <Store className="h-4 w-4 text-emerald-400" />
            </div>

            <div>
              <h2 id={titleId} className="text-sm font-semibold text-white">
                Edit restaurant menu item
              </h2>

              <p className="mt-0.5 text-xs text-zinc-300">
                {restaurant.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close menu item editor"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-zinc-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 space-y-4 overflow-y-auto p-5">
          <p className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-3.5 py-3 text-sm font-semibold text-white">
            {menuItem.name}
          </p>

          <div>
            <label htmlFor={priceId} className="mb-2 flex items-center justify-between gap-2 text-xs font-medium text-zinc-300">
              <span>Selling price</span>
              {restaurant.defaultCurrency && (
                <span className="text-zinc-400">{restaurant.defaultCurrency}</span>
              )}
            </label>

            <input
              type="number"
              id={priceId}
              min="0"
              max="99999999.99"
              step="0.01"
              inputMode="decimal"
              required
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              disabled={saving}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5">
            <div>
              <p className="text-xs font-semibold text-white">
                Available to order
              </p>

              <p className="mt-1 text-xs text-zinc-400">
                Show this item on the restaurant ordering menu.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isAvailable}
              aria-label="Available to order"
              onClick={() => setIsAvailable((current) => !current)}
              disabled={saving}
              className={`relative h-6 w-11 shrink-0 rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 ${
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
            <div role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-400">
              {error}
            </div>
          )}
        </div>
        <footer className="flex shrink-0 justify-end gap-2 border-t border-zinc-800 bg-zinc-950/35 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-zinc-700 px-3.5 py-2 text-xs font-medium text-zinc-200 enabled:hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !changed}
            className="rounded-lg bg-emerald-300 px-4 py-2 text-xs font-semibold text-emerald-950 transition enabled:hover:bg-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
