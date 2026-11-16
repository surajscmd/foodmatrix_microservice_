"use client";

import { useState, type FormEvent } from "react";
import { Check, SlidersHorizontal } from "lucide-react";
import WorkforceFormDialog from "@/elements/restaurantworkforce/WorkforceFormDialog";
import {
  itemPriceInCents,
  type CashierModifierGroup,
  type CartModifier,
} from "./cashier-modifiers";
import type { RegisterMenuItem } from "./MenuCatalog";

export default function ModifierPicker({
  item,
  groups,
  initialModifiers,
  quantity,
  editing,
  blocked,
  formatMoney,
  onClose,
  onSave,
}: {
  item: RegisterMenuItem;
  groups: CashierModifierGroup[];
  initialModifiers: CartModifier[];
  quantity: number;
  editing: boolean;
  blocked: boolean;
  formatMoney: (amount: number) => string;
  onClose: () => void;
  onSave: (modifiers: CartModifier[]) => void;
}) {
  const [selectedIds, setSelectedIds] = useState(
    () => new Set(initialModifiers.map(({ id }) => id)),
  );
  const chosenGroups = groups.map((group) => ({
    group,
    selected: group.options.filter(({ id }) => selectedIds.has(id)),
  }));
  const modifiers = chosenGroups.flatMap(({ selected }) => selected);
  const valid =
    modifiers.length > 0 &&
    chosenGroups.every(
      ({ group, selected }) =>
        selected.length >= group.minSelections &&
        selected.length <= group.maxSelections,
    );
  const total = (itemPriceInCents(item.price, modifiers) * quantity) / 100;

  function toggle(group: CashierModifierGroup, id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.delete(id)) return next;

      const count = group.options.filter((option) =>
        current.has(option.id),
      ).length;
      if (group.maxSelections === 1) {
        for (const option of group.options) next.delete(option.id);
      } else if (count >= group.maxSelections) {
        return current;
      }
      next.add(id);
      return next;
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (valid && !blocked) onSave(modifiers);
  }

  return (
    <WorkforceFormDialog
      title={editing ? "Edit item options" : "Choose item options"}
      icon={SlidersHorizontal}
      saving={false}
      onClose={onClose}
      onSubmit={submit}
      actions={
        <>
          <button
            type="button"
            disabled={blocked}
            onClick={() => {
              if (!blocked) onSave([]);
            }}
            className="min-h-9 rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-3 text-xs font-semibold text-emerald-100 enabled:hover:bg-emerald-400/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:opacity-45"
          >
            {editing ? "Save without modifiers" : "Add without modifiers"}
          </button>
          <button
            type="submit"
            disabled={!valid || blocked}
            className="min-h-9 rounded-lg bg-emerald-300 px-3 text-xs font-semibold text-emerald-950 enabled:hover:bg-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:opacity-45"
          >
            {editing ? "Save options" : "Add with modifiers"} · {formatMoney(total)}
          </button>
        </>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-white">{item.name}</p>
        <p className="text-xs text-zinc-300">
          {formatMoney(item.price)} base price
        </p>
      </div>

      {chosenGroups.map(({ group, selected }) => {
        const required = group.minSelections > 0;
        const selectionLabel = required
          ? group.minSelections === group.maxSelections
            ? `Choose ${group.minSelections}`
            : `Choose ${group.minSelections}–${group.maxSelections}`
          : `Optional · Choose up to ${group.maxSelections}`;

        return (
          <fieldset
            key={group.id}
            className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-950/45 px-3 pt-2 pb-3"
          >
            <legend className="px-1 text-sm font-medium text-zinc-100">
              {group.name}
            </legend>
            <p className="mb-2 flex justify-between gap-2 text-xs text-zinc-400">
              <span className={required ? "text-amber-200" : ""}>
                {selectionLabel}
              </span>
              <span className="tabular-nums">
                {selected.length} / {group.maxSelections}
              </span>
            </p>
            {group.options.length < group.minSelections && (
              <p
                role="status"
                className="mb-2 rounded-md bg-amber-300/10 px-2 py-1.5 text-xs text-amber-200"
              >
                There aren’t enough options available to meet this requirement.
              </p>
            )}
            <div className="grid gap-1.5">
              {group.options.map((option) => {
                const chosen = selectedIds.has(option.id);
                const disabled =
                  !chosen &&
                  group.maxSelections > 1 &&
                  selected.length >= group.maxSelections;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={chosen}
                    disabled={disabled}
                    onClick={() => toggle(group, option.id)}
                    className={`flex min-h-10 items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:opacity-45 ${
                      chosen
                        ? "border-emerald-300/45 bg-emerald-400/10 text-emerald-100"
                        : "border-zinc-700 bg-zinc-900/70 text-zinc-200 enabled:hover:border-emerald-300/40"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className={`grid size-4 shrink-0 place-items-center rounded border ${chosen ? "border-emerald-300 bg-emerald-300 text-emerald-950" : "border-zinc-500"}`}
                        aria-hidden="true"
                      >
                        {chosen && <Check className="size-3" />}
                      </span>
                      <span className="break-words">{option.name}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-zinc-300">
                      {option.extraPrice > 0
                        ? `+${formatMoney(option.extraPrice)}`
                        : option.extraPrice < 0
                          ? formatMoney(option.extraPrice)
                          : "Included"}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </WorkforceFormDialog>
  );
}
