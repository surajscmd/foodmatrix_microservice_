"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Plus, Search, X } from "lucide-react";
import type { CreateStockRequestInput } from "@/lib/inventory-api";
import { button, field, panel, primary, validQuantity } from "./inventory-view";

export interface IngredientOption {
  id: string;
  name: string;
  uom: string;
}

export function FormPanel({
  title,
  busy,
  onClose,
  children,
}: {
  title: string;
  busy: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className={`${panel} border-emerald-500/30`}>
      <div className="flex items-center justify-between gap-3 border-b border-emerald-400/15 bg-linear-to-r from-emerald-950 to-zinc-900 px-4 py-2">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <button
          type="button"
          aria-label="Close form"
          onClick={onClose}
          disabled={busy}
          className={button}
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
      {children}
    </section>
  );
}

function IngredientPicker({
  options,
  value,
  disabled,
  onChange,
}: {
  options: IngredientOption[];
  value: string;
  disabled: boolean;
  onChange: (id: string) => void;
}) {
  const id = useId();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const list = useRef<HTMLUListElement>(null);
  const expanded = open && !disabled;
  const selected = options.find((option) => option.id === value);
  const query = search.trim().toLowerCase();
  const matches = options.filter(({ name, uom }) =>
    `${name} ${uom}`.toLowerCase().includes(query),
  );
  const active = matches[activeIndex];

  function close() {
    setOpen(false);
    setActiveIndex(-1);
    setSearch("");
  }

  function choose(option: IngredientOption) {
    onChange(option.id);
    close();
  }

  useEffect(() => {
    if (expanded && activeIndex >= 0) {
      const results = list.current;
      const option = results?.children[activeIndex];
      if (!results || !option) return;
      const bounds = results.getBoundingClientRect();
      const row = option.getBoundingClientRect();
      if (row.top < bounds.top) results.scrollTop += row.top - bounds.top;
      else if (row.bottom > bounds.bottom)
        results.scrollTop += row.bottom - bounds.bottom;
    }
  }, [activeIndex, expanded]);

  return (
    <div className="relative min-w-0">
      <label htmlFor={id} className="mb-1 block text-xs text-zinc-300">
        Ingredient
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-3 size-4 text-zinc-400"
        />
        <input
          id={id}
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={`${id}-results`}
          aria-activedescendant={
            expanded && active ? `${id}-${active.id}` : undefined
          }
          className={`${field} pl-9`}
          placeholder="Search ingredients…"
          value={
            expanded
              ? search
              : selected
                ? `${selected.name} (${selected.uom})`
                : ""
          }
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={close}
          onChange={(event) => {
            setSearch(event.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && expanded) {
              event.preventDefault();
              close();
            } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              if (!matches.length) return;
              setOpen(true);
              setActiveIndex((index) =>
                event.key === "ArrowDown"
                  ? Math.min(index + 1, matches.length - 1)
                  : index <= 0
                    ? matches.length - 1
                    : index - 1,
              );
            } else if (
              event.key === "Enter" &&
              expanded &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              const option = active ?? matches[0];
              if (option) choose(option);
            }
          }}
        />
      </div>
      <div
        hidden={!expanded}
        className="mt-1 rounded-lg border border-zinc-700 bg-zinc-950 shadow-lg"
      >
        <ul
          id={`${id}-results`}
          ref={list}
          role="listbox"
          aria-label="Matching ingredients"
          className="max-h-56 overflow-y-auto p-1"
        >
          {expanded &&
            matches.map((option, index) => (
              <li
                key={option.id}
                id={`${id}-${option.id}`}
                role="option"
                aria-selected={option.id === value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
                className={`flex min-h-10 cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm ${index === activeIndex ? "bg-emerald-400/15 text-emerald-100" : "text-zinc-100 hover:bg-zinc-800"}`}
              >
                <span className="min-w-0 break-words">{option.name}</span>
                <span className="shrink-0 text-xs text-zinc-400">
                  {option.uom}
                </span>
              </li>
            ))}
        </ul>
        {expanded && !matches.length && (
          <p role="status" className="px-3 pb-2 text-sm text-zinc-300">
            No matching ingredients.
          </p>
        )}
      </div>
    </div>
  );
}
export default function InventoryRequestForm({
  options,
  preset,
  busy,
  error,
  onSubmit,
}: {
  options: IngredientOption[];
  preset: { id: string; amount: string } | null;
  busy: boolean;
  error: string;
  onSubmit: (data: Pick<CreateStockRequestInput, "items" | "reason">) => void;
}) {
  const [lines, setLines] = useState(() => [
    { key: 0, id: preset?.id ?? "", qty: preset?.amount ?? "" },
  ]);
  const [localError, setLocalError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const reason = String(
      new FormData(event.currentTarget).get("reason") ?? "",
    ).trim();
    if (
      lines.some(
        (line) =>
          !options.some((option) => option.id === line.id) ||
          !validQuantity(line.qty),
      ) ||
      new Set(lines.map((line) => line.id)).size !== lines.length
    ) {
      setLocalError(
        "Choose distinct ingredients and enter positive quantities with up to four decimal places.",
      );
      return;
    }
    setLocalError("");
    onSubmit({
      ...(reason ? { reason } : {}),
      items: lines.map((line) => ({
        ingredientId: line.id,
        requestedQty: Number(line.qty),
      })),
    });
  }

  return (
    <form className="space-y-3 p-4" onSubmit={submit}>
      {options.length === 0 && (
        <p role="status" className="text-sm text-zinc-300">
          No ingredients are available to request.
        </p>
      )}
      {lines.map((line, index) => (
        <div
          key={line.key}
          className="grid items-start gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_auto]"
        >
          <IngredientPicker
            options={options.filter(
              (option) =>
                !lines.some(
                  (row) => row.key !== line.key && row.id === option.id,
                ),
            )}
            value={line.id}
            disabled={busy}
            onChange={(id) => {
              setLines((previous) =>
                previous.map((row) =>
                  row.key === line.key ? { ...row, id } : row,
                ),
              );
            }}
          />
          <label className="grid gap-1 text-xs text-zinc-300">
            Quantity
            <input
              required
              inputMode="decimal"
              value={line.qty}
              disabled={busy}
              className={field}
              onChange={(event) => {
                const qty = event.target.value;
                setLines((previous) =>
                  previous.map((row) =>
                    row.key === line.key ? { ...row, qty } : row,
                  ),
                );
              }}
            />
          </label>
          <button
            type="button"
            disabled={busy || lines.length === 1}
            aria-label={`Remove ingredient line ${index + 1}`}
            className={`${button} sm:mt-5`}
            onClick={() =>
              setLines((previous) =>
                previous.filter((row) => row.key !== line.key),
              )
            }
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={busy || lines.length >= options.length}
        className={button}
        onClick={() =>
          setLines((previous) => [
            ...previous,
            {
              key: Math.max(...previous.map((row) => row.key)) + 1,
              id: "",
              qty: "",
            },
          ])
        }
      >
        <Plus aria-hidden="true" className="size-4" /> Add ingredient
      </button>
      <label className="grid gap-1 text-xs text-zinc-300">
        Reason (optional)
        <textarea
          name="reason"
          maxLength={500}
          rows={2}
          disabled={busy}
          className={field}
        />
      </label>
      {(localError || error) && (
        <p role="alert" className="text-sm text-rose-200">
          {localError || error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || !options.length}
        className={primary}
      >
        {busy ? "Sending…" : "Send request"}
      </button>
    </form>
  );
}
